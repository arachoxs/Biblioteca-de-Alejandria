import nodemailer from 'nodemailer';
import { mailSentResponse } from '../types/auth';

// Configuration for Maileroo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.MAILEROO_SMTP_HOST,
  port: 465, 
  secure: true, // true para puerto 465, false para otros
  auth: {
    user: process.env.MAILEROO_SMTP_USER,
    pass: process.env.MAILEROO_SMTP_PASSWORD,
  },
  // Añade estas líneas para manejar problemas de conexión:
  connectionTimeout: 10000, // 10 segundos
  greetingTimeout: 5000,
  socketTimeout: 10000,
  tls: {
    // No falla si el certificado no coincide (útil para debug)
    rejectUnauthorized: false 
  }
});

type SendEmailOptions = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

export const sendEmail = async ({ to, subject, html, text, from }: SendEmailOptions): Promise<mailSentResponse> => {
  const mailOptions = {
    from: from || process.env.MAILEROO_FROM_EMAIL || process.env.MAILEROO_SMTP_USER,
    to,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return { success: true, message: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: "Error al enviar el correo." };
  }
};
