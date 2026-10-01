import Groq from "groq-sdk";

let client = null;

/** Lazily-created singleton Groq client. Throws if GROQ_API_KEY is not set. */
export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not defined in environment variables");
  if (!client) client = new Groq({ apiKey });
  return client;
}

/**
 * Model options (Groq free tier):
 *  - llama-3.3-70b-versatile  best quality
 *  - llama-3.1-8b-instant     fastest, highest limits
 * Override with GROQ_MODEL in .env.
 */
export const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
