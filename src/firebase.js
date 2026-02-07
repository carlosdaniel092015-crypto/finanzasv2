// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBeNHyzX5bJoNccS9BWrVJ8oBjAQ4oEVxk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "finanzas-e77d6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "finanzas-e77d6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "finanzas-e77d6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "687649991953",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:687649991953:web:ac9aa7bfcdc83fe3c030b0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9KBGC2PJPN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics only in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
