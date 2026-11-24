import { body, param } from "express-validator";
import { EDUCATION_STAGES } from "../constants/educationStages.js";

const LEVELS = ["beginner", "intermediate", "advanced"];
const STYLES = ["visual", "hands-on", "reading"];

export const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Enter a valid email address"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("branch").optional({ values: "falsy" }).isString().trim().isLength({ max: 20 }),
  body("educationStage").optional({ values: "falsy" }).isIn(EDUCATION_STAGES).withMessage("Select a valid education stage"),
  body("academicStream").optional().isString().trim().isLength({ max: 40 }),
  body("degreeOrProgram").optional().isString().trim().isLength({ max: 60 }),
  body("specialization").optional().isString().trim().isLength({ max: 60 }),
  body("yearOfStudy").optional().isString().trim().isLength({ max: 20 }),
  body("semester").optional().isString().trim().isLength({ max: 20 }),
  body("expectedGraduationYear").optional({ nullable: true }).isInt({ min: 1900, max: 2200 }).toInt(),
  body("schoolOrInstitution").optional().isString().trim().isLength({ max: 120 }),
  body("board").optional().isString().trim().isLength({ max: 40 }),
  body("subjects").optional().isArray({ max: 20 }),
  body("subjects.*").optional().isString().trim().isLength({ max: 60 }),
  body("country").optional().isString().trim().isLength({ max: 60 }),
  body("state").optional().isString().trim().isLength({ max: 80 }),
  body("city").optional().isString().trim().isLength({ max: 80 }),
  body("currentRole").optional().isString().trim().isLength({ max: 120 }),
  body("primaryCareerGoal").optional().isString().trim().isLength({ max: 120 }),
  body("alternativeCareerGoal").optional().isString().trim().isLength({ max: 120 }),
  body("targetRole").optional().isString().trim().isLength({ max: 120 }),
  body("interests").optional().isArray({ max: 15 }),
  body("interests.*").optional().isString().trim().isLength({ max: 120 }),
  body("skills").optional().isArray({ max: 30 }),
  body("skills.*.name").optional().isString().trim().notEmpty().isLength({ max: 60 }),
  body("skills.*.level").optional().isIn(LEVELS),
  body("weeklyHoursAvailable").optional().isFloat({ min: 0, max: 168 }).toFloat(),
  body("careerPreference").optional().isIn(["traditional", "unconventional", "both", "unsure"]),
  body("learningStyle").optional({ values: "falsy" }).isIn(STYLES),
  body("preferredLanguage").optional().isString().trim().isLength({ max: 40 }),
  body("onboardingCompleted").optional().isBoolean().toBoolean(),
  body("onboardingStep").optional().isInt({ min: 1, max: 6 }).toInt(),
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

export const extractProfileRules = [
  body("text").isString().trim().isLength({ min: 10, max: 2000 }).withMessage("Describe yourself in 10-2000 characters"),
];

export const preferencesRules = [
  body("shareContactWithGuides").optional().isBoolean().toBoolean(),
  body("shareProfileWithGuides").optional().isBoolean().toBoolean(),
  body("educationStage").optional({ values: "falsy" }).isIn(EDUCATION_STAGES).withMessage("Select a valid education stage"),
  body("academicStream").optional().isString().trim().isLength({ max: 40 }),
  body("degreeOrProgram").optional().isString().trim().isLength({ max: 60 }),
  body("specialization").optional().isString().trim().isLength({ max: 60 }),
  body("yearOfStudy").optional().isString().trim().isLength({ max: 20 }),
  body("semester").optional().isString().trim().isLength({ max: 20 }),
  body("expectedGraduationYear").optional({ nullable: true }).isInt({ min: 1900, max: 2200 }).toInt(),
  body("schoolOrInstitution").optional().isString().trim().isLength({ max: 120 }),
  body("board").optional().isString().trim().isLength({ max: 40 }),
  body("country").optional().isString().trim().isLength({ max: 60 }),
  body("state").optional().isString().trim().isLength({ max: 80 }),
  body("city").optional().isString().trim().isLength({ max: 80 }),
  body("subjects").optional().isArray({ max: 20 }),
  body("subjects.*").optional().isString().trim().isLength({ max: 60 }),
  body("primaryCareerGoal").optional().isString().trim().isLength({ max: 120 }),
  body("alternativeCareerGoal").optional().isString().trim().isLength({ max: 120 }),
  body("exploringCareers").optional().isArray({ max: 15 }),
  body("exploringCareers.*").optional().isString().trim().isLength({ max: 120 }),
  body("budgetRange").optional().isString().trim().isLength({ max: 40 }),
  body("strengths").optional().isArray({ max: 15 }),
  body("strengths.*").optional().isString().trim().isLength({ max: 120 }),
  body("weaknesses").optional().isArray({ max: 15 }),
  body("weaknesses.*").optional().isString().trim().isLength({ max: 120 }),
  body("dateOfBirth").optional().isISO8601().toDate(),
  body("ageBand").optional().isIn(["UNDER_18", "18_PLUS"]),
  body("currentRole").optional().isString().trim().isLength({ max: 120 }),
  body("targetRole").optional().isString().trim().isLength({ max: 120 }),
  body("experienceLevel").optional().isIn(LEVELS).withMessage(`experienceLevel must be one of: ${LEVELS.join(", ")}`),
  body("learningStyle").optional({ values: "falsy" }).isIn(STYLES).withMessage(`learningStyle must be one of: ${STYLES.join(", ")}`),
  body("goals").optional().isArray({ max: 15 }),
  body("goals.*").optional().isString().trim().isLength({ max: 120 }),
  body("interests").optional().isArray({ max: 15 }),
  body("interests.*").optional().isString().trim().isLength({ max: 120 }),
  body("skills").optional().isArray({ max: 30 }),
  body("skills.*.name").optional().isString().trim().notEmpty().isLength({ max: 60 }),
  body("skills.*.level").optional().isIn(LEVELS),
  body("weeklyHoursAvailable").optional().isFloat({ min: 0, max: 168 }).toFloat(),
  body("preferredLanguage").optional().isString().trim().isLength({ max: 40 }),
  body("onboardingCompleted").optional().isBoolean().toBoolean(),
  body("onboardingStep").optional().isInt({ min: 1, max: 6 }).toInt(),
  body("careerPreference").optional().isIn(["traditional", "unconventional", "both", "unsure"]),
];

// ── Google onboarding (new Google students completing their branch) ───────────

export const googleOnboardingRules = [
  body("branch").trim().notEmpty().withMessage("Branch is required").isLength({ max: 20 }),
  body("name").optional().trim().isLength({ min: 1, max: 100 }).withMessage("Name must be 1-100 characters"),
];
