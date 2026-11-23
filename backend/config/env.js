import logger from "../utils/logger.js";

/**
 * Validates required environment variables at server boot.
 * Exits immediately if any critical variables are missing.
 */
export function validateEnv() {
  const isProd = process.env.NODE_ENV === "production";

  const criticalVars = [
    "MONGO_URI",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "CLIENT_URL",
  ];

  const missingCritical = criticalVars.filter((key) => !process.env[key]);

  if (missingCritical.length > 0) {
    logger.error("=================================================");
    logger.error("CRITICAL CONFIGURATION ERROR — MISSING ENV VARS:");
    missingCritical.forEach((k) => logger.error(`  - ${k} is required but not set`));
    logger.error("Please configure them in your .env or server environment.");
    logger.error("=================================================");
    process.exit(1);
  }

  // Warning-level checks for service integrations
  const optionalIntegrations = [
    { key: "GROQ_API_KEY", desc: "Required for AI Career Roadmaps and Chat Intelligence" },
    { key: "GOOGLE_CLIENT_ID", desc: "Required for Google OAuth login" },
    { key: "GOOGLE_CLIENT_SECRET", desc: "Required for Google OAuth login" },
    { key: "GOOGLE_CALLBACK_URL", desc: "Required for Google OAuth redirect callback" },
  ];

  const missingIntegrations = optionalIntegrations.filter((item) => !process.env[item.key]);
  if (missingIntegrations.length > 0) {
    if (isProd) {
      logger.warn("[config] Some third-party integrations are unconfigured in production:");
      missingIntegrations.forEach((item) => logger.warn(`  - ${item.key}: ${item.desc}`));
    } else {
      logger.info("[config] Running in development mode with fallback stubs for optional integrations.");
    }
  }
}
