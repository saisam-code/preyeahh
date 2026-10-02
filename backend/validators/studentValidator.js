import { body, param } from "express-validator";

export const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Enter a valid email address"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("branch").trim().notEmpty().withMessage("Branch is required").isLength({ max: 20 }),
];

export const loginRules = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Enter a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const interestRules = [
  body("roleId").isMongoId().withMessage("Invalid role id"),
  body("committed").isBoolean().withMessage("committed must be true or false").toBoolean(),
];

export const roleIdParamRule = [param("roleId").isMongoId().withMessage("Invalid role id")];

// ── AI profile (onboarding) ──────────────────────────────────────

const LEVELS = ["beginner", "intermediate", "advanced"];
const STYLES = ["visual", "hands-on", "reading"];

export const extractProfileRules = [
  body("text").isString().trim().isLength({ min: 10, max: 2000 }).withMessage("Describe yourself in 10-2000 characters"),
];

export const preferencesRules = [
  body("shareContactWithGuides").optional().isBoolean().toBoolean(),
  body("shareLearningActivityWithGuides").optional().isBoolean().toBoolean(),
  body("currentRole").optional().isString().trim().isLength({ max: 120 }),
  body("targetRole").optional().isString().trim().isLength({ max: 120 }),
  body("experienceLevel").optional().isIn(LEVELS).withMessage(`experienceLevel must be one of: ${LEVELS.join(", ")}`),
  body("learningStyle").optional().isIn(STYLES).withMessage(`learningStyle must be one of: ${STYLES.join(", ")}`),
  body("goals").optional().isArray({ max: 15 }),
  body("goals.*").optional().isString().trim().isLength({ max: 120 }),
  body("interests").optional().isArray({ max: 15 }),
  body("interests.*").optional().isString().trim().isLength({ max: 120 }),
  body("skills").optional().isArray({ max: 30 }),
  body("skills.*.name").optional().isString().trim().notEmpty().isLength({ max: 60 }),
  body("skills.*.level").optional().isIn(LEVELS),
  body("weeklyHoursAvailable").optional().isFloat({ min: 0, max: 168 }).toFloat(),
  body("preferredLanguage").optional().isString().trim().isLength({ max: 40 }),
];
