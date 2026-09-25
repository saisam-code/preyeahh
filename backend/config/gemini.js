import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Get a Gemini generative model instance.
 * @param {string} modelName - e.g. "gemini-1.5-flash", "gemini-1.5-pro"
 */
export const getGeminiModel = (modelName = "gemini-2.0-flash") => {
  const genAI = getGeminiClient();
  return genAI.getGenerativeModel({ model: modelName });
};

export default getGeminiClient;
