import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from "firebase-admin/firestore";

admin.initializeApp();

// Initialize Firestore
export const db = getFirestore();
export const auth = getAuth();
