/**
 * One-time fix script to correct the userProjects document structure
 * 
 * Run this with: node fix-user-projects.js
 * 
 * This will:
 * 1. Read your userProjects document
 * 2. Flatten the nested {projects: {...}} structure to just {...}
 * 3. Update the document with the correct structure
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// Your Firebase config - REQUIRES .env file with actual credentials
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
};

// Validate that all required environment variables are set
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please create a .env file with your Firebase credentials.');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Your user ID
const USER_ID = 'Ed7gebwCciaICcLMgLrlEmNSeq33';

async function fixUserProjects() {
  try {
    console.log('Reading userProjects document...');
    const userProjectsRef = doc(db, 'userProjects', USER_ID);
    const userProjectsSnap = await getDoc(userProjectsRef);
    
    if (!userProjectsSnap.exists()) {
      console.log('No userProjects document found.');
      return;
    }
    
    const data = userProjectsSnap.data();
    console.log('Current data structure:', JSON.stringify(data, null, 2));
    
    // Check if data is in the wrong format (nested under 'projects')
    if (data.projects && typeof data.projects === 'object') {
      console.log('\n✅ Found nested structure! Flattening...');
      
      // Flatten: move all keys from data.projects to root level
      const flattenedData = { ...data.projects };
      
      console.log('New flattened structure:', JSON.stringify(flattenedData, null, 2));
      
      // Update the document
      await setDoc(userProjectsRef, flattenedData);
      
      console.log('\n✅ Success! userProjects document has been fixed.');
      console.log('You can now refresh your browser to see all your projects.');
    } else {
      console.log('\n✅ Data structure is already correct (flat). No changes needed.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
fixUserProjects()
  .then(() => {
    console.log('\nScript completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

