import express from "express";
import { logger } from "firebase-functions";
import { db } from "../config/firestoreConfig";

export const getUsers = async () => {
    try{
        const snapshot = await db.collection('users').get();
        const data = snapshot.docs.map(doc => doc.data());;
        return {data, status: 200};
      } 
      catch (error) {
      return {error, status: 500};
    }
}