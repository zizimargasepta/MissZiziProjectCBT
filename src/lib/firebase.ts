import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, child } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAW1EgAmD77jKAiQQC4ywBiCsyo8qi432Y",
  authDomain: "cebete-f7219.firebaseapp.com",
  databaseURL: "https://cebete-f7219-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cebete-f7219",
  storageBucket: "cebete-f7219.firebasestorage.app",
  messagingSenderId: "610541161818",
  appId: "1:610541161818:web:b87362c8abacd10358b763",
  measurementId: "G-Q1E8VNGVCN"
};
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, get, set, child };
