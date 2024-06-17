// common/users.ts
import { db } from "../config/firestoreConfig";
import { Query } from '@google-cloud/firestore';

interface User {
  name?: string;
  uid?: string;
  [key: string]: any;
}

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
      const user: User = {};
      fields?.forEach(field => {
        user[field] = docData[field];
      });
      return user;
    });
    return { data, status: 200 };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { error, status: 500 };
  }
};
