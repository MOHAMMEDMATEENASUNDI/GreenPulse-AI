/**
 * @license
 * GreenPulse AI — State Management Stores
 */

import { useState, useEffect } from 'react';
import { User, Company, GreenScoreData, LiveFeedEvent } from '../types/domain';
import { ThemeMode } from '../types/enums';
import { triggerGlassSweep } from '../utils/glass-sweep';
import { authService, SignupInput, LoginInput } from '../services/auth-service';

// Global mock state subscribers
type Listener = () => void;

interface AuthState {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

let authState: AuthState = {
  user: null,
  company: null,
  isAuthenticated: false,
  isOnboarded: true,
  isLoading: false,
  isInitialized: false,
};

const authListeners = new Set<Listener>();

export function useAuthStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    authListeners.add(listener);
    return () => { authListeners.delete(listener); };
  }, []);

  return {
    ...authState,
    setUser: (user: User | null) => {
      authState = { ...authState, user, isAuthenticated: !!user };
      authListeners.forEach(l => l());
    },
    setCompany: (company: Company | null) => {
      authState = { ...authState, company };
      authListeners.forEach(l => l());
    },
    setOnboarded: (isOnboarded: boolean) => {
      authState = { ...authState, isOnboarded };
      authListeners.forEach(l => l());
    },
    checkAuth: async () => {
      authState = { ...authState, isLoading: true };
      authListeners.forEach(l => l());
      try {
        const session = await authService.getMe();
        authState = {
          ...authState,
          user: session.user,
          company: session.company,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        };
        authListeners.forEach(l => l());
        return true;
      } catch {
        authState = {
          ...authState,
          user: null,
          company: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        };
        authListeners.forEach(l => l());
        return false;
      }
    },
    login: async (input: LoginInput) => {
      authState = { ...authState, isLoading: true };
      authListeners.forEach(l => l());
      try {
        const session = await authService.login(input);
        authState = {
          ...authState,
          user: session.user,
          company: session.company,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        };
        authListeners.forEach(l => l());
        return session;
      } catch (err) {
        authState = { ...authState, isLoading: false };
        authListeners.forEach(l => l());
        throw err;
      }
    },
    signup: async (input: SignupInput) => {
      authState = { ...authState, isLoading: true };
      authListeners.forEach(l => l());
      try {
        const session = await authService.signup(input);
        authState = {
          ...authState,
          user: session.user,
          company: session.company,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        };
        authListeners.forEach(l => l());
        return session;
      } catch (err) {
        authState = { ...authState, isLoading: false };
        authListeners.forEach(l => l());
        throw err;
      }
    },
    logout: async () => {
      authState = { ...authState, isLoading: true };
      authListeners.forEach(l => l());
      try {
        await authService.logout();
      } finally {
        authState = {
          user: null,
          company: null,
          isAuthenticated: false,
          isOnboarded: true,
          isLoading: false,
          isInitialized: true,
        };
        authListeners.forEach(l => l());
      }
    },
  };
}

interface UiState {
  isSidebarCollapsed: boolean;
  themeMode: ThemeMode;
  isFeedDrawerOpen: boolean;
  isCopilotDrawerOpen: boolean;
  activeModal: string | null;
}

let uiState: UiState = {
  isSidebarCollapsed: false,
  themeMode: ThemeMode.DARK,
  isFeedDrawerOpen: true,
  isCopilotDrawerOpen: false,
  activeModal: null,
};

const uiListeners = new Set<Listener>();

export function useUiStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    uiListeners.add(listener);
    return () => { uiListeners.delete(listener); };
  }, []);

  return {
    ...uiState,
    toggleSidebar: () => {
      uiState = { ...uiState, isSidebarCollapsed: !uiState.isSidebarCollapsed };
      uiListeners.forEach(l => l());
    },
    toggleTheme: () => {
      uiState = { ...uiState, themeMode: uiState.themeMode === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK };
      uiListeners.forEach(l => l());
      triggerGlassSweep();
    },
    toggleFeedDrawer: () => {
      uiState = { ...uiState, isFeedDrawerOpen: !uiState.isFeedDrawerOpen };
      uiListeners.forEach(l => l());
    },
    toggleCopilotDrawer: () => {
      uiState = { ...uiState, isCopilotDrawerOpen: !uiState.isCopilotDrawerOpen };
      uiListeners.forEach(l => l());
    },
    setActiveModal: (activeModal: string | null) => {
      uiState = { ...uiState, activeModal };
      uiListeners.forEach(l => l());
    },
  };
}
