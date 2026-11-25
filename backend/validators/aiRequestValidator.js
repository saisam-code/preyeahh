import { body, param, query } from "express-validator";

export const discoverCareersRules = [
  query("subdomainId").optional().isMongoId().withMessage("Career subdomain id must be valid"),
];

export const compareGovernmentJobsRules = [
  body("slugs")
    .isArray({ min: 2, max: 5 })
    .withMessage("Select between 2 and 5 government career paths"),
  body("slugs.*").isString().trim().isLength({ min: 1, max: 120 }),
];

export const compareCareersRules = [
  body("roleIds").isArray({ min: 2, max: 5 }).withMessage("Select between 2 and 5 careers"),
  body("roleIds.*").isMongoId().withMessage("Each role must have a valid ID"),
];

export const analyzeCareerSwitchRules = [
  body("currentCareer").optional().isString().trim().isLength({ max: 120 }),
  body("targetCareer").isString().trim().notEmpty().isLength({ max: 120 }),
  body("currentSkills").optional().isArray({ max: 30 }),
  body("currentSkills.*").optional().isString().trim().isLength({ min: 1, max: 80 }),
];

export const calculateFinancialRoiRules = [
  body("educationCostMin").optional({ values: "falsy" }).isFloat({ min: 0, max: 1_000_000_000 }).toFloat(),
  body("educationCostMax").optional({ values: "falsy" }).isFloat({ min: 0, max: 1_000_000_000 }).toFloat(),
  body("startingSalary").optional({ values: "falsy" }).isFloat({ min: 0, max: 1_000_000_000 }).toFloat(),
  body("savingsRatePercent").optional({ values: "falsy" }).isFloat({ min: 5, max: 80 }).toFloat(),
  body("timeToPaybackYears").optional({ values: "falsy" }).isFloat({ min: 0.1, max: 100 }).toFloat(),
];

export const completeExperimentRules = [
  param("id").isMongoId().withMessage("Invalid experiment id"),
  body("evidenceUrl").optional({ values: "falsy" }).isURL().withMessage("Evidence URL must be valid"),
  body("reflectionNotes").optional().isString().isLength({ max: 2000 }),
  body("skillsGained").optional().isArray({ max: 30 }),
  body("skillsGained.*").optional().isString().trim().isLength({ min: 1, max: 80 }),
  body("rating").optional({ values: "falsy" }).isInt({ min: 1, max: 5 }).toInt(),
  body("enjoyed").optional({ values: "falsy" }).isIn(["yes", "unsure", "no"]),
  body("difficultyNotes").optional().isString().isLength({ max: 1000 }),
  body("wouldContinue").optional({ values: "falsy" }).isIn(["yes", "unsure", "no"]),
  body("nextStepRecommendation").optional().isString().isLength({ max: 1000 }),
];
