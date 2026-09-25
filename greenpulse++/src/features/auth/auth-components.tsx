/**
 * @license
 * GreenPulse AI — Premium Glassmorphism Authentication Suite
 * Mission Control Gateway: Login, Signup, Forgot Password, Reset Password, Email Verification, & Account Recovery
 * with GreenPulse Guardian (feral-blob) environmental companion integration.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  GreenPulseGuardian,
  GUARDIAN_GREETINGS,
} from '../../components/guardian/greenpulse-guardian';
import type { JellyBlobMood } from '../../components/guardian/greenpulse-mascot';
import {
  Leaf,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Check,
  Clock,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../../stores';

export interface AuthSuiteProps {
  initialView?:
    | 'login'
    | 'signup'
    | 'forgot-password'
    | 'reset-password'
    | 'verify-email'
    | 'account-recovery';
  onAuthSuccess: (userEmail: string, authType?: 'login' | 'signup') => void;
  onNavigateToLanding?: () => void;
}

export const AuthSuite: React.FC<AuthSuiteProps> = ({
  initialView = 'login',
  onAuthSuccess,
  onNavigateToLanding,
}) => {
  const { login, signup } = useAuthStore();
  const reduce = useReducedMotion();
  const [view, setView] = useState<
    | 'login'
    | 'signup'
    | 'forgot-password'
    | 'reset-password'
    | 'verify-email'
    | 'account-recovery'
  >(initialView);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Focus tracking for Guardian interactions
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Validation & Loading states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  // Guardian Greeting System (1 short greeting for max 3 seconds)
  const [initialGreeting, setInitialGreeting] = useState<string>('');
  const [showGreeting, setShowGreeting] = useState(true);

  useEffect(() => {
    // Pick one greeting naturally on mount
    const randomIdx = Math.floor(Math.random() * GUARDIAN_GREETINGS.length);
    setInitialGreeting(GUARDIAN_GREETINGS[randomIdx]);
    setShowGreeting(true);
  }, [view]);

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passStrength = getPasswordStrength(password || newPassword);

  // Compute Guardian Mood dynamically based on interaction state
  const getGuardianMood = (): JellyBlobMood => {
    if (isSuccess || verifySuccess || recoverySuccess) return 'happy';
    if (isLoading) return 'neutral';
    if (
      focusedField === 'password' ||
      focusedField === 'newPassword' ||
      focusedField === 'confirmPassword'
    ) {
      return 'password';
    }
    if (Object.keys(errors).length > 0) return 'sideEye';
    if (passStrength >= 3) return 'happy';
    if (
      focusedField === 'email' ||
      focusedField === 'fullName' ||
      focusedField === 'companyName'
    ) {
      return 'hmm';
    }
    return 'neutral';
  };

  // Compute Guardian Gaze dynamically
  const getGuardianGaze = () => {
    if (
      focusedField === 'password' ||
      focusedField === 'newPassword' ||
      focusedField === 'confirmPassword'
    ) {
      return { x: 35, y: -15, intensity: 1 }; // Respectfully look away and close eyes
    }
    if (focusedField === 'email') return { x: -12, y: 12, intensity: 0.85 };
    if (focusedField === 'fullName') return { x: -18, y: 10, intensity: 0.85 };
    if (focusedField === 'companyName') return { x: 14, y: 10, intensity: 0.85 };
    if (focusedField === 'verificationCode') return { x: 0, y: 16, intensity: 1 };
    if (focusedField === 'recoveryKey') return { x: -6, y: 14, intensity: 0.85 };
    return { x: 0, y: 0, intensity: 0.5 };
  };

  // Dynamic Environmental lighting hue based on focus state
  const getAmbientGlowClasses = () => {
    if (isSuccess || verifySuccess || recoverySuccess) {
      return 'bg-[#2ED9A3]/25 scale-110';
    }
    if (
      focusedField === 'password' ||
      focusedField === 'newPassword' ||
      focusedField === 'confirmPassword'
    ) {
      return 'bg-[#8B7FFF]/10 scale-95';
    }
    if (focusedField === 'email' || focusedField === 'fullName' || focusedField === 'companyName') {
      return 'bg-[#3FB6E8]/15 scale-105';
    }
    return 'bg-[#2ED9A3]/12 scale-100';
  };

  // Handlers
  const validateLoginForm = () => {
    const errs: Record<string, string> = {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid work email address.';
    }
    if (!password || password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSignupForm = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required.';
    if (!companyName.trim()) errs.companyName = 'Company name is required.';
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid work email address.';
    }
    if (!password || password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.';
    }
    if (!agreeTerms) {
      errs.terms = 'You must accept the terms of service and privacy policy.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setIsLoading(true);
    setErrors({});
    try {
      await login({ email, password });
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        onAuthSuccess(email, 'login');
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.message || 'Login failed. Please check your credentials.';
      setErrors({ form: msg });
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignupForm()) return;

    setIsLoading(true);
    setErrors({});
    try {
      await signup({
        email,
        password,
        fullName: fullName.trim() || undefined,
        companyName: companyName.trim() || undefined,
      });
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        onAuthSuccess(email, 'signup');
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.message || 'Registration failed. Please try again.';
      if (err?.code === 'USER_ALREADY_EXISTS') {
        setErrors({ form: msg, email: msg });
      } else {
        setErrors({ form: msg });
      }
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Please enter your registered work email.' });
      return;
    }

    setErrors({});
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setResetSent(true);
    }, 1000);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!newPassword || newPassword.length < 8) {
      errs.newPassword = 'New password must be at least 8 characters.';
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        setView('login');
        setIsSuccess(false);
      }, 1200);
    }, 1000);
  };

  const handleVerifyEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join('');
    if (code.length < 6) {
      setErrors({ code: 'Please enter the 6-digit security code sent to your email.' });
      return;
    }
    setErrors({});
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setVerifySuccess(true);
      setTimeout(() => {
        onAuthSuccess(email || 'leader@enterprise.com');
      }, 1000);
    }, 1000);
  };

  const handleAccountRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryKey.trim() || recoveryKey.length < 12) {
      setErrors({ recoveryKey: 'Enter a valid 16-character GreenPulse recovery key.' });
      return;
    }
    setErrors({});
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setRecoverySuccess(true);
      setTimeout(() => {
        onAuthSuccess('recovered.account@enterprise.com');
      }, 1000);
    }, 1200);
  };

  const fillDemoAccount = () => {
    setEmail('sustainability.lead@apex-mfg.com');
    setPassword('GreenPulse2026!');
    setFullName('Elena Rostova');
    setCompanyName('Apex Manufacturing Ltd.');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#0A0E14] flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Background Environmental Lighting & Micro Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Extremely faint technical grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(to right, #2ED9A3 1px, transparent 1px), linear-gradient(to bottom, #2ED9A3 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Central Reactive Radial Atmospheric Glow behind Guardian & Form */}
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[680px] h-[680px] rounded-full blur-[140px] transition-all duration-700 pointer-events-none ${getAmbientGlowClasses()}`}
        />

        {/* Subtle Ambient Vignette & Secondary Cyan/Violet Spotlights */}
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-[#3FB6E8]/[0.04] blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#8B7FFF]/[0.04] blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl w-full mx-auto flex items-center justify-between relative z-10"
      >
        <button
          onClick={onNavigateToLanding}
          className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ED9A3] rounded-lg p-1"
          aria-label="Return to GreenPulse AI home"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] bg-gradient-to-br from-[#2ED9A3] via-[#3FB6E8] to-[#8B7FFF] p-[1px] shadow-lg group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0A0E14] rounded-[9px] flex items-center justify-center">
              <Leaf className="w-4 h-4 text-[#2ED9A3]" />
            </div>
          </div>
          <div>
            <span className="font-display font-semibold text-base sm:text-lg text-[#F4F6F8] tracking-tight block">
              GreenPulse AI
            </span>
            <span className="text-[10px] text-[#8891A3] font-mono block -mt-0.5 sm:hidden">
              Mission Control
            </span>
          </div>
        </button>

        <button
          onClick={fillDemoAccount}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#12161F]/90 border border-[#242B38] hover:border-[#2ED9A3]/60 hover:bg-[#171C27] hover:shadow-[0_0_15px_rgba(46,217,163,0.15)] text-xs font-mono text-[#2ED9A3] transition-all cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ED9A3]"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#2ED9A3] group-hover:rotate-12 transition-transform" />{' '}
          Quick Fill Demo Credentials
        </button>
      </motion.div>

      {/* Main Glassmorphic Form Container with Integrated Guardian */}
      <div className="max-w-md w-full mx-auto my-auto py-6 sm:py-8 relative z-10">
        {/* Guardian Mascot Hero Banner (Intentionally Watching Over Access Gateway) */}
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center mb-3 sm:mb-4 relative"
        >
          <GreenPulseGuardian
            mood={getGuardianMood()}
            gaze={getGuardianGaze()}
            happyEyes={passStrength >= 3 || isSuccess ? 'star' : 'smile'}
            nod={isLoading}
            mouth={isLoading ? 'open' : undefined}
            greeting={initialGreeting}
            showGreeting={showGreeting}
            showLeafParticles={isSuccess || verifySuccess || recoverySuccess || passStrength >= 4}
            size="md"
          />
        </motion.div>

        {/* Architectural Glass Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative group/card"
        >
          {/* Specular Ambient Edge Glow Line along top */}
          <div className="absolute -top-[1px] left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#2ED9A3]/40 to-transparent pointer-events-none z-20" />

          <Card
            variant="raised"
            className="p-6 sm:p-8 backdrop-blur-2xl bg-[#0E131F]/85 border border-[#242B38]/90 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.75),0_0_30px_-5px_rgba(46,217,163,0.04)] relative overflow-hidden rounded-2xl"
          >
            {/* Header Switcher */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1A1F2A]/90">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2ED9A3] animate-pulse" />
                <span className="text-[11px] font-semibold text-[#8891A3] uppercase tracking-wider font-mono">
                  Enterprise Single Sign-On
                </span>
              </div>

              {/* Smooth Animated Tab Switcher */}
              <div className="flex bg-[#0A0E14] p-1 rounded-full border border-[#1E2532] text-xs font-medium relative">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setErrors({});
                    setIsSuccess(false);
                  }}
                  className={`px-3 py-1 rounded-full transition-colors relative z-10 whitespace-nowrap text-xs font-medium focus:outline-none ${
                    view === 'login' ? 'text-[#2ED9A3] font-semibold' : 'text-[#8891A3] hover:text-[#F4F6F8]'
                  }`}
                >
                  {view === 'login' && (
                    <motion.div
                      layoutId="authTabPill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 bg-[#171C27] border border-[#2ED9A3]/30 rounded-full -z-10 shadow-sm"
                    />
                  )}
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView('signup');
                    setErrors({});
                    setIsSuccess(false);
                  }}
                  className={`px-3 py-1 rounded-full transition-colors relative z-10 whitespace-nowrap text-xs font-medium focus:outline-none ${
                    view === 'signup' ? 'text-[#2ED9A3] font-semibold' : 'text-[#8891A3] hover:text-[#F4F6F8]'
                  }`}
                >
                  {view === 'signup' && (
                    <motion.div
                      layoutId="authTabPill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 bg-[#171C27] border border-[#2ED9A3]/30 rounded-full -z-10 shadow-sm"
                    />
                  )}
                  Register
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* 1. LOGIN VIEW */}
              {view === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  onSubmit={handleLoginSubmit}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-[#F4F6F8] font-display tracking-tight">
                      Welcome Back
                    </h2>
                    <p className="text-xs text-[#8891A3] mt-0.5 leading-relaxed">
                      Access your live carbon telemetry and SEBI BRSR reports.
                    </p>
                  </div>

                  {errors.form && (
                    <div className="p-2.5 rounded-lg bg-[#F0554C]/10 border border-[#F0554C]/30 text-[#F0554C] text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-[#F0554C]" />
                      <span>{errors.form}</span>
                    </div>
                  )}

                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="login-email" className="text-xs font-medium text-[#F4F6F8]">
                      Work Email Address
                    </label>
                    <div
                      className={`relative rounded-[9px] bg-[#0A0E14] border transition-all duration-200 group/field ${
                        errors.email
                          ? 'border-[#F0554C] shadow-[0_0_10px_rgba(240,85,76,0.15)]'
                          : focusedField === 'email'
                          ? 'border-[#2ED9A3] ring-1 ring-[#2ED9A3]/30 shadow-[0_0_15px_-3px_rgba(46,217,163,0.18)]'
                          : 'border-[#242B38] hover:border-[#353E4F]'
                      }`}
                    >
                      <Mail
                        className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                          focusedField === 'email' ? 'text-[#2ED9A3]' : 'text-[#8891A3]'
                        }`}
                      />
                      <input
                        id="login-email"
                        type="email"
                        value={email}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        onChange={e => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        placeholder="sustainability.lead@apex-mfg.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent text-xs text-[#F4F6F8] placeholder-[#8891A3]/45 focus:outline-none"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] text-[#F0554C] flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="login-password" className="text-xs font-medium text-[#F4F6F8]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setView('forgot-password');
                          setErrors({});
                        }}
                        className="text-[11px] text-[#2ED9A3] hover:underline focus:outline-none"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div
                      className={`relative rounded-[9px] bg-[#0A0E14] border transition-all duration-200 group/field ${
                        errors.password
                          ? 'border-[#F0554C] shadow-[0_0_10px_rgba(240,85,76,0.15)]'
                          : focusedField === 'password'
                          ? 'border-[#2ED9A3] ring-1 ring-[#2ED9A3]/30 shadow-[0_0_15px_-3px_rgba(46,217,163,0.18)]'
                          : 'border-[#242B38] hover:border-[#353E4F]'
                      }`}
                    >
                      <Lock
                        className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                          focusedField === 'password' ? 'text-[#2ED9A3]' : 'text-[#8891A3]'
                        }`}
                      />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        onChange={e => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors({ ...errors, password: '' });
                        }}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-transparent text-xs text-[#F4F6F8] placeholder-[#8891A3]/45 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8891A3] hover:text-[#F4F6F8] transition-colors focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[11px] text-[#F0554C] flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#0A0E14] border-[#242B38] text-[#2ED9A3] focus:ring-0 accent-[#2ED9A3] cursor-pointer"
                    />
                    <label htmlFor="rememberMe" className="text-xs text-[#8891A3] cursor-pointer">
                      Remember session on this workstation
                    </label>
                  </div>

                  {/* Alternative Recovery Links */}
                  <div className="flex items-center justify-between text-[11px] text-[#8891A3] pt-1">
                    <button
                      type="button"
                      onClick={() => setView('verify-email')}
                      className="hover:text-[#2ED9A3] transition-colors focus:outline-none"
                    >
                      Email Verification
                    </button>
                    <button
                      type="button"
                      onClick={() => setView('account-recovery')}
                      className="hover:text-[#3FB6E8] transition-colors focus:outline-none"
                    >
                      Account Recovery Key
                    </button>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.985 }}>
                      <Button
                        size="lg"
                        isLoading={isLoading}
                        className="w-full h-11 text-xs font-semibold shadow-lg shadow-[#2ED9A3]/20 group/btn relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center justify-center">
                          Sign In to GreenPulse OS
                          <ArrowRight className="w-4 h-4 ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
                        </span>
                      </Button>
                    </motion.div>
                  </div>
                </motion.form>
              )}

              {/* 2. SIGNUP VIEW */}
              {view === 'signup' && (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  onSubmit={handleSignupSubmit}
                  className="space-y-3.5"
                >
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-[#F4F6F8] font-display tracking-tight">
                      Create Enterprise Account
                    </h2>
                    <p className="text-xs text-[#8891A3] mt-0.5 leading-relaxed">
                      Automate corporate carbon disclosures and net-zero tracking.
                    </p>
                  </div>

                  {errors.form && (
                    <div className="p-2.5 rounded-lg bg-[#F0554C]/10 border border-[#F0554C]/30 text-[#F0554C] text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-[#F0554C]" />
                      <span>{errors.form}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label htmlFor="signup-name" className="text-xs font-medium text-[#F4F6F8]">
                        Full Name
                      </label>
                      <div
                        className={`relative rounded-[9px] bg-[#0A0E14] border transition-all duration-200 ${
                          focusedField === 'fullName'
                            ? 'border-[#2ED9A3] ring-1 ring-[#2ED9A3]/30'
                            : 'border-[#242B38] hover:border-[#353E4F]'
                        }`}
                      >
                        <User
                          className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                            focusedField === 'fullName' ? 'text-[#2ED9A3]' : 'text-[#8891A3]'
                          }`}
                        />
                        <input
                          id="signup-name"
                          type="text"
                          value={fullName}
                          onFocus={() => setFocusedField('fullName')}
                          onBlur={() => setFocusedField(null)}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="Elena Rostova"
                          className="w-full pl-9 pr-3 py-2 bg-transparent text-xs text-[#F4F6F8] placeholder-[#8891A3]/45 focus:outline-none"
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-[10px] text-[#F0554C]">{errors.fullName}</p>
                      )}
                    </div>

                    {/* Company Name */}
                    <div className="space-y-1">
                      <label htmlFor="signup-company" className="text-xs font-medium text-[#F4F6F8]">
                        Company Name
                      </label>
                      <div
                        className={`relative rounded-[9px] bg-[#0A0E14] border transition-all duration-200 ${
                          focusedField === 'companyName'
                            ? 'border-[#2ED9A3] ring-1 ring-[#2ED9A3]/30'
                            : 'border-[#242B38] hover:border-[#353E4F]'
                        }`}
                      >
                        <Building2
                          className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                            focusedField === 'companyName' ? 'text-[#2ED9A3]' : 'text-[#8891A3]'
                          }`}
                        />
                        <input
                          id="signup-company"
                          type="text"
                          value={companyName}
                          onFocus={() => setFocusedField('companyName')}
                          onBlur={() => setFocusedField(null)}
                          onChange={e => setCompanyName(e.target.value)}
                          placeholder="Apex Mfg Ltd."
                          className="w-full pl-9 pr-3 py-2 bg-transparent text-xs text-[#F4F6F8] placeholder-[#8891A3]/45 focus:outline-none"
                        />
                      </div>
                      {errors.companyName && (
                        <p className="text-[10px] text-[#F0554C]">{errors.companyName}</p>
                      )}
                    </div>
                  </div>

                  {/* Work Email */}
                  <div className="space-y-1">
                    <label htmlFor="signup-email" className="text-xs font-medium text-[#F4F6F8]">
                      Work Email
                    </label>
                    <div
                      className={`relative rounded-[9px] bg-[#0A0E14] border transition-all duration-200 ${
                        errors.email
                          ? 'border-[#F0554C]'
                          : focusedField === 'email'
                          ? 'border-[#2ED9A3] ring-1 ring-[#2ED9A3]/30'
                          : 'border-[#242B38] hover:border-[#353E4F]'
                      }`}
                    >
                      <Mail
                        className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                          focusedField === 'email' ? 'text-[#2ED9A3]' : 'text-[#8891A3]'
                        }`}
                      />
                      <input
                        id="signup-email"
                        type="email"
                        value={email}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="sustainability.lead@apex-mfg.com"
                        className="w-full pl-10 pr-4 py-2 bg-transparent text-xs text-[#F4F6F8] placeholder-[#8891A3]/45 focus:outline-none"
                      />
                    </div>
                    {errors.email && <p className="text-[11px] text-[#F0554C]">{errors.email}</p>}
                  </div>

                  {/* Password & Strength Meter */}
                  <div className="space-y-1">
                    <label htmlFor="signup-password" className="text-xs font-medium text-[#F4F6F8]">
                      Password
                    </label>
                    <div
                      className={`relative rounded-[9px] bg-[#0A0E14] border transition-all duration-200 ${
                        errors.password
                          ? 'border-[#F0554C]'
                          : focusedField === 'password'
                          ? 'border-[#2ED9A3] ring-1 ring-[#2ED9A3]/30'
                          : 'border-[#242B38] hover:border-[#353E4F]'
                      }`}
                    >
                      <Lock
                        className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                          focusedField === 'password' ? 'text-[#2ED9A3]' : 'text-[#8891A3]'
                        }`}
                      />
                      <input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min 8 chars with symbols"
                        className="w-full pl-10 pr-10 py-2 bg-transparent text-xs text-[#F4F6F8] placeholder-[#8891A3]/45 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8891A3] hover:text-[#F4F6F8] transition-colors focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator Bars */}
                    {password.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4].map(bar => (
                            <div
                              key={bar}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                passStrength >= bar
                                  ? passStrength >= 3
                                    ? 'bg-[#2ED9A3]'
                                    : passStrength === 2
                                    ? 'bg-[#F5A623]'
                                    : 'bg-[#F0554C]'
                                  : 'bg-[#1D2432]'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-[#8891A3] font-mono block text-right">
                          Password Strength:{' '}
                          {passStrength >= 4
                            ? 'Very Strong'
                            : passStrength === 3
                            ? 'Good'
                            : passStrength === 2
                            ? 'Fair'
                            : 'Weak'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Terms Agreement Checkbox */}
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeTerms}
                      onChange={e => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded bg-[#0A0E14] border-[#242B38] text-[#2ED9A3] focus:ring-0 accent-[#2ED9A3] cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-[11px] text-[#8891A3] leading-tight cursor-pointer">
                      I agree to the{' '}
                      <span className="text-[#F4F6F8] underline">
                        GHG Protocol Data Security Terms
                      </span>{' '}
                      and <span className="text-[#F4F6F8] underline">SEBI Privacy Guidelines</span>.
                    </label>
                  </div>
                  {errors.terms && <p className="text-[11px] text-[#F0554C]">{errors.terms}</p>}

                  {/* Submit Signup Button */}
                  <div className="pt-2">
                    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.985 }}>
                      <Button
                        size="lg"
                        isLoading={isLoading}
                        className="w-full h-11 text-xs font-semibold shadow-lg shadow-[#2ED9A3]/20 group/btn relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center justify-center">
                          Register & Begin Onboarding
                          <ArrowRight className="w-4 h-4 ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
                        </span>
                      </Button>
                    </motion.div>
                  </div>
                </motion.form>
              )}

              {/* 3. FORGOT PASSWORD VIEW */}
              {view === 'forgot-password' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4"
                >
                  <button
                    onClick={() => {
                      setView('login');
                      setResetSent(false);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-[#8891A3] hover:text-[#2ED9A3] transition-colors mb-1 focus:outline-none"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </button>

                  {!resetSent ? (
                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-[#F4F6F8] font-display tracking-tight">
                          Reset Security Credentials
                        </h2>
                        <p className="text-xs text-[#8891A3] mt-0.5 leading-relaxed">
                          Enter your corporate email address to receive an encrypted password reset
                          link.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="forgot-email" className="text-xs font-medium text-[#F4F6F8]">
                          Work Email Address
                        </label>
                        <div
                          className={`relative rounded-[9px] bg-[#0A0E14] border transition-all duration-200 ${
                            errors.email
                              ? 'border-[#F0554C]'
                              : focusedField === 'email'
                              ? 'border-[#2ED9A3] ring-1 ring-[#2ED9A3]/30'
                              : 'border-[#242B38] hover:border-[#353E4F]'
                          }`}
                        >
                          <Mail
                            className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                              focusedField === 'email' ? 'text-[#2ED9A3]' : 'text-[#8891A3]'
                            }`}
                          />
                          <input
                            id="forgot-email"
                            type="email"
                            value={email}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="sustainability.lead@apex-mfg.com"
                            className="w-full pl-10 pr-4 py-2.5 bg-transparent text-xs text-[#F4F6F8] placeholder-[#8891A3]/45 focus:outline-none"
                          />
                        </div>
                        {errors.email && <p className="text-[11px] text-[#F0554C]">{errors.email}</p>}
                      </div>

                      <div className="pt-2">
                        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.985 }}>
                          <Button
                            size="lg"
                            isLoading={isLoading}
                            className="w-full h-11 text-xs font-semibold shadow-lg shadow-[#2ED9A3]/20"
                          >
                            Send Secure Reset Link <KeyRound className="w-4 h-4 ml-1.5" />
                          </Button>
                        </motion.div>
                      </div>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setView('reset-password')}
                          className="text-[11px] text-[#3FB6E8] hover:underline focus:outline-none"
                        >
                          Already have a reset code? Set New Password
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center space-y-4 py-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2ED9A3] via-[#3FB6E8] to-[#8B7FFF] p-[1px] mx-auto shadow-lg">
                        <div className="w-full h-full bg-[#0A0E14] rounded-full flex items-center justify-center">
                          <Check className="w-6 h-6 text-[#2ED9A3]" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[#F4F6F8]">
                          Reset Instructions Sent!
                        </h3>
                        <p className="text-xs text-[#8891A3] mt-1 max-w-xs mx-auto">
                          We sent an encrypted recovery link to{' '}
                          <span className="text-[#2ED9A3] font-mono">{email}</span>. Please check
                          your inbox.
                        </p>
                      </div>

                      <div className="p-3 rounded-[9px] bg-[#0A0E14] border border-[#242B38] inline-flex items-center gap-2 text-xs text-[#8891A3] font-mono">
                        <Clock className="w-4 h-4 text-[#2ED9A3]" /> Resend link available in 45s
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setView('login')}
                        className="w-full mt-2"
                      >
                        Return to Sign In
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* 4. RESET PASSWORD VIEW */}
              {view === 'reset-password' && (
                <motion.form
                  key="reset"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  onSubmit={handleResetPasswordSubmit}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="inline-flex items-center gap-1.5 text-xs text-[#8891A3] hover:text-[#2ED9A3] transition-colors mb-1 focus:outline-none"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </button>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-[#F4F6F8] font-display tracking-tight">
                      Set New Password
                    </h2>
                    <p className="text-xs text-[#8891A3] mt-0.5 leading-relaxed">
                      Choose a strong password to protect your corporate telemetry data.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reset-new-password" className="text-xs font-medium text-[#F4F6F8]">
                      New Password
                    </label>
                    <div
                      className={`relative rounded-[9px] bg-[#0A0E14] border transition-all duration-200 ${
                        errors.newPassword
                          ? 'border-[#F0554C]'
                          : focusedField === 'newPassword'
                          ? 'border-[#2ED9A3] ring-1 ring-[#2ED9A3]/30'
                          : 'border-[#242B38] hover:border-[#353E4F]'
                      }`}
                    >
                      <Lock
                        className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                          focusedField === 'newPassword' ? 'text-[#2ED9A3]' : 'text-[#8891A3]'
                        }`}
                      />
                      <input
                        id="reset-new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onFocus={() => setFocusedField('newPassword')}
                        onBlur={() => setFocusedField(null)}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-transparent text-xs text-[#F4F6F8] placeholder-[#8891A3]/45 focus:outline-none"
                      />
                    </div>
                    {errors.newPassword && (
                      <p className="text-[11px] text-[#F0554C]">{errors.newPassword}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reset-confirm-password" className="text-xs font-medium text-[#F4F6F8]">
                      Confirm Password
                    </label>
                    <div
                      className={`relative rounded-[9px] bg-[#0A0E14] border transition-all duration-200 ${
                        errors.confirmPassword
                          ? 'border-[#F0554C]'
                          : focusedField === 'confirmPassword'
                          ? 'border-[#2ED9A3] ring-1 ring-[#2ED9A3]/30'
                          : 'border-[#242B38] hover:border-[#353E4F]'
                      }`}
                    >
                      <Lock
                        className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                          focusedField === 'confirmPassword' ? 'text-[#2ED9A3]' : 'text-[#8891A3]'
                        }`}
                      />
                      <input
                        id="reset-confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-transparent text-xs text-[#F4F6F8] placeholder-[#8891A3]/45 focus:outline-none"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] text-[#F0554C]">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.985 }}>
                      <Button
                        size="lg"
                        isLoading={isLoading}
                        className="w-full h-11 text-xs font-semibold shadow-lg shadow-[#2ED9A3]/20"
                      >
                        Update Password & Sign In <KeyRound className="w-4 h-4 ml-1.5" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.form>
              )}

              {/* 5. EMAIL VERIFICATION VIEW */}
              {view === 'verify-email' && (
                <motion.form
                  key="verify"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  onSubmit={handleVerifyEmailSubmit}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="inline-flex items-center gap-1.5 text-xs text-[#8891A3] hover:text-[#2ED9A3] transition-colors mb-1 focus:outline-none"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </button>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-[#F4F6F8] font-display tracking-tight">
                      Email Verification
                    </h2>
                    <p className="text-xs text-[#8891A3] mt-0.5 leading-relaxed">
                      Enter the 6-digit security pin sent to your work inbox.
                    </p>
                  </div>

                  <div className="flex justify-between gap-2 py-2">
                    {[0, 1, 2, 3, 4, 5].map(idx => (
                      <input
                        key={idx}
                        id={`code-pin-${idx}`}
                        type="text"
                        maxLength={1}
                        value={verificationCode[idx] || ''}
                        onFocus={() => setFocusedField('verificationCode')}
                        onBlur={() => setFocusedField(null)}
                        onChange={e => {
                          const val = e.target.value;
                          const newCode = [...verificationCode];
                          newCode[idx] = val;
                          setVerificationCode(newCode);
                          if (val && idx < 5) {
                            const nextInput = document.getElementById(`code-pin-${idx + 1}`);
                            nextInput?.focus();
                          }
                        }}
                        className="w-11 h-12 text-center text-lg font-mono font-bold rounded-[9px] bg-[#0A0E14] border border-[#242B38] focus:border-[#2ED9A3] focus:ring-1 focus:ring-[#2ED9A3]/30 text-[#2ED9A3] focus:outline-none transition-all"
                      />
                    ))}
                  </div>
                  {errors.code && <p className="text-[11px] text-[#F0554C]">{errors.code}</p>}

                  <div className="pt-2">
                    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.985 }}>
                      <Button
                        size="lg"
                        isLoading={isLoading}
                        className="w-full h-11 text-xs font-semibold shadow-lg shadow-[#2ED9A3]/20"
                      >
                        Verify & Continue <CheckCircle2 className="w-4 h-4 ml-1.5" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.form>
              )}

              {/* 6. ACCOUNT RECOVERY VIEW */}
              {view === 'account-recovery' && (
                <motion.form
                  key="recovery"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  onSubmit={handleAccountRecoverySubmit}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="inline-flex items-center gap-1.5 text-xs text-[#8891A3] hover:text-[#2ED9A3] transition-colors mb-1 focus:outline-none"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </button>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-[#F4F6F8] font-display tracking-tight">
                      Account Recovery Key
                    </h2>
                    <p className="text-xs text-[#8891A3] mt-0.5 leading-relaxed">
                      Use your emergency 16-character GreenPulse vault key to restore admin access.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="recovery-key" className="text-xs font-medium text-[#F4F6F8]">
                      16-Character Vault Security Key
                    </label>
                    <div
                      className={`relative rounded-[9px] bg-[#0A0E14] border transition-all duration-200 ${
                        errors.recoveryKey
                          ? 'border-[#F0554C]'
                          : focusedField === 'recoveryKey'
                          ? 'border-[#3FB6E8] ring-1 ring-[#3FB6E8]/30'
                          : 'border-[#242B38] hover:border-[#353E4F]'
                      }`}
                    >
                      <ShieldAlert
                        className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                          focusedField === 'recoveryKey' ? 'text-[#3FB6E8]' : 'text-[#8891A3]'
                        }`}
                      />
                      <input
                        id="recovery-key"
                        type="text"
                        value={recoveryKey}
                        onFocus={() => setFocusedField('recoveryKey')}
                        onBlur={() => setFocusedField(null)}
                        onChange={e => setRecoveryKey(e.target.value)}
                        placeholder="GP-2026-X99B-814A"
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent text-xs font-mono text-[#F4F6F8] placeholder-[#8891A3]/45 focus:outline-none"
                      />
                    </div>
                    {errors.recoveryKey && (
                      <p className="text-[11px] text-[#F0554C]">{errors.recoveryKey}</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.985 }}>
                      <Button
                        size="lg"
                        isLoading={isLoading}
                        className="w-full h-11 text-xs font-semibold shadow-lg shadow-[#3FB6E8]/20"
                      >
                        Restore Access <RefreshCw className="w-4 h-4 ml-1.5" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>

      {/* Footer Security Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#8891A3] font-mono border-t border-[#1A1F2A]/80 pt-4 relative z-10"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#2ED9A3]" /> SOC-2 Type II Certified • 256-Bit TLS Security
        </div>
        <span>GreenPulse AI Enterprise OS v2.4</span>
      </motion.div>
    </div>
  );
};

