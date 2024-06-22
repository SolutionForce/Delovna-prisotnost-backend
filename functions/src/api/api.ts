const express = require("express");
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({origin: true, credentials: true})); //Zacasno omogocimo CORS v lokalnem okolju

const crud = require("./crud"); 
const codeAuthentication  = require("./routes/codeAuthentication "); 
const timetable = require("./timetable");

app.use("/", timetable);
app.use("/", crud);
app.use("/codeAuthentication", codeAuthentication);


export { app };
