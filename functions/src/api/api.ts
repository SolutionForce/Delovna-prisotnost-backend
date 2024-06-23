const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const express = require("express");
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({origin: true, credentials: true})); //Zacasno omogocimo CORS v lokalnem okolju

//Import your files
const crud = require("./crud"); 
const timetable = require("./timetable");
const organizations = require("./routes/organizations");
const codeAuthentication  = require("./routes/codeAuthentication "); 

app.use("/", crud);
app.use("/", timetable);
app.use("/organizations", organizations);
app.use("/codeAuthentication", codeAuthentication);


export { app };
