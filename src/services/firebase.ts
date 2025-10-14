import { initializeApp } from "firebase/app";
import { getAuth, type User } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
// import { getDatabase } from "firebase/database"; // TODO: Add when we implement cursors

// Re-export User type for convenience
export type { User };

const firebaseConfig = {
  apiKey: "AIzaSyDhkdE9gYwP3MfkFIKWY9GYwF0jdJEyA48",
  authDomain: "collabcanva-d9e10.firebaseapp.com",
  projectId: "collabcanva-d9e10",
  storageBucket: "collabcanva-d9e10.firebasestorage.app",
  messagingSenderId: "734003526041",
  appId: "1:734003526041:web:bba9d6be9fdd2931f87b08",
  measurementId: "G-T4FFDFR9WP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const rtdb = getDatabase(app); // TODO: Add when we implement cursors

// Optional: offline cache for Firestore (safe to ignore errors for multi-tab)
enableIndexedDbPersistence(db).catch(() => {});
