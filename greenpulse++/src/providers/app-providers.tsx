/**
 * @license
 * GreenPulse AI — Theme & Motion Context Providers
 */

import React, { createContext, useContext, useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { useUiStore, useAuthStore } from '../stores';
import { ThemeMode } from '../types/enums';
import { PullCordToggle } from '../components/ui/pull-cord-toggle';
import { MissionControlBootSequence } from '../components/ui/boot-sequence';
import { LivingAuroraAtmosphere } from '../components/ui/living-aurora-atmosphere';

const ThemeContext = createContext<{
  theme: ThemeMode;
  toggleTheme: () => void;
}>({
  theme: ThemeMode.DARK,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode, toggleTheme } = useUiStore();

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === ThemeMode.LIGHT) {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ theme: themeMode, toggleTheme }}>
      <LivingAuroraAtmosphere />
      <PullCordToggle />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MissionControlBootSequence />
      <MotionConfig reducedMotion="user">
        {children}
      </MotionConfig>
    </ThemeProvider>
  );
}
