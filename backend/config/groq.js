import Groq from "groq-sdk";

let _client = null;

/**
 * Returns a singleton Groq client.
 * Reads GROQ_API_KEY from environment.
 */
export const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not defined in environment variables");
  }
  if (!_client) {
    _client = new Groq({ apiKey });
  }
  return _client;
};

/**
 * Available Groq models (free tier):
 *  - "llama-3.3-70b-versatile"   → Best quality, 6000 TPM
 *  - "llama-3.1-8b-instant"      → Fastest, very high limits
 *  - "mixtral-8x7b-32768"        → Good, 32k context window
 */
export const GROQ_MODEL = "llama-3.3-70b-versatile";
