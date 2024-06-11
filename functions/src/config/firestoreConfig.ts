import admin from 'firebase-admin';
import { getFirestore } from "firebase-admin/firestore";

admin.initializeApp();

// Initialize Firestore
export const db = getFirestore();
