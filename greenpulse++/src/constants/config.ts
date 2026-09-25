/**
 * @license
 * GreenPulse AI — System Configuration Constants
 */

export const APP_CONFIG = {
  appName: 'GreenPulse AI',
  tagline: 'Real-time AI carbon intelligence operating system',
  version: '1.0.0-hackathon',
  maxConcurrentGlassBlurs: 4,
  maxLiveFeedBufferItems: 50,
  maxUploadFileSizeBytes: 15 * 1024 * 1024, // 15MB
  supportedUploadFormats: ['.csv', '.xlsx', '.xls'],
  targetFps: 60,
  earthMaxPolyCount: 5000,
  defaultCurrencySymbol: '₹',
  copilotMaxTokens: 1024,
};

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};
