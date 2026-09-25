/**
 * @license
 * GreenPulse AI — Logout Confirmation Modal with GreenPulse Guardian
 * Interactive logout workflow featuring the feral-blob GreenPulse Guardian.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GreenPulseGuardian } from './greenpulse-guardian';
import { Button } from '../ui/button';
import { LogOut, ArrowLeft, ShieldCheck } from 'lucide-react';
import type { JellyBlobMood } from './greenpulse-mascot';

export interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
}

export const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmLogout,
}) => {
  const [hoverState, setHoverState] = useState<'none' | 'cancel' | 'logout'>('none');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [farewellText, setFarewellText] = useState<string | null>(null);

  // Determine Guardian Mood & Interaction Properties
  const getGuardianMood = (): JellyBlobMood => {
    if (isLoggingOut) return 'happy';
    if (hoverState === 'cancel') return 'happy';
    if (hoverState === 'logout') return 'neutral';
    return 'sad';
  };

  const getGuardianGaze = () => {
    if (hoverState === 'cancel') return { x: 0, y: -5, intensity: 0.8 };
    if (hoverState === 'logout') return { x: 12, y: 10, intensity: 0.9 };
    return { x: 0, y: 8, intensity: 0.6 };
  };

  const handleLogoutClick = () => {
    setIsLoggingOut(true);
    setFarewellText('See you soon.');
    setTimeout(() => {
      onConfirmLogout();
    }, 1100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0E14]/80 backdrop-blur-md select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-sm w-full bg-[#12161F] border border-[#242B38] rounded-[16px] p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
          >
          {/* Subtle Aurora Ambient Glow */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-[#2ED9A3]/10 blur-3xl pointer-events-none" />

          {/* GreenPulse Guardian Companion */}
          <div className="mb-4">
            <GreenPulseGuardian
              mood={getGuardianMood()}
              gaze={getGuardianGaze()}
              happyEyes={hoverState === 'cancel' || isLoggingOut ? 'smile' : 'star'}
              nod={hoverState === 'logout'}
              mouth={isLoggingOut ? 'open' : undefined}
              greeting={farewellText || undefined}
              showGreeting={!!farewellText}
              size="lg"
            />
          </div>

          {/* Title & Body */}
          <h3 className="text-lg font-semibold text-[#F4F6F8] font-display">
            {isLoggingOut ? 'Signing Out...' : 'Sign Out of GreenPulse OS?'}
          </h3>
          <p className="text-xs text-[#8891A3] mt-1 mb-6 max-w-xs leading-relaxed">
            {isLoggingOut
              ? 'Securing active telemetry streams and saving workspace state.'
              : 'Your active carbon calculation telemetry and copilot session will be safely preserved.'}
          </p>

          {/* Action Buttons */}
          {!isLoggingOut ? (
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="secondary"
                size="md"
                onMouseEnter={() => setHoverState('cancel')}
                onMouseLeave={() => setHoverState('none')}
                onClick={onClose}
                className="w-full text-xs font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Stay Signed In
              </Button>

              <Button
                variant="destructive"
                size="md"
                onMouseEnter={() => setHoverState('logout')}
                onMouseLeave={() => setHoverState('none')}
                onClick={handleLogoutClick}
                className="w-full text-xs font-semibold bg-[#F0554C]/10 border-[#F0554C]/30 text-[#F0554C] hover:bg-[#F0554C] hover:text-[#0A0E14]"
              >
                Log Out <LogOut className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs font-data text-[#2ED9A3]">
              <span className="w-2 h-2 rounded-full bg-[#2ED9A3] animate-ping" />
              Closing session...
            </div>
          )}

          {/* Footer Security Badge */}
          <div className="mt-5 pt-3 border-t border-[#1A1F2A] w-full flex items-center justify-center gap-1.5 text-[10px] text-[#8891A3] font-data">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2ED9A3]" /> Encrypted Session Termination
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
