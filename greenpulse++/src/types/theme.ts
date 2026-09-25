/**
 * @license
 * GreenPulse AI — Theme Token Interfaces
 */

export interface ColorTokens {
  bgBase: string;
  bgSurface: string;
  bgSurfaceRaised: string;
  bgGlass: string;
  borderDefault: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  emerald: string;
  cyan: string;
  violet: string;
  warning: string;
  error: string;
  success: string;
}

export interface MotionTokens {
  durationInstant: number;
  durationFast: number;
  durationBase: number;
  durationSlow: number;
  durationDeliberate: number;
  easeStandard: number[];
  easeEntrance: number[];
  easeExit: number[];
}
