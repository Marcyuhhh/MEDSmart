// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB90B8Fbuhi7yYYfXvi7KeezzO9NulRpXY",
  authDomain: "medsmart-d8446.firebaseapp.com",
  projectId: "medsmart-d8446",
  storageBucket: "medsmart-d8446.firebasestorage.app",
  messagingSenderId: "485408700352",
  appId: "1:485408700352:web:f19c5b632bb868ce4fba25",
  measurementId: "G-JDZX142Z2H",
  databaseURL: "https://medsmart-d8446-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase 12 no longer exports getReactNativePersistence.
export const auth = initializeAuth(app);

export const db = getFirestore(app);
export const rtdb = getDatabase(app);