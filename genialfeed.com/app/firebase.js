import { initializeApp } from 'firebase/app';
import {
  getAuth,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  setPersistence,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyDkoQkl9adRsW67H_jT7bWpH9QDRU44wS4",
  authDomain: "linkaggregator-bb44b.firebaseapp.com",
  projectId: "linkaggregator-bb44b",
  storageBucket: "linkaggregator-bb44b.appspot.com",
  messagingSenderId: "99431625311",
  appId: "1:99431625311:web:bac65091e8c76f72faa1ea",
  measurementId: "G-6R2MPDR718",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Platform-specific Auth initialization
let auth;

if (typeof document !== "undefined") {
  // Web-specific logic
  auth = getAuth(app);
  setPersistence(auth, indexedDBLocalPersistence)
    .catch((error) => {
      console.error("Web persistence failed. Falling back to session persistence:", error);
      return setPersistence(auth, browserSessionPersistence);
    });
} else {
  // React Native-specific logic
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// Initialize Firestore
export const db = getFirestore(app);
export { auth };
