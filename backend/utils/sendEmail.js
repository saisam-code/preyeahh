import nodemailer from "nodemailer";
import logger from "./logger.js";

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_HOST) {
    logger.warn(`[sendEmail] SMTP not configured — skipping email to ${to}: ${subject}`);
    return;
  }
  const t = getTransporter();
  await t.sendMail({
    from: process.env.SMTP_FROM || `"Pre-Yeah" <no-reply@preyeah.dev>`,
    to,
    subject,
    html,
  });
}

export default sendEmail;
