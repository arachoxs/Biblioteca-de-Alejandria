import nodemailer from 'nodemailer';

// Configuration for Maileroo SMTP
export const transporter = nodemailer.createTransport({
  host: process.env.MAILEROO_SMTP_HOST || 'smtp.maileroo.com',
  port: Number(process.env.MAILEROO_SMTP_PORT) || 465, // Use 465, 587, or 2525
  secure: Number(process.env.MAILEROO_SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.MAILEROO_SMTP_USER,
    pass: process.env.MAILEROO_SMTP_PASSWORD,
  },
});

type SendEmailOptions = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

export const sendEmail = async ({ to, subject, html, text, from }: SendEmailOptions) => {
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
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};
