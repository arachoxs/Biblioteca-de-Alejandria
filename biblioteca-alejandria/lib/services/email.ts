import nodemailer from 'nodemailer';
import type { MailSentResponse } from '../types/auth';


const transporterGmail = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.CLAVE_APP_GMAIL,
  },
});

type SendEmailOptions = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

export const sendEmail = async ({ to, subject, html, text, from }: SendEmailOptions): Promise<MailSentResponse> => {
  const mailOptions = {
    from: from || process.env.GMAIL_USER,
    to,
    subject,
    html,
    text,
  };

  try {
    const info = await transporterGmail.sendMail(mailOptions);
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Message sent:', info.messageId ?? info.response);
    }
    return { success: true, message: info.messageId || info.response || 'Correo enviado correctamente.' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: "Error al enviar el correo." };
  }
};
