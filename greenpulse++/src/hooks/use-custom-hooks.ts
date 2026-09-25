/**
 * @license
 * GreenPulse AI — Custom React Hooks
 */

import { useState, useEffect } from 'react';

/**
 * Hook detecting device capabilities (GPU, low-power mode, CPU concurrency)
 */
export function useDeviceCaps() {
  const [caps, setCaps] = useState({
    isLowSpecGpu: false,
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
    supportsWebGL: true,
  });

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setCaps(c => ({ ...c, supportsWebGL: false, isLowSpecGpu: true }));
      }
    } catch {
      setCaps(c => ({ ...c, supportsWebGL: false, isLowSpecGpu: true }));
    }
  }, []);

  return caps;
}

/**
 * Hook detecting user's OS prefers-reduced-motion preference
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for responsive breakpoint detection
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

/**
 * Tabular JetBrains Mono numeral count-up animation hook
 */
export function useCounterAnimation(targetValue: number, durationMs: number = 800) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      // Ease out expo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCurrentValue(Math.floor(easeProgress * targetValue));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetValue, durationMs]);

  return currentValue;
}
