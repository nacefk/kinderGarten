// Firebase Configuration
// Credentials loaded from environment variables (.env.local)

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app: any;
let messaging: any;

try {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized");
  
  // Initialize Cloud Messaging
  messaging = getMessaging(app);
  console.log("✅ Cloud Messaging initialized");
  
  // Analytics (optional)
  if (typeof window !== "undefined") {
    try {
      getAnalytics(app);
      console.log("✅ Analytics initialized");
    } catch (e) {
      console.log("⚠️ Analytics not available");
    }
  }
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
}

export { app, messaging, getToken, onMessage };
