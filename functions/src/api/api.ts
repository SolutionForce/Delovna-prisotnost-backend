import express from "express";
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors({origin: true, credentials: true})); //Zacasno omogocimo CORS v lokalnem okolju

const crud = require("./crud"); 
const timetable = require("./timetable");
const organizations = require("./routes/organizations");
const codeAuthentication  = require("./routes/codeAuthentication "); 
const emails  = require("./routes/emails"); 

app.use("/", crud);
app.use("/", timetable);
app.use("/organizations", organizations);
app.use("/codeAuthentication", codeAuthentication);
app.use("/emails", emails);


export { app };
