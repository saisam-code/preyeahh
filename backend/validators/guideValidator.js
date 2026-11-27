import { body, param } from "express-validator";

export const googleGuideOnboardingRules = [
  body("name").optional().trim().isLength({ min: 1, max: 100 }),
  body("branch").isString().trim().notEmpty().isLength({ max: 20 }),
  body("domainId").isMongoId().withMessage("Choose a career domain"),
  body("roleNames").isArray({ min: 1, max: 10 }),
  body("roleNames.*").isString().trim().notEmpty().isLength({ max: 100 }),
  body("bio").optional().isString().trim().isLength({ max: 1000 }),
];

export const loginRules = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Enter a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const idParamRule = [param("id").isMongoId().withMessage("Invalid guide id")];

export const setStatusRules = [
  param("id").isMongoId().withMessage("Invalid guide id"),
  body("status").isIn(["pending", "approved", "rejected"]).withMessage("Invalid status"),
];

export const assignRolesRules = [
  param("id").isMongoId().withMessage("Invalid guide id"),
  body("roleNames").isArray({ min: 1 }).withMessage("Select at least one role"),
  body("roleNames.*").isString().trim().notEmpty(),
];

export const assignDomainRules = [
  param("id").isMongoId().withMessage("Invalid guide id"),
  body("domainId").isMongoId().withMessage("Choose a valid career domain"),
];
