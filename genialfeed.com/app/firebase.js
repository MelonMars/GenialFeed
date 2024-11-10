import {initializeApp} from 'firebase/app';
import { getAuth, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, deleteField } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDkoQkl9adRsW67H_jT7bWpH9QDRU44wS4",
    authDomain: "linkaggregator-bb44b.firebaseapp.com",
    projectId: "linkaggregator-bb44b",
    storageBucket: "linkaggregator-bb44b.appspot.com",
    messagingSenderId: "99431625311",
    appId: "1:99431625311:web:bac65091e8c76f72faa1ea",
    measurementId: "G-6R2MPDR718"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence);
export const db = getFirestore(app)