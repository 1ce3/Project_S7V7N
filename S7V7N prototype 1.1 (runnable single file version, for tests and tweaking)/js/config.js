// js/config.js
const firebaseConfig = {
  apiKey: "AIzaSyC1grBksJkPgnl8NPK_7e9RyfYcWNihC3k",
  authDomain: "s7v7n-website.firebaseapp.com",
  projectId: "s7v7n-website",
  storageBucket: "s7v7n-website.firebasestorage.app",
  messagingSenderId: "408540305652",
  appId: "1:408540305652:web:7774e79137e6dd5825e6a1",
  measurementId: "G-8G94DZVPXZ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
export const db = firebase.firestore();
export const auth = firebase.auth();
export const productsCollection = db.collection("products");
export const usersCollection = db.collection('users');
export const ordersCollection = db.collection('orders');