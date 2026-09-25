const admin = require('firebase-admin');
const env = require('./env');
const logger = require('../lib/logger');

let firestoreDb = null;
let isInitialized = false;

/**
 * Initialize Firebase Admin SDK once
 */
const initFirebase = () => {
  if (admin.apps.length > 0) {
    return {
      admin,
      db: admin.firestore(),
      isInitialized: true,
    };
  }

  try {
    if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
      // Clean up private key if escaped newlines were passed in env
      const formattedPrivateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: formattedPrivateKey,
        }),
      });
      isInitialized = true;
      logger.info({ projectId: env.FIREBASE_PROJECT_ID }, 'Firebase Admin SDK initialized successfully');
    } else {
      // In development or when credentials aren't supplied yet, avoid crashing server
      logger.warn('Firebase Admin credentials not fully provided; running in uninitialized/mock mode');
      return {
        admin,
        db: null,
        isInitialized: false,
      };
    }

    firestoreDb = admin.firestore();
    return {
      admin,
      db: firestoreDb,
      isInitialized,
    };
  } catch (error) {
    logger.error({ err: error.message }, 'Failed to initialize Firebase Admin SDK');
    return {
      admin,
      db: null,
      isInitialized: false,
    };
  }
};

const firebaseInstance = initFirebase();

/**
 * Check if Firestore is ready
 */
const isFirebaseReady = async () => {
  if (!firebaseInstance.isInitialized || !firebaseInstance.db) {
    return false;
  }
  try {
    // Lightweight ping / check
    await firebaseInstance.db.listCollections();
    return true;
  } catch (err) {
    logger.warn({ err: err.message }, 'Firestore readiness check failed');
    return false;
  }
};

module.exports = {
  admin: firebaseInstance.admin,
  db: firebaseInstance.db,
  isFirebaseReady,
  isInitialized: () => firebaseInstance.isInitialized,
};
