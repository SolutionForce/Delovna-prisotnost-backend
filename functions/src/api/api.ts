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
const codeAuthentication  = require("./routes/codeAuthentication "); 

//Add to url your files
app.use("/", crud);
app.use("/codeAuthentication", codeAuthentication);


export { app };
