// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCRtWb-RDnMfF4zJ11bqEwm6kI4-HHwhZw",
    authDomain: "happy-food-foryou.firebaseapp.com",
    databaseURL: "https://happy-food-foryou-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "happy-food-foryou",
    storageBucket: "happy-food-foryou.firebasestorage.app",
    messagingSenderId: "624872155810",
    appId: "1:624872155810:web:3c8da32d042757730e45fb",
    measurementId: "G-XQGBDRC9ND"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Export for use in other files
export { app, analytics, db };
/* //test */