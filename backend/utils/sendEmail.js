import nodemailer from "nodemailer";
import ApiError from "./ApiError.js";
import logger from "./logger.js";

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;
  const secure = port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return transporter;
}

export function isEmailConfigured() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || user;
  const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL;

  return Boolean(host && user && pass && from && clientUrl);
}

export function assertEmailConfigured() {
  if (process.env.NODE_ENV === "production" && !isEmailConfigured()) {
    throw ApiError.serviceUnavailable("Email delivery is not configured. Please contact support.");
  }
}

export function getClientUrl() {
  const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";
  return clientUrl
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
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  if (!host) {
    if (process.env.NODE_ENV === "production") assertEmailConfigured();
    logger.warn("[sendEmail] SMTP not configured; skipping email in development.");
    return;
  }
  assertEmailConfigured();
  const t = getTransporter();
  
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || `"Preyeahh" <no-reply@preyeah.dev>`;
  
  await t.sendMail({
    from,
    to,
    subject,
    html,
  });
}

export default sendEmail;

