// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDHeJxTUUg3u2NizCAiIXwMmYrOMA13SBM",
    authDomain: "toeic-vocabulary-app.firebaseapp.com",
    projectId: "toeic-vocabulary-app",
    storageBucket: "toeic-vocabulary-app.firebasestorage.app",
    messagingSenderId: "657357452338",
    appId: "1:657357452338:web:f968a299e351e94fb4f82b",
    measurementId: "G-M265Y258V5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
