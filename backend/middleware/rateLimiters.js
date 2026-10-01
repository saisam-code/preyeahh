import rateLimit from "express-rate-limit";

/**
 * Per-student cap on endpoints that call the LLM (each call costs quota).
 * Mount AFTER protect() so req.user is available; falls back to IP otherwise.
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, statusCode: 429, message: "You're sending AI requests too quickly. Please wait a few minutes." },
});
