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

// post users to db
router.post("/users", async (req, res) => {
  logger.info(req.method + " " + req.originalUrl);
  logger.info("POST /users");
  try {
    const user = req.body;
    await db.collection('users').doc(user.id).set(user);
    res.status(201).send("User created");
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

module.exports = router;