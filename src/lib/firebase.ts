import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  projectId: "horror-of-oz-805",
  appId: "1:975639941243:web:e2b6dd977900264a3d52de",
  storageBucket: "horror-of-oz-805.firebasestorage.app",
  apiKey: "AIzaSyB1H9OCX9CUVi3rKX9wEg-znPwSqabWrpA",
  authDomain: "horror-of-oz-805.firebaseapp.com",
  messagingSenderId: "975639941243",
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
