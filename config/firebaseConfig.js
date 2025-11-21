// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyB90B8Fbuhi7yYYfXvi7KeezzO9NulRpXY",
  authDomain: "medsmart-d8446.firebaseapp.com",
  projectId: "medsmart-d8446",
  storageBucket: "medsmart-d8446.firebasestorage.app",
  messagingSenderId: "485408700352",
  appId: "1:485408700352:web:f19c5b632bb868ce4fba25",
  measurementId: "G-JDZX142Z2H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);