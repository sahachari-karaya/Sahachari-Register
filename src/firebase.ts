import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {

  apiKey: "AIzaSyA9ivJabvn7avcoUzs8zgyPgLYYJai_YuM",

  authDomain: "sahachari-register.firebaseapp.com",

  projectId: "sahachari-register",

  storageBucket: "sahachari-register.firebasestorage.app",

  messagingSenderId: "586421625212",

  appId: "1:586421625212:web:dce33c4890342fcd8404f9",

  measurementId: "G-SVSHWK4BNF"

};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 
