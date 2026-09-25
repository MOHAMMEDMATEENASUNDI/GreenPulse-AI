/**
 * @license
 * GreenPulse AI — GreenPulse Guardian Companion Component
 * Re-skins the official `feral-blob` JellyBlobMascot into GreenPulse AI's intelligent environmental companion.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { JellyBlobMascot, type JellyBlobMood } from './greenpulse-mascot';
import 'feral-blob/blob.css';
import { Leaf, Sparkles } from 'lucide-react';

export interface GreenPulseGuardianProps {
  mood?: JellyBlobMood;
  gaze?: { x: number; y: number; intensity?: number };
  happyEyes?: 'star' | 'smile';
  mouth?: 'open' | 'wide';
  nod?: boolean;
  greeting?: string;
  showGreeting?: boolean;
  showLeafParticles?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ariaLabel?: string;
}

export const GUARDIAN_GREETINGS = [
  "👋 Welcome back!",
  "🌱 Let's build a greener future.",
  "🤖 Your sustainability workspace is ready.",
  "🌍 Mission Control is standing by.",
];

export const GreenPulseGuardian: React.FC<GreenPulseGuardianProps> = ({
  mood = 'neutral',
  gaze,
  happyEyes = 'star',
  mouth,
  nod = false,
  greeting,
  showGreeting = false,
  showLeafParticles = false,
  size = 'md',
  className = '',
  ariaLabel = 'GreenPulse AI Environmental Guardian Companion',
}) => {
  const [activeGreeting, setActiveGreeting] = useState<string | null>(greeting || null);
  const [visibleGreeting, setVisibleGreeting] = useState(showGreeting);

  // Handle auto-fadeout of greeting after max 3s
  useEffect(() => {
    if (greeting) {
      setActiveGreeting(greeting);
      setVisibleGreeting(true);
      const timer = setTimeout(() => {
        setVisibleGreeting(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [greeting]);

  // Size mapping for the mascot wrapper
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
  }[size];

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center greenpulse-guardian ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Speech / Greeting Cloud */}
      <AnimatePresence>
        {visibleGreeting && activeGreeting && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none whitespace-nowrap"
          >
            <div className="px-3 py-1.5 rounded-full bg-[#12161F]/95 border border-[#2ED9A3]/40 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs font-medium text-[#F4F6F8]">
              <Sparkles className="w-3 h-3 text-[#2ED9A3] shrink-0" />
              <span>{activeGreeting}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Leaf Particles for Celebrations */}
      <AnimatePresence>
        {showLeafParticles && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-visible">
            {[
              { left: '20%', delay: '0s', rot: '12deg' },
              { left: '50%', delay: '0.15s', rot: '-18deg' },
              { left: '75%', delay: '0.3s', rot: '24deg' },
            ].map((p, idx) => (
              <div
                key={idx}
                className="absolute top-0 guardian-leaf-particle text-[#2ED9A3]"
                style={{
                  left: p.left,
                  animationDelay: p.delay,
                  transform: `rotate(${p.rot})`,
                }}
              >
                <Leaf className="w-4 h-4 opacity-80" />
              </div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Ambient Emerald Aura Glow behind Guardian */}
      <div className="absolute inset-0 rounded-full bg-[#2ED9A3]/15 blur-xl pointer-events-none animate-pulse scale-125" />

      {/* Main Mascot Container with Gentle Breathing / Floating Motion */}
      <motion.div
        initial={{ y: 0 }}
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
        className={`relative z-10 flex items-center justify-center ${sizeClasses}`}
      >
        <JellyBlobMascot
          mood={mood}
          gaze={gaze}
          happyEyes={happyEyes}
          mouth={mouth}
          nod={nod}
          className="w-full h-full filter drop-shadow-[0_4px_16px_rgba(46,217,163,0.3)]"
        />
      </motion.div>
    </div>
  );
};
