import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import { getGroqClient, GROQ_MODEL } from "../config/groq.js";

function isRateLimit(err) {
  return (
    err?.status === 429 ||
    err?.statusCode === 429 ||
    /429|rate_limit|too many requests|quota/i.test(err?.message || "")
  );
}

/** Maps any Groq/SDK failure to an ApiError so the central errorHandler returns a useful message. */
function toApiError(err) {
  if (err instanceof ApiError) return err;
  if (isRateLimit(err)) {
    return new ApiError(429, "AI service is busy right now (rate limit). Please try again in a minute.");
  }
  if (/GROQ_API_KEY/.test(err?.message || "")) {
    return new ApiError(503, "AI service is not configured on the server.");
  }
  logger.error("[groq] request failed:", err?.message);
  return new ApiError(502, "AI service is temporarily unavailable. Please try again.");
}

/** Plain chat completion. Returns the assistant text. */
export async function chatCompletion(messages, { temperature = 0.7, maxTokens = 2048 } = {}) {
  try {
    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    });
    return completion.choices[0]?.message?.content?.trim() || "";
  } catch (err) {
    throw toApiError(err);
  }
}

/** JSON-mode completion. Returns the parsed object or throws a 502 ApiError on unparseable output. */
export async function jsonCompletion(prompt, { temperature = 0.3, maxTokens = 2048 } = {}) {
  let raw;
  try {
    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature,
      max_tokens: maxTokens,
    });
    raw = completion.choices[0]?.message?.content || "{}";
  } catch (err) {
    throw toApiError(err);
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new ApiError(502, "AI returned invalid data. Please try again.");
  }
}
