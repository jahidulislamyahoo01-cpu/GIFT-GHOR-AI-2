import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth & Firestore
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Set prompt to select_account so user can easily switch or choose accounts
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export { signInWithPopup, signOut };
export default app;
