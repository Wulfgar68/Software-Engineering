// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbW10HZQnpytlINvh9fPrNN4Fbq-hgWLA",
  authDomain: "pi-projekt-eef59.firebaseapp.com",
  projectId: "pi-projekt-eef59",
  storageBucket: "pi-projekt-eef59.firebasestorage.app",
  messagingSenderId: "219092286130",
  appId: "1:219092286130:web:9edd8f28e029cbdf6de7ab"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); 

export { auth, db };