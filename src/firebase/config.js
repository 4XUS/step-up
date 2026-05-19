import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBRo3KJ34x3XIGu6m6nFJ2nxAFpBcSzZ1A",
  authDomain: "step-up-18.firebaseapp.com",
  projectId: "step-up-18",
  storageBucket: "step-up-18.firebasestorage.app",
  messagingSenderId: "663490360542",
  appId: "1:663490360542:web:31d0a8c57eb77c398d7e4f",
  measurementId: "G-VSPJC2352T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;
