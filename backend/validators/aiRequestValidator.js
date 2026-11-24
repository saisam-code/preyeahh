import { body } from "express-validator";

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
