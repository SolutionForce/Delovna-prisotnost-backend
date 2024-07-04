import express from "express";
import { logger } from "firebase-functions";
import { EndpointSecurity } from "../../definitions/classes/endpointSecurity";
import { db } from "../../config/firestoreConfig";
import { OrganizationWithId } from "../../definitions/interfaces/organization";
import { EmailManager } from "../../definitions/classes/emailManager";
import Mail from "nodemailer/lib/mailer";
import { extractMultipartFormData } from "../../definitions/classes/filesUploadMiddleware";

export interface EmailSend {
  recipientUserId: string;
  subject: string;
  message: string;
}

const router = express.Router();
router.use(express.urlencoded({ extended: true }));


/* router.post('/test', async function(req, res, next) {
  try {
    const realReq = await extractMultipartFormData(req);
    logger.debug('Fields: ' + JSON.stringify(realReq.fields));
    //logger.debug('Uploads: ' + JSON.stringify(realReq.uploads.attachments[0].filename));
    logger.debug('Uploads: ' + JSON.stringify(realReq.uploads.attachments?.length));
    
    
    res.status(200).send({message: 'Data extracted successfully'});
  } catch (error) {
    logger.error('Error extracting multipart form data:', error);
    res.status(error === 405 ? 405 : 500).json({ error: 'Failed to extract form data' });
  }
}); */


router.post('/', async (req, res) => {
  try {
    const authHeader = req.headers['auth'];
    const employeeOrBetter = await EndpointSecurity.isUserEmployeeOrBetter(authHeader);
    if(!employeeOrBetter) {
      res.status(401).send({message: "Unauthorized"});
      return;
    }

    let realReq = undefined;

    try {
      realReq = await extractMultipartFormData(req);
    } catch (error) {
      res.status(405).json({ error: 'Failed to extract form data' });
      return;
    }

    const body = realReq.fields;
    const files = realReq.uploads.attachments;
    logger.debug('Fields: ' + JSON.stringify(realReq.fields));
    //logger.debug('Uploads: ' + JSON.stringify(realReq.uploads.attachments[0].filename));

    if(!body.recipientUserId || !body.subject || !body.message) {
      res.status(400).json({message: "Invalid data"});
      return;
    }

    const emailData: EmailSend = {
      recipientUserId: body.recipientUserId,
      subject: body.subject,
      message: body.message
    };

    let attachments: Mail.Attachment[] | undefined = undefined;
    if(files)
      if(Array.isArray(files))
        attachments= files.map((file): Mail.Attachment => ({
          filename: file.filename,
          content: file.content
        }));
   
    const emailManager = new EmailManager();
    const success = await emailManager.sendEmailByUserId(emailData.recipientUserId, emailData.subject, emailData.message, attachments);

    if(!success){
      res.status(400).json({message: "Incorrect data"});
      return;
    }

    res.json({message: "Email sent successfully"});
  } catch (error) {
    logger.error(error);
    res.status(500).send({message: "Error while trying to send an email"});
  }
});

module.exports = router;
