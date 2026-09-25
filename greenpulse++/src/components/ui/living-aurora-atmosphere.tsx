/**
 * @license
 * GreenPulse AI — Living Atmospheric Aurora System
 * 60 FPS non-repeating, multi-layered organic background system.
 */

import React, { useEffect, useRef } from 'react';
import { useUiStore } from '../../stores';
import { ThemeMode } from '../../types/enums';

interface RGB {
  r: number;
  g: number;
  b: number;
}

const PALETTES = {
  [ThemeMode.DARK]: {
    // Deep Emerald, Deep Blue, Deep Purple
    orb1: { r: 5, g: 150, b: 105 },  // #059669
    orb2: { r: 2, g: 132, b: 199 },  // #0284C7
    orb3: { r: 124, g: 58, b: 237 }, // #7C3AED
    ambientOpacity: 0.18,
  },
  [ThemeMode.LIGHT]: {
    // Soft Green, Cyan, Golden Sunlight
    orb1: { r: 52, g: 211, b: 153 }, // #34D399
    orb2: { r: 56, g: 189, b: 248 }, // #38BDF8
    orb3: { r: 251, g: 191, b: 36 }, // #FBBF24
    ambientOpacity: 0.26,
  },
};

function lerp(start: number, end: number, amt: number) {
  return (1 - amt) * start + amt * end;
}

function lerpRGB(current: RGB, target: RGB, amt: number): RGB {
  return {
    r: lerp(current.r, target.r, amt),
    g: lerp(current.g, target.g, amt),
    b: lerp(current.b, target.b, amt),
  };
}

export const LivingAuroraAtmosphere: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { themeMode } = useUiStore();
  const themeRef = useRef(themeMode);

  useEffect(() => {
    themeRef.current = themeMode;
  }, [themeMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Current lerping color states
    let curOrb1 = { ...PALETTES[themeMode].orb1 };
    let curOrb2 = { ...PALETTES[themeMode].orb2 };
    let curOrb3 = { ...PALETTES[themeMode].orb3 };
    let curOpacity = PALETTES[themeMode].ambientOpacity;

    // Reactivity surge factor (swells on page navigate / score boost / boot)
    let surgeFactor = 0;

    // Listen for custom reactivity events
    const handleReactivityPulse = () => {
      surgeFactor = 1.0;
    };

    window.addEventListener('gp_aurora_pulse', handleReactivityPulse);
    window.addEventListener('popstate', handleReactivityPulse);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let startTime = performance.now();

    const render = (time: number) => {
      animId = requestAnimationFrame(render);

      const elapsed = (time - startTime) * 0.001; // in seconds

      // Smooth Lerp towards active theme colors (800ms feeling)
      const targetPalette = PALETTES[themeRef.current];
      curOrb1 = lerpRGB(curOrb1, targetPalette.orb1, 0.05);
      curOrb2 = lerpRGB(curOrb2, targetPalette.orb2, 0.05);
      curOrb3 = lerpRGB(curOrb3, targetPalette.orb3, 0.05);
      curOpacity = lerp(curOpacity, targetPalette.ambientOpacity, 0.05);

      // Decaying reactivity surge
      if (surgeFactor > 0.001) {
        surgeFactor *= 0.94; // Decay over ~600ms
      } else {
        surgeFactor = 0;
      }

      ctx.clearRect(0, 0, width, height);

      // Coprime Frequency Compounds so the wave pattern never repeats
      // Frequencies: 0.043, 0.031, 0.023, 0.017
      const x1 = width * (0.25 + 0.2 * Math.sin(elapsed * 0.043) + 0.1 * Math.cos(elapsed * 0.031));
      const y1 = height * (0.2 + 0.15 * Math.cos(elapsed * 0.037) + 0.08 * Math.sin(elapsed * 0.023));

      const x2 = width * (0.75 + 0.18 * Math.cos(elapsed * 0.029) + 0.12 * Math.sin(elapsed * 0.047));
      const y2 = height * (0.65 + 0.2 * Math.sin(elapsed * 0.033) + 0.1 * Math.cos(elapsed * 0.019));

      const x3 = width * (0.5 + 0.25 * Math.sin(elapsed * 0.017) + 0.1 * Math.cos(elapsed * 0.053));
      const y3 = height * (0.45 + 0.22 * Math.cos(elapsed * 0.023) + 0.12 * Math.sin(elapsed * 0.037));

      const baseRadius = Math.max(width, height) * 0.45 * (1 + surgeFactor * 0.15);
      const effectiveOpacity = Math.min(1, curOpacity * (1 + surgeFactor * 0.6));

      // Layer 1: Orb 1 (Emerald / Soft Green)
      const grad1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, baseRadius * 1.2);
      grad1.addColorStop(0, `rgba(${Math.round(curOrb1.r)}, ${Math.round(curOrb1.g)}, ${Math.round(curOrb1.b)}, ${effectiveOpacity})`);
      grad1.addColorStop(0.5, `rgba(${Math.round(curOrb1.r)}, ${Math.round(curOrb1.g)}, ${Math.round(curOrb1.b)}, ${effectiveOpacity * 0.3})`);
      grad1.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Layer 2: Orb 2 (Deep Blue / Cyan)
      const grad2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, baseRadius * 1.1);
      grad2.addColorStop(0, `rgba(${Math.round(curOrb2.r)}, ${Math.round(curOrb2.g)}, ${Math.round(curOrb2.b)}, ${effectiveOpacity * 0.85})`);
      grad2.addColorStop(0.6, `rgba(${Math.round(curOrb2.r)}, ${Math.round(curOrb2.g)}, ${Math.round(curOrb2.b)}, ${effectiveOpacity * 0.2})`);
      grad2.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Layer 3: Orb 3 (Deep Purple / Golden Sunlight)
      const grad3 = ctx.createRadialGradient(x3, y3, 0, x3, y3, baseRadius * 1.3);
      grad3.addColorStop(0, `rgba(${Math.round(curOrb3.r)}, ${Math.round(curOrb3.g)}, ${Math.round(curOrb3.b)}, ${effectiveOpacity * 0.75})`);
      grad3.addColorStop(0.55, `rgba(${Math.round(curOrb3.r)}, ${Math.round(curOrb3.g)}, ${Math.round(curOrb3.b)}, ${effectiveOpacity * 0.15})`);
      grad3.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, width, height);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('gp_aurora_pulse', handleReactivityPulse);
      window.removeEventListener('popstate', handleReactivityPulse);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 mix-blend-screen light:mix-blend-multiply opacity-90 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
};
