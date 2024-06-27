import nodemailer from 'nodemailer';
import nodemailerSendgrid from 'nodemailer-sendgrid';
import { emailFromAddress, emailFromName } from '../../config/emailConfig';
import { EndpointSecurity } from './endpointSecurity';
import { User } from '../interfaces/user';
import Mail from 'nodemailer/lib/mailer';

export class EmailManager {
  private transport: nodemailer.Transporter;
  
  constructor() {
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if(!sendgridApiKey)
      throw new Error("SendGrid api key is undefined");

    this.transport = nodemailer.createTransport(
      nodemailerSendgrid({
        apiKey: sendgridApiKey
      })
    );
  }

  async sendEmail(recipientUserId: string, subject: string, message: string, attachments: Mail.Attachment[] | undefined): Promise<boolean> {
    const user = await EndpointSecurity.getUserData(recipientUserId);
    if(!user)
      return false;

    const newEmail: Mail.Options = {
      from: emailFromName + ' ' + emailFromAddress,
      to: user.email,
      subject: subject,
      text: message,
      attachments: (attachments || [])
    }

    await this.transport.sendMail(newEmail);

   return true;
  }

}
