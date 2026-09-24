import admin from 'firebase-admin';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let firebaseApp = null;

const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    try {
      const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey
        })
      });
      logger.info('Firebase Admin SDK initialized successfully for FCM push alerts');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK', { error: error.message });
    }
  } else {
    logger.info('Firebase credentials not configured. Running in Mock/Console Notification mode ($0 free tier dev)');
  }

  return firebaseApp;
};

export const getFirebaseApp = () => initFirebase();
export const getMessaging = () => {
  const app = initFirebase();
  return app ? admin.messaging(app) : null;
};
