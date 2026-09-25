import User from "../models/User.js";
import { getGroqClient, GROQ_MODEL } from "../config/groq.js";
import {
  buildProfileExtractionPrompt,
  buildPassiveExtractionPrompt,
} from "../utils/prompts.js";

/**
 * Get current user profile with preferences.
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-password -googleId -__v");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Manually update user profile fields and preferences.
 * Merges provided fields into existing preferences (does not wipe what's not sent).
 */
export const updateUserProfile = async (userId, updates) => {
  const {
    firstName,
    lastName,
    avatarUrl,
    currentRole,
    targetRole,
    experienceLevel,
    goals,
    skills,
    interests,
    learningStyle,
    weeklyHoursAvailable,
    preferredLanguage,
  } = updates;

  // Build the update object (only include provided fields)
  const profileUpdate = {};
  if (firstName !== undefined) profileUpdate.firstName = firstName;
  if (lastName !== undefined) profileUpdate.lastName = lastName;
  if (avatarUrl !== undefined) profileUpdate.avatarUrl = avatarUrl;

  const preferencesUpdate = {
    "preferences.onboardingCompleted": true,
    "preferences.onboardingSkipped": false,
  };
  if (currentRole !== undefined) preferencesUpdate["preferences.currentRole"] = currentRole;
  if (targetRole !== undefined) preferencesUpdate["preferences.targetRole"] = targetRole;
  if (experienceLevel !== undefined) preferencesUpdate["preferences.experienceLevel"] = experienceLevel;
  if (goals !== undefined) preferencesUpdate["preferences.goals"] = goals;
  if (skills !== undefined) preferencesUpdate["preferences.skills"] = skills;
  if (interests !== undefined) preferencesUpdate["preferences.interests"] = interests;
  if (learningStyle !== undefined) preferencesUpdate["preferences.learningStyle"] = learningStyle;
  if (weeklyHoursAvailable !== undefined) preferencesUpdate["preferences.weeklyHoursAvailable"] = weeklyHoursAvailable;
  if (preferredLanguage !== undefined) preferencesUpdate["preferences.preferredLanguage"] = preferredLanguage;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { ...profileUpdate, ...preferencesUpdate } },
    { new: true, runValidators: true }
  ).select("-password -googleId -__v");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Skip onboarding — mark it as skipped without filling preferences.
 */
export const skipOnboarding = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        "preferences.onboardingSkipped": true,
        "preferences.onboardingCompleted": false,
      },
    },
    { new: true }
  ).select("-password -googleId -__v");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Use AI to extract a structured profile from free-form user description text.
 * Saves the result directly to User.preferences.
 */
export const extractAndSaveProfile = async (userId, text) => {
  if (!text || text.trim().length < 10) {
    const error = new Error("Please provide at least a brief description about yourself");
    error.statusCode = 400;
    throw error;
  }

  const groq = getGroqClient();
  const prompt = buildProfileExtractionPrompt(text.trim());

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.2, // low temp for consistent structured output
    max_tokens: 1024,
  });

  let extracted;
  try {
    extracted = JSON.parse(completion.choices[0]?.message?.content || "{}");
  } catch {
    const error = new Error("AI returned invalid profile data. Please try again.");
    error.statusCode = 500;
    throw error;
  }

  // Build the $set update from extracted fields (skip nulls/empty)
  const setFields = {
    "preferences.onboardingCompleted": true,
    "preferences.onboardingSkipped": false,
    "preferences.lastExtractedAt": new Date(),
  };

  if (extracted.currentRole) setFields["preferences.currentRole"] = extracted.currentRole;
  if (extracted.targetRole) setFields["preferences.targetRole"] = extracted.targetRole;
  if (extracted.experienceLevel) setFields["preferences.experienceLevel"] = extracted.experienceLevel;
  if (Array.isArray(extracted.goals) && extracted.goals.length > 0) setFields["preferences.goals"] = extracted.goals;
  if (Array.isArray(extracted.skills) && extracted.skills.length > 0) setFields["preferences.skills"] = extracted.skills;
  if (Array.isArray(extracted.interests) && extracted.interests.length > 0) setFields["preferences.interests"] = extracted.interests;
  if (extracted.learningStyle) setFields["preferences.learningStyle"] = extracted.learningStyle;
  if (extracted.weeklyHoursAvailable > 0) setFields["preferences.weeklyHoursAvailable"] = extracted.weeklyHoursAvailable;
  if (extracted.preferredLanguage) setFields["preferences.preferredLanguage"] = extracted.preferredLanguage;
  if (extracted.aiProfileSummary) setFields["preferences.aiProfileSummary"] = extracted.aiProfileSummary;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: setFields },
    { new: true }
  ).select("-password -googleId -__v");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return { user, extracted };
};

