/**
 * @license
 * GreenPulse AI — Environment Variable Loader
 */

export const ENV = {
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
  isProduction: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  firebaseConfig: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  },
};
