import nodemailer from 'nodemailer';
import { MailSentResponse } from '../types/auth';

// Configuration for Maileroo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.MAILEROO_SMTP_HOST || 'smtp.maileroo.com',
  port: Number(process.env.MAILEROO_SMTP_PORT) || 465, // Use 465, 587, or 2525
  secure: Number(process.env.MAILEROO_SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.MAILEROO_SMTP_USER,
    pass: process.env.MAILEROO_SMTP_PASSWORD,
  },
  // Añade estas líneas para manejar problemas de conexión:
  connectionTimeout: 10000, // 10 segundos
  greetingTimeout: 5000,
  socketTimeout: 10000
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
