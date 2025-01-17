import express from "express";
import { logger } from "firebase-functions";
import { auth, db } from "../config/firestoreConfig";
import { UserManager, UserWithPassword } from "../definitions/classes/userManager";
import { EndpointSecurity } from "../definitions/classes/endpointSecurity";
import {getUsers} from "../definitions/classes/users";
import { EmailSend } from "./routes/emails";
import { EmailManager } from "../definitions/classes/emailManager";
const router = express.Router();

router.get("/users", async (req, res) => {
  logger.info(req.method + " " + req.originalUrl);
  logger.info("GET /users");
  try {
    const response = await getUsers();
    console.log(response);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post("/users", async (req, res) => {
  logger.info(req.method + " " + req.originalUrl);
  logger.info("POST /users");
  try {
    const authHeader = req.headers['auth'];
    const admin = await EndpointSecurity.isUserAdmin(authHeader);
    if(!admin) {
      res.status(401).send({message: "Unauthorized"});
      return;
    }

    const user: UserWithPassword = req.body;

    if(!user.name || !user.surname || !user.email || user.email=='' || !user.password || user.password=='' || !user.organizationId || !user.role || !Array.isArray(user.attendance) || !user.hourlyRate)
      return res.status(400).send("Invalid user data");

    let createdUser: UserWithPassword;
    try {
      createdUser = await UserManager.registerUser(user);
    } catch (error) {
      return res.status(400).send("Invalid user data");
    }

    res.status(201).send(createdUser);
  } catch (error) {
    res.status(500).json(error);
    logger.info("Error creating user:", error);
  }
});

router.get("/users/:uid", async (req, res) => {
  logger.info(req.method + " " + req.originalUrl);
  logger.info("GET /users/:uid");
  try {
    const uid = req.params.uid;
    const user = await db.collection('users').doc(uid).get();
    if (!user.exists) {
      return res.status(404).send("User not found");
    }
    res.status(200).json(user.data());
  } catch (error) {
    res.status(500).send(error);
    logger.info("Error getting user:", error);
  }
});

router.patch('/users/:uid', async (req, res) => {
  logger.info(req.method + ' ' + req.originalUrl);
  logger.info('PATCH /users/:uid');
  
  try {
    const uid = req.params.uid;
    const userRef = db.collection('users').doc(uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return res.status(404).send('User not found');
    }

    const updatedData = req.body;
    await userRef.update(updatedData);

    // Fetch the updated user data to return in the response
    const updatedUserSnapshot = await userRef.get();
    const updatedUserData = updatedUserSnapshot.data();

    res.status(200).json(updatedUserData);
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).send('Internal server error');
  }
});

router.delete('/users/:uid', async (req, res) => {
  logger.info(req.method + ' ' + req.originalUrl);
  logger.info('DELETE /users/:uid');

  try {
    const authHeader = req.headers['auth'];
    const admin = await EndpointSecurity.isUserAdmin(authHeader);
    if(!admin) {
      res.status(401).send({message: "Unauthorized"});
      return;
    }

    const uid = req.params.uid;
    const userRef = db.collection('users').doc(uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return res.status(404).send('User not found');
    }

    await auth.deleteUser(uid)

    await userRef.delete();

    res.status(200).send('User deleted successfully');
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).send('Internal server error');
  }
});

router.delete('/users/:uid/attendance/:index', async (req, res) => {
  logger.info(req.method + ' ' + req.originalUrl);
  logger.info('DELETE /users/:uid/attendance/:index');

  try {
    const uid = req.params.uid;
    const index = parseInt(req.params.index, 10);
    const userRef = db.collection('users').doc(uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return res.status(404).send('User not found');
    }

    const userData = userSnapshot.data();
    const attendance = userData?.attendance;

    if (index < 0 || index >= attendance.length) {
      return res.status(400).send('Invalid attendance index');
    }

    attendance.splice(index, 1);

    await userRef.update({ attendance });

    const updatedUserSnapshot = await userRef.get();
    const updatedUserData = updatedUserSnapshot.data();

    res.status(200).json(updatedUserData);
  } catch (error) {
    logger.error('Error deleting attendance:', error);
    res.status(500).send('Internal server error');
  }
});

router.post("/users/resetPassword", async (req, res) => {
  try {
    const email = req.body.email;
    if(!email) {
      res.status(400).send({message: "Missing 'email' field"});
      return;
    }

    let resetPasswordLink = "";
    try {
      resetPasswordLink = await auth.generatePasswordResetLink(email);
    } catch (error) {
      res.status(400).send({message: "Password reset link could not be sent"});
      return;
    }

    if(resetPasswordLink==="") {
      res.status(400).send({message: "Password reset link could not be sent"});
      return;
    }

    const emailData: EmailSend = {
      recipientUserId: email,
      subject: "Password reset - Solution force",
      message: `Hello.
      
      You can reset your password for Solution force on the following link: ${resetPasswordLink}.
      
      If you did not request a password reset, you can ignore this email.`
    };
   
    const emailManager = new EmailManager();
    const success = await emailManager.sendEmail(emailData.recipientUserId, emailData.subject, emailData.message);

    if(!success){
      res.status(400).send({message: "Password reset link could not be sent over email"});
      return;
    }

    res.status(200).send({message: "Password reset link sent"});
  } catch (error) {
    res.status(500).json({message: "Password reset link could not be sent"});
    logger.info("Error: Password reset link could not be sent: ", error);
  }
});

router.get("/timetables", async (req, res) => {
  logger.info(req.method + " " + req.originalUrl);
  logger.info("GET /timetable");

  try {
    const timetableCollection = await db.collection('timetables').get();
    if (timetableCollection.empty) {
      return res.status(404).send("No timetables found");
    }

    const timetables: any[] = [];
    timetableCollection.forEach((doc) => {
      timetables.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(timetables);
  } catch (error) {
    res.status(500).send((error as Error).message);
    logger.error("Error getting timetables:", error);
  }
});



module.exports = router;
