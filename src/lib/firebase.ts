import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, child } from "firebase/database";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAHjQb9ey05o25gJupsoC2NSMQjEpZ8RBI",
  authDomain: "cbtvers1.firebaseapp.com",
  databaseURL: "https://cbtvers1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cbtvers1",
  storageBucket: "cbtvers1.firebasestorage.app",
  messagingSenderId: "362404169231",
  appId: "1:362404169231:web:4cb2e4987c5486e2f8057a",
  measurementId: "G-C8P8M933MY"
};
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, get, set, child };
