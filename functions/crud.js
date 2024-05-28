const express = require("express");
const router = express.Router();
const admin = require('firebase-admin');
const { logger } = require("firebase-functions");

if (!admin.apps.length) {
  console.log("console logging from crud.js")
  admin.initializeApp();
}
const db = admin.firestore();


router.get("/test1", (req, res) => {
  res.send("Hello World!");
});

router.get("/users", async (req, res) => {
  logger.info(req.method + " " + req.originalUrl);
  logger.info("GET /users");
    try{
      const snapshot = await db.collection('users').get();
      const data = snapshot.docs.map(doc => doc.data());;
      res.status(200).json(data);
    } 
    catch (error) {
    res.status(500).send(error.toString());
  }

});

// Post users to db
router.post("/users", async (req, res) => {
  logger.info(req.method + " " + req.originalUrl);
  logger.info("POST /users");
  try {
    const user = req.body;
    if (!user.uid || !user.name || !user.surname || !Array.isArray(user.attendance)) {
      return res.status(400).send("Invalid user data");
    }
    const newUser = {
      uid: user.uid,
      name: user.name,
      surname: user.surname,
      attendance: user.attendance
    };
    await db.collection('users').doc(newUser.uid).set(newUser);
    res.status(201).send("User created");
  } catch (error) {
    res.status(500).send(error.toString());
    logger.info("Error creating user:", error);
  }
});

module.exports = router;