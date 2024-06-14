const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const express = require("express");
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors()); //Zacasno omogocimo CORS v lokalnem okolju

const crud = require("./crud"); 
app.use("/", crud);

const timetable = require("./timetable"); 
app.use("/", timetable);


export { app };