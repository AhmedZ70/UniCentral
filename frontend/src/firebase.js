
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD0wF4R9GdY2m7eAwVL_j_mihLit4rRZ5Q",
  authDomain: "unicentral-b6c23.firebaseapp.com",
  projectId: "unicentral-b6c23",
  storageBucket: "unicentral-b6c23.firebasestorage.app",
  messagingSenderId: "554502030441",
  appId: "1:554502030441:web:6dccab580dbcfdb974cef8",
  measurementId: "G-M4L04508RH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
