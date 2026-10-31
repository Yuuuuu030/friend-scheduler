import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-8MJ00rzY1d1hU_IRncPncmaMDvU5YQY",
  authDomain: "friend-scheduler-6b733.firebaseapp.com",
  projectId: "friend-scheduler-6b733",
  storageBucket: "friend-scheduler-6b733.firebasestorage.app",
  messagingSenderId: "927337011259",
  appId: "1:927337011259:web:dee4b325a047aabb69a41e",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);