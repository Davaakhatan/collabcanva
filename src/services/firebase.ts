import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, type User } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Re-export User type for convenience
export type { User };

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate that all required environment variables are present
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Missing Firebase configuration. Please ensure all VITE_FIREBASE_* environment variables are set in your .env file.'
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Realtime Database with error handling
let rtdbInstance;
try {
  rtdbInstance = getDatabase(app);
} catch (error) {
  console.warn('Realtime Database initialization failed:', error);
  console.warn('Multiplayer cursors and presence features will be disabled');
  // Create a mock database for development
  rtdbInstance = null;
}
export const rtdb = rtdbInstance;

// Set auth persistence to LOCAL (survives page refreshes and browser restarts)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Failed to set auth persistence:", error);
});

// Optional: offline cache for Firestore (safe to ignore errors for multi-tab)
enableIndexedDbPersistence(db).catch(() => {});
