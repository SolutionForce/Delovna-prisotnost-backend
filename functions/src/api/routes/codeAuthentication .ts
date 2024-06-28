import express from "express";
import { logger } from "firebase-functions";
import { db } from "../../config/firestoreConfig";
import { authenticator } from "otplib";
import { OrganizationWithId } from "../../definitions/interfaces/organization";
import { EndpointSecurity } from "../../definitions/classes/endpointSecurity";
import { optionsOfCodeTOTP } from "../../definitions/constants/securityConstants";
import { decrypt, encrypt } from "../../definitions/classes/encriptionAES";

const router = express.Router();

authenticator.options = optionsOfCodeTOTP;


async function createNewSecretKey(organizationId: string): Promise<string> {
  const doc = await db.collection('organizations').doc(organizationId).get();
  if (!doc.exists)
    throw new Error('Organization document with id "' + organizationId + '" not found');

  const organizationData = doc.data();
  if(!organizationData)
    throw new Error('Organization document with id "' + organizationId + '" not found');

  const newSecretTOTP = authenticator.generateSecret();
  const encryptedNewSecretTOTP = encrypt(newSecretTOTP)
  await db.collection("organizations").doc(organizationId).update({secretTOTP: encryptedNewSecretTOTP})
  logger.debug(newSecretTOTP);
  return newSecretTOTP;
}

async function getSecretKey(organizationId: string): Promise<string> {
  const doc = await db.collection('organizations').doc(organizationId).get();
  if (!doc.exists)
    throw new Error('Organization document with id "' + organizationId + '" not found');

  const organizationData = doc.data();
  if(!organizationData)
    throw new Error('Organization document with id "' + organizationId + '" not found');

  const organization: OrganizationWithId = {
    id: doc.id,
    name: organizationData.name,
    secretTOTP: organizationData.secretTOTP
  }

  if(organization.secretTOTP !== "")
    return decrypt(organization.secretTOTP);

  const secretTOTP = await createNewSecretKey(organizationId);
  return secretTOTP;
} 

// TOTP: Time-based One-time Password
function createTOTPCode(secret: string) {
  return authenticator.generate(secret);
}

router.get('/secrettotp', async (req, res) => {
  const authHeader = req.headers['auth'];
  try {
    const admin = await EndpointSecurity.isUserReceptionistOrBetter(authHeader);
    if(!admin) {
      res.status(401).send({message: "Unauthorized"});
      return;
    }

    const secretTOTP = await getSecretKey(admin.organizationId);
    res.json({ secretTOTP: secretTOTP });
  } catch (error) {
    logger.error(error);
    res.status(500).send({message: "Cannot get secret TOTP key"});
  }
});

//Generates new secrettotp for organization
router.put('/secrettotp', async (req, res) => {
  const authHeader = req.headers['auth'];
  try {
    const admin = await EndpointSecurity.isUserAdmin(authHeader);
    if(!admin) {
      res.status(401).send({message: "Unauthorized"});
      return;
    }

    await createNewSecretKey(admin.organizationId);
    res.status(200).json({ message: 'Succsessfuly generated new secret TOTP code for your organization' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get TOTP code
// If admin has secretKey on device, he can generate TOTP codes on frontend (no need to call this endpoint)
router.get('/totp', async (req, res) => {
  const authHeader = req.headers['auth'];
  try {
    const admin = await EndpointSecurity.isUserReceptionistOrBetter(authHeader);
    if(!admin) {
      res.status(401).send({message: "Unauthorized"});
      return;
    }

    const secretKey = await getSecretKey(admin.organizationId);
    const token = createTOTPCode(secretKey);
    res.json({ token });
  } catch (error) {
    logger.error(error);
    res.status(500).send({message: "Cannot get TOTP code"});
  }
});

// Verify a TOTP code
router.post('/verify', async (req, res) => {
  const authHeader = req.headers['auth'];
  try {
    const employeeOrBetter = await EndpointSecurity.isUserEmployeeOrBetter(authHeader);
    if(!employeeOrBetter) {
      res.status(401).send({message: "Unauthorized"});
      return;
    }

    const { tokenTOTP } = req.body;
    const secretKey = await getSecretKey(employeeOrBetter.organizationId);
    const isValid = authenticator.check(tokenTOTP, secretKey);

    if(!isValid) {
      res.status(400).json({ message: 'Token is invalid' });
      return;
    }
    
    res.status(200).json({ message: 'Token is valid' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({message: "Cannot verify TOTP code"});
  }
});


module.exports = router;
