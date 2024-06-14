import functions = require('firebase-functions');
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { Role, User } from '../definitions/interfaces/user';
import { db } from '../config/firestoreConfig';

export const onNewUserSignUp = functions.auth.user().onCreate(async (user) => {
  try {
    const timeNow = Timestamp.now();

    const newUser: User = {
      uid: user.uid,
      name: (user.displayName ?? 'Name not set'),
      surname: '',
      email: (user.email ?? 'Email not set'),
      organizationId: '',
      role: Role.guest,
      createdAt: timeNow,
      attendance: [],
      hourlyRate: 0
    }
    
    await db.collection('users').doc(user.uid).set(newUser);
  } catch (error) {
    console.error(error);
  }
});
