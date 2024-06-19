import { auth, db } from "../../config/firestoreConfig";
import { User } from "../interfaces/user";
import { Timestamp } from "firebase-admin/firestore";

export interface UserWithPassword extends User {
  password: string;
}

export abstract class UserManager {
  static generateRandomPassword(): string {
    const length = 12
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialCharacters = '!@#$%^&*()_+[]{}|;:,.<>?';
    const allCharacters = uppercase + lowercase + numbers + specialCharacters;

    let password = '';
    for(let i=0; i<length; i++)
      password += allCharacters.charAt(Math.round(Math.random()*allCharacters.length))

    return password;
  }

  
  static async registerUser(user: UserWithPassword): Promise<UserWithPassword> {
    const registeredUser = await auth.createUser({
      email: user.email,
      emailVerified: false,
      phoneNumber: undefined,
      password: user.password,
      displayName: user.name + ' ' + user.surname,
      photoURL: undefined,
      disabled: false,
    }); 
    
    const timeNow = Timestamp.now();

    const firestoreUser: User = {
      uid: registeredUser.uid,
      name: user.name,
      surname: user.surname,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
      createdAt: timeNow,
      attendance: user.attendance,
      hourlyRate: user.hourlyRate
    };

    await db.collection('users').doc(registeredUser.uid).set(firestoreUser);
    return {...firestoreUser, password: user.password};
  }

}
