/**
 * @license
 * GreenPulse AI — Router Definition
 * Enhanced with real authentication session check and route protection.
 */

import React, { useState, useEffect } from 'react';
import { triggerGlassSweep } from '../utils/glass-sweep';
import { useAuthStore } from '../stores';
import { Leaf } from 'lucide-react';
import {
  LandingPage,
  AuthPage,
  OnboardingPage,
  DashboardPage,
  CarbonPage,
  EnergyPage,
  ESGPage,
  WastePage,
  CopilotPage,
  ReportsPage,
  SettingsPage,
  RecommendationsPage,
} from '../pages/app-pages';
import { AppLayout, PublicLayout } from '../layouts/app-layouts';

export const AppRouter: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname || '/' : '/';
  });

  const { isAuthenticated, isLoading, isInitialized, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    triggerGlassSweep();
  };

  // Initial authentication check screen (prevents flash of unauthenticated login)
  if (!isInitialized && isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E14] flex flex-col items-center justify-center relative select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#2ED9A3] via-[#3FB6E8] to-[#8B7FFF] p-[1.5px] shadow-[0_0_30px_rgba(46,217,163,0.3)] animate-pulse">
            <div className="w-full h-full bg-[#0A0E14] rounded-[13px] flex items-center justify-center">
              <Leaf className="w-6 h-6 text-[#2ED9A3]" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-display font-semibold text-base text-[#F4F6F8] tracking-tight">
              GreenPulse AI
            </p>
            <p className="text-[11px] text-[#8891A3] font-mono mt-0.5 tracking-wider uppercase">
              Verifying Security Credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Public Landing Page
  if (currentPath === '/') {
    return (
      <PublicLayout>
        <LandingPage onNavigate={handleNavigate} />
      </PublicLayout>
    );
  }

  // If already authenticated and visiting login/signup, route straight to dashboard
  if ((currentPath === '/login' || currentPath === '/signup') && isAuthenticated) {
    return (
      <AppLayout activePath="/app/dashboard" onNavigate={handleNavigate}>
        <DashboardPage onNavigate={handleNavigate} />
      </AppLayout>
    );
  }

  // Auth Routes
  if (currentPath === '/login') {
    return <AuthPage initialView="login" onNavigate={handleNavigate} />;
  }
  if (currentPath === '/signup') {
    return <AuthPage initialView="signup" onNavigate={handleNavigate} />;
  }
  if (currentPath === '/forgot-password') {
    return <AuthPage initialView="forgot-password" onNavigate={handleNavigate} />;
  }

  // Protected Routes Guard: redirect unauthenticated requests to login
  const isProtectedRoute = currentPath.startsWith('/app/') || currentPath === '/onboarding';
  if (isProtectedRoute && !isAuthenticated) {
    return <AuthPage initialView="login" onNavigate={handleNavigate} />;
  }

  // Onboarding
  if (currentPath === '/onboarding') {
    return (
      <PublicLayout>
        <OnboardingPage onNavigate={handleNavigate} />
      </PublicLayout>
    );
  }

  // Authenticated App Shell Routes
  return (
    <AppLayout activePath={currentPath} onNavigate={handleNavigate}>
      {currentPath === '/app/dashboard' && <DashboardPage onNavigate={handleNavigate} />}
      {currentPath === '/app/recommendations' && <RecommendationsPage />}
      {currentPath === '/app/carbon' && <CarbonPage />}
      {currentPath === '/app/energy' && <EnergyPage />}
      {currentPath === '/app/esg' && <ESGPage />}
      {currentPath === '/app/waste' && <WastePage />}
      {currentPath === '/app/copilot' && <CopilotPage onNavigate={handleNavigate} />}
      {currentPath === '/app/reports' && <ReportsPage />}
      {currentPath === '/app/settings' && <SettingsPage />}
    </AppLayout>
  );
};
