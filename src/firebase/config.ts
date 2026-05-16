import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBs3hImCWEk05cl8qudS2SLeF1O5_qP_oU",
  authDomain: "thesis-labcab.firebaseapp.com",
  projectId: "thesis-labcab",
  storageBucket: "thesis-labcab.firebasestorage.app",
  messagingSenderId: "274010692387",
  appId: "1:274010692387:web:a4994620ac8bb3f609ca96",
  measurementId: "G-FMHE2FTE1N"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
