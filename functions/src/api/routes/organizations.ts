import express from "express";
import { logger } from "firebase-functions";
import { EndpointSecurity } from "../../definitions/classes/endpointSecurity";
import { db } from "../../config/firestoreConfig";
import { OrganizationWithId } from "../../definitions/interfaces/organization";

const router = express.Router();

router.get('/', async (req, res) => {
  const authHeader = req.headers['auth'];
  try {
    const employeeOrBetter = await EndpointSecurity.isUserEmployeeOrBetter(authHeader);
    if(!employeeOrBetter) {
      res.status(401).send({message: "Unauthorized"});
      return;
    }

    const organizationsSnapshot = await db.collection("organizations").get();
    const organizations: OrganizationWithId[] = organizationsSnapshot.docs.map((doc): OrganizationWithId => {
      return {
        id: doc.id,
        name: doc.data().name,
        secretTOTP: doc.data().secretTOTP
      }
    });

    res.json(organizations);
  } catch (error) {
    logger.error(error);
    res.status(500).send({message: "Cannot get secret TOTP key"});
  }
});

module.exports = router;
