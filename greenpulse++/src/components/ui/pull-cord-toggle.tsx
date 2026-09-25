/**
 * @license
 * GreenPulse AI — Futuristic Mission Control Pull Cord Theme Switcher
 * Featuring the signature Themed Miniature Earth Knob and physics engine.
 */

import React, { useState, useEffect } from 'react';
import { PullCord } from 'pullcord';
import 'pullcord/pullcord.css';
import { useUiStore } from '../../stores';
import { ThemeMode } from '../../types/enums';

export const PullCordToggle: React.FC = () => {
  const { themeMode, toggleTheme } = useUiStore();
  const [isPulseActive, setIsPulseActive] = useState(false);

  const isLight = themeMode === ThemeMode.LIGHT;

  const handlePull = () => {
    toggleTheme();
    setIsPulseActive(true);
    document.body.classList.add('app-energy-conduit-pulse');
    setTimeout(() => {
      setIsPulseActive(false);
      document.body.classList.remove('app-energy-conduit-pulse');
    }, 600);
  };

  return (
    <div className={`pull-cord-mission-control-wrapper ${isPulseActive ? 'pullcord-energy-pulse' : ''}`}>
      {/* Hidden SVG container defining the global #pc-knob SVG pattern for the Earth Knob */}
      <svg width="0" height="0" className="absolute pointer-events-none opacity-0">
        <defs>
          <pattern id="pc-knob" width="1" height="1" viewBox="0 0 100 100">
            {/* Ocean Base Radial Gradient */}
            <radialGradient id="earthOceanLight" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="55%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </radialGradient>

            <radialGradient id="earthOceanDark" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="60%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            {/* Aurora / Halo Glow Gradient */}
            <linearGradient id="auroraGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2ED9A3" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8B7FFF" stopOpacity="0.6" />
            </linearGradient>

            {/* Specular Highlight Gradient */}
            <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* Dark Mode Ocean Sphere Base */}
            <circle cx="50" cy="50" r="48" fill="url(#earthOceanDark)" style={{ transition: 'opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)', opacity: isLight ? 0 : 1 }} />
            {/* Light Mode Ocean Sphere Base */}
            <circle cx="50" cy="50" r="48" fill="url(#earthOceanLight)" style={{ transition: 'opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)', opacity: isLight ? 1 : 0 }} />

            {/* Dark Mode Emerald Environmental Halo Ring */}
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke="url(#auroraGlow)"
              strokeWidth="2.5"
              style={{ transition: 'opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)', opacity: isLight ? 0 : 0.85 }}
            />

            {/* Vector Continents */}
            <g
              fill={isLight ? '#10B981' : '#059669'}
              style={{ transition: 'fill 700ms cubic-bezier(0.16, 1, 0.3, 1), opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)', opacity: isLight ? 0.95 : 0.85 }}
            >
              {/* North America */}
              <path d="M 22 28 C 26 22, 38 20, 44 26 C 42 34, 32 38, 26 36 C 22 34, 20 30, 22 28 Z" />
              {/* South America */}
              <path d="M 34 42 C 40 44, 42 56, 36 68 C 30 64, 28 52, 34 42 Z" />
              {/* Eurasia / Africa */}
              <path d="M 50 24 C 62 18, 78 22, 80 34 C 74 44, 62 42, 54 36 C 50 30, 48 26, 50 24 Z" />
              <path d="M 52 40 C 60 42, 62 54, 56 64 C 50 62, 48 50, 52 40 Z" />
              {/* Australia */}
              <path d="M 72 58 C 80 58, 82 66, 76 70 C 70 68, 68 62, 72 58 Z" />
            </g>

            {/* Dark Mode Glowing City Lights & Green Grid Nodes */}
            <g style={{ transition: 'opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)', opacity: isLight ? 0 : 1 }}>
              {/* City Lights (Warm Amber & Sustainable Emerald) */}
              <circle cx="30" cy="28" r="1.5" fill="#F5A623" />
              <circle cx="36" cy="30" r="1.2" fill="#2ED9A3" />
              <circle cx="34" cy="48" r="1.2" fill="#F5A623" />
              <circle cx="58" cy="28" r="1.5" fill="#2ED9A3" />
              <circle cx="68" cy="30" r="1.4" fill="#F5A623" />
              <circle cx="74" cy="34" r="1.2" fill="#2ED9A3" />
              <circle cx="58" cy="46" r="1.3" fill="#F5A623" />
              <circle cx="74" cy="62" r="1.2" fill="#2ED9A3" />
              {/* Aurora Borealis Band over North Pole */}
              <path d="M 20 18 Q 50 10 80 18" fill="none" stroke="#2ED9A3" strokeWidth="2" opacity="0.65" strokeDasharray="3 2" />
            </g>

            {/* Light Mode Swirling Clouds */}
            <g
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ transition: 'opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)', opacity: isLight ? 0.75 : 0 }}
            >
              <path d="M 20 32 Q 35 25 50 34" />
              <path d="M 45 48 Q 65 40 82 52" />
              <path d="M 28 60 Q 45 68 60 58" />
            </g>

            {/* 3D Specular Glass Reflection Layer */}
            <ellipse cx="40" cy="35" rx="35" ry="25" fill="url(#glassShine)" />

            {/* Top Metallic Attachment Ring (Rope Connector) */}
            <rect x="44" y="2" width="12" height="6" rx="2" fill="#94A3B8" stroke="#475569" strokeWidth="0.8" />
          </pattern>
        </defs>
      </svg>

      {/* Official PullCord Component */}
      <PullCord
        onPull={handlePull}
        pulled={isLight}
        ariaLabel={isLight ? 'Pull Earth to switch to Mission Control Dark Mode' : 'Pull Earth to switch to Daylight Light Mode'}
        config={{
          gravity: 1200,
          damping: 0.93,
          iterations: 22,
          stretchMax: 28,
          stretchToggle: 18,
          maxVelocity: 24,
          sleepVelocity: 0.12,
        }}
      />
    </div>
  );
};