/**
 * Passively extract and MERGE profile signals from recent chat messages.
 * Designed to run non-blocking (fire-and-forget) in the background.
 * @param {string} userId
 * @param {Array} messages - All chat messages so far
 * @param {object} currentPreferences - Existing User.preferences
 */
export const passivelyUpdateProfile = async (userId, messages, currentPreferences) => {
  try {
    const groq = getGroqClient();
    const prompt = buildPassiveExtractionPrompt(messages, currentPreferences);

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 512,
    });

    let extracted;
    try {
      extracted = JSON.parse(completion.choices[0]?.message?.content || "{}");
    } catch {
      return; // Silently skip if parsing fails
    }

    // Only update fields that have new non-null values
    const setFields = { "preferences.lastExtractedAt": new Date() };

    if (extracted.currentRole) setFields["preferences.currentRole"] = extracted.currentRole;
    if (extracted.targetRole) setFields["preferences.targetRole"] = extracted.targetRole;
    if (extracted.experienceLevel) setFields["preferences.experienceLevel"] = extracted.experienceLevel;
    if (extracted.learningStyle) setFields["preferences.learningStyle"] = extracted.learningStyle;
    if (extracted.weeklyHoursAvailable > 0) setFields["preferences.weeklyHoursAvailable"] = extracted.weeklyHoursAvailable;
    if (extracted.preferredLanguage) setFields["preferences.preferredLanguage"] = extracted.preferredLanguage;
    if (extracted.aiProfileSummary) setFields["preferences.aiProfileSummary"] = extracted.aiProfileSummary;

    // Merge arrays (add new items, avoid duplicates)
    const addToSet = {};
    if (Array.isArray(extracted.goals) && extracted.goals.length > 0) {
      addToSet["preferences.goals"] = { $each: extracted.goals };
    }
    if (Array.isArray(extracted.interests) && extracted.interests.length > 0) {
      addToSet["preferences.interests"] = { $each: extracted.interests };
    }

    const updateOp = { $set: setFields };
    if (Object.keys(addToSet).length > 0) {
      updateOp.$addToSet = addToSet;
    }

    // Handle skills separately (merge by name)
    if (Array.isArray(extracted.skills) && extracted.skills.length > 0) {
      const user = await User.findById(userId).select("preferences.skills");
      if (user) {
        const existingSkills = user.preferences?.skills || [];
        const mergedSkills = [...existingSkills];

        for (const newSkill of extracted.skills) {
          const idx = mergedSkills.findIndex(
            (s) => s.name.toLowerCase() === newSkill.name.toLowerCase()
          );
          if (idx >= 0) {
            mergedSkills[idx] = newSkill; // update existing
          } else {
            mergedSkills.push(newSkill); // add new
          }
        }
        setFields["preferences.skills"] = mergedSkills;
      }
    }

    await User.findByIdAndUpdate(userId, updateOp);
    console.log(`[Profile] Passive update applied for user ${userId}`);
  } catch (err) {
    // Non-blocking: log but don't crash the request
    console.warn(`[Profile] Passive extraction failed for user ${userId}:`, err.message);
  }
};
