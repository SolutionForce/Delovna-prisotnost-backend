import { db } from "../../config/firestoreConfig";
import { Query } from '@google-cloud/firestore';
import { User } from "../interfaces/user"; // Ensure correct path to user interface

interface ResponseData {
  data?: User[];
  status: number;
  error?: any;
}

export const getUsers = async (fields: string[] | null = null): Promise<ResponseData> => {
  try {
    let query: Query = db.collection('users');
    if (fields) {
      query = query.select(...fields);
    }
    const snapshot = await query.get();
    const data = snapshot.docs.map(doc => {
      const docData = doc.data();
      const user: Partial<User> = {}; // Use Partial<User> to allow dynamic assignment

      if (fields) {
        fields.forEach(field => {
          if (docData.hasOwnProperty(field)) {
            (user as any)[field] = docData[field]; // Use 'as any' to allow dynamic property assignment
          }
        });
      } else {
        // If fields is null, include all fields from docData
        Object.keys(docData).forEach(field => {
          (user as any)[field] = docData[field]; // Use 'as any' to allow dynamic property assignment
        });
      }

      return user as User; // Assert type back to User
    });
    return { data, status: 200 };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { error, status: 500 };
  }
};
