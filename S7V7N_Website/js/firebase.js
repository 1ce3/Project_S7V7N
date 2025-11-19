import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, getDocs, addDoc, setDoc, deleteDoc, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC1grBksJkPgnl8NPK_7e9RyfYcWNihC3k",
  authDomain: "s7v7n-website.firebaseapp.com",
  projectId: "s7v7n-website",
  storageBucket: "s7v7n-website.firebasestorage.app",
  messagingSenderId: "408540305652",
  appId: "1:408540305652:web:7774e79137e6dd5825e6a1",
  measurementId: "G-8G94DZVPXZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productsCollection = collection(db, "products");

export { db, productsCollection, doc, getDocs, addDoc, setDoc, deleteDoc, runTransaction };