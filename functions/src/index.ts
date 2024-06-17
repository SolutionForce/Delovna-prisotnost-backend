import { onNewUserSignUp } from "./triggers/onNewUserSignUp";
import { generateTimetable } from './triggers/generateTimetable'
import { app } from './api/api';

const functions = require("firebase-functions");

exports.api = functions.https.onRequest(app); //REST streznik
exports.generateTimetable = generateTimetable;
