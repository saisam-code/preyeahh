import nodemailer from "nodemailer";
import ApiError from "./ApiError.js";
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

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM &&
    process.env.CLIENT_URL
  );
}

export function assertEmailConfigured() {
  if (process.env.NODE_ENV === "production" && !isEmailConfigured()) {
    throw ApiError.serviceUnavailable("Email delivery is not configured. Please contact support.");
  }
}

export function getClientUrl() {
  return (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\/+$/, "");
}

export async function verifyEmailTransport() {
  if (!isEmailConfigured()) {
    logger.warn("[email] SMTP is not fully configured; verification and reset emails cannot be delivered.");
    return;
  }

  try {
    await getTransporter().verify();
    logger.info("[email] SMTP transport verified.");
  } catch (error) {
    logger.error(`[email] SMTP connection check failed (${error.code || error.name}): ${error.message}`);
  }
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === "production") assertEmailConfigured();
    logger.warn("[sendEmail] SMTP not configured; skipping email in development.");
    return;
  }
  assertEmailConfigured();
  const t = getTransporter();
  await t.sendMail({
    from: process.env.SMTP_FROM || `"Preyeahh" <no-reply@preyeah.dev>`,
    to,
    subject,
    html,
  });
}

export default sendEmail;
