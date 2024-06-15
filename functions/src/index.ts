import { onNewUserSignUp } from "./triggers/onNewUserSignUp";
import { app } from './api/api';

const functions = require("firebase-functions");

exports.api = functions.https.onRequest(app); //REST streznik
//exports.onNewUserSignUp = onNewUserSignUp; //Not needed anymore
