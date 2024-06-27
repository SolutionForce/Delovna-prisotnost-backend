import { logger } from "firebase-functions/v1";
import { auth, db } from "../../config/firestoreConfig";
import { Role, User } from "../interfaces/user";

export abstract class EndpointSecurity {
  private static async getUserIdFromAuthHeader(authHeader: string | string[] | undefined): Promise<string | undefined> {
    logger.debug(authHeader)
    try {
      if(typeof authHeader !== "string") {
        logger.warn("EndpointSecurity: Header 'auth' is not a string type");
        return undefined;
      }

      let userId: string = "";
      try {
        const userToken = await auth.verifyIdToken(authHeader as string, true);
        userId = userToken.uid;
      } catch (error) {
        logger.warn("EndpointSecurity: userToken invalid format: " + error);
        return undefined;
      }

      if(userId === "")
        return undefined;

      return userId;
    } catch(error) {
      logger.error(error);
      return undefined;
    }
  }

  static async getUserData(userId: string): Promise<User | undefined> {
    const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      if(!userData) {
        return undefined;
      }
  
      const user: User = {
        uid: userData.uid,
        name: userData.name,
        surname: userData.surname,
        email: userData.email,
        createdAt: userData.createdAt,
        organizationId: userData.organizationId,
        role: userData.role,
        attendance: userData.attendance,
        hourlyRate: userData.hourlyRate
      };

      return user;
  }

  static async isUserLoggedIn(authHeader: string | string[] | undefined): Promise<boolean> {
    try {
      const userId = await this.getUserIdFromAuthHeader(authHeader);
      if(!userId)
        return false;

      const userDoc = await db.collection('users').doc(userId).get();
      return userDoc.exists;
    } catch(error) {
      logger.error(error);
      return false;
    }
  }

  static async isUserGuestOrBetter(authHeader: string | string[] | undefined): Promise<User | undefined> {
    try {
      const userId = await this.getUserIdFromAuthHeader(authHeader);
      if(!userId)
        return undefined;

      const user = await this.getUserData(userId);
      if(!user)
        return undefined;
  
      if(user.role!==Role.guest && user.role!==Role.employee && user.role!==Role.admin) {
        return undefined;
      }
  
      return user;
    } catch(error) {
      logger.error(error);
      return undefined;
    }
  }

  static async isUserEmployeeOrBetter(authHeader: string | string[] | undefined): Promise<User | undefined> {
    try {
      const userId = await this.getUserIdFromAuthHeader(authHeader);
      if(!userId)
        return undefined;

      const user = await this.getUserData(userId);
      if(!user)
        return undefined;
  
      if(user.role!==Role.employee && user.role!==Role.admin) {
        return undefined;
      }
  
      return user;
    } catch(error) {
      logger.error(error);
      return undefined;
    }
  }

  static async isUserAdmin(authHeader: string | string[] | undefined): Promise<User | undefined> {
    try {
      const userId = await this.getUserIdFromAuthHeader(authHeader);
      if(!userId)
        return undefined;

      const user = await this.getUserData(userId);
      if(!user)
        return undefined;
  
      if(user.role !== Role.admin) {
        return undefined;
      }
  
      return user;
    } catch(error) {
      logger.error(error);
      return undefined;
    }
  }

}
