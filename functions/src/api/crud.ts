import express from "express";
import { logger } from "firebase-functions";
import { auth, db } from "../config/firestoreConfig";
import { User } from "../definitions/interfaces/user";
import { UserManager, UserWithPassword } from "../definitions/classes/userManager";
import { EndpointSecurity } from "../definitions/classes/endpointSecurity";
import {getUsers} from "../definitions/classes/users";
import { get } from "http";
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

    // user.uid and user.createdAt not needed
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

    // Update user data with the new fields provided in the request body
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

    // Delete the user from authentication
    await auth.deleteUser(uid)

    // Delete the user document
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
    const attendance = userData?.attendance; // Add null check for userData

    if (index < 0 || index >= attendance.length) {
      return res.status(400).send('Invalid attendance index');
    }

    // Remove the specific attendance entry
    attendance.splice(index, 1);

    // Update the user document with the modified attendance array
    await userRef.update({ attendance });

    // Fetch the updated user data to return in the response
    const updatedUserSnapshot = await userRef.get();
    const updatedUserData = updatedUserSnapshot.data();

    res.status(200).json(updatedUserData);
  } catch (error) {
    logger.error('Error deleting attendance:', error);
    res.status(500).send('Internal server error');
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
