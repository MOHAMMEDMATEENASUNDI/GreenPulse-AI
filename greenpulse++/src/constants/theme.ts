/**
 * @license
 * GreenPulse AI — Design System Token Definitions
 * Companion to Design System v1.0
 */

import { ColorTokens, MotionTokens } from '../types/theme';

export const DARK_THEME_COLORS: ColorTokens = {
  bgBase: '#0A0E14',
  bgSurface: '#12161F',
  bgSurfaceRaised: '#171C27',
  bgGlass: 'rgba(23, 28, 39, 0.55)',
  borderDefault: '#242B38',
  borderSubtle: '#1A1F2A',
  textPrimary: '#F4F6F8',
  textSecondary: '#8891A3',
  textTertiary: '#5B6472',
  emerald: '#2ED9A3',
  cyan: '#3FB6E8',
  violet: '#8B7FFF',
  warning: '#F5A623',
  error: '#F0554C',
  success: '#2ED9A3',
};

export const LIGHT_THEME_COLORS: ColorTokens = {
  bgBase: '#F7F8FA',
  bgSurface: '#FFFFFF',
  bgSurfaceRaised: '#F0F2F5',
  bgGlass: 'rgba(255, 255, 255, 0.75)',
  borderDefault: '#E3E6EB',
  borderSubtle: '#EEF0F4',
  textPrimary: '#12161F',
  textSecondary: '#5B6472',
  textTertiary: '#8891A3',
  emerald: '#12A97F',
  cyan: '#1E86BD',
  violet: '#6C5CE0',
  warning: '#B9740F',
  error: '#C43D34',
  success: '#12A97F',
};

export const AURORA_WEAVE_GRADIENT = 'linear-gradient(135deg, #2ED9A3 0%, #3FB6E8 50%, #8B7FFF 100%)';

export const SPACING_SCALE = {
  s0: '0px',
  s1: '4px',
  s2: '8px',
  s3: '12px',
  s4: '16px',
  s5: '20px',
  s6: '24px',
  s8: '32px',
  s10: '40px',
  s12: '48px',
  s16: '64px',
  s20: '80px',
};

export const RADIUS_SCALE = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
};

export const MOTION_TOKENS: MotionTokens = {
  durationInstant: 0.1,
  durationFast: 0.2,
  durationBase: 0.35,
  durationSlow: 0.6,
  durationDeliberate: 1.8,
  easeStandard: [0.4, 0.0, 0.2, 1.0],
  easeEntrance: [0.16, 1.0, 0.3, 1.0], // Expo out
  easeExit: [0.4, 0.0, 1.0, 1.0],
};
