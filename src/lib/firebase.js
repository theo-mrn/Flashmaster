// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDAOw3LFKMXES_-yahMqyV-xzuR9BKTA1k",
  authDomain: "flashmaster-b6747.firebaseapp.com",
  projectId: "flashmaster-b6747",
  storageBucket: "flashmaster-b6747.appspot.com",
  messagingSenderId: "709739976233",
  appId: "1:709739976233:web:b7cfbdf374319cbd67ee38",
  measurementId: "G-FS5HBYHLLK"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Services Firebase
const auth = getAuth(app); // Authentification Firebase
const db = getFirestore(app); // Firestore pour la base de données
const storage = getStorage(app); // Firebase Storage pour le stockage d'images

export { auth, db, storage };
