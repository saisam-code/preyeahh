import { body, param, query } from "express-validator";

export const listCareerSubdomainsRules = [
  query("domainId").optional().isMongoId().withMessage("Career domain id must be valid"),
  query("branchId").optional().isMongoId().withMessage("Branch id must be valid"),
  query("branchName").optional().trim().isLength({ min: 2, max: 20 }),
];

export const createCareerSubdomainRules = [
  body("name").trim().notEmpty().withMessage("Subdomain name is required").isLength({ max: 100 }),
  body("slug").customSanitizer((value) => typeof value === "string" ? value.toLowerCase() : value),
  body("slug").custom((value) => typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
    .withMessage("Slug must use lowercase letters, numbers, and hyphens"),
  body("description").optional().trim().isLength({ max: 500 }),
  body("domainId").isMongoId().withMessage("Career domain id must be valid"),
  body("branchId").isMongoId().withMessage("Branch id must be valid"),
  body("displayOrder").optional().isInt({ min: 0 }).toInt(),
];

export const updateCareerSubdomainRules = [
  param("id").isMongoId().withMessage("Invalid subdomain id"),
  body("name").optional().trim().notEmpty().withMessage("Subdomain name cannot be empty").isLength({ max: 100 }),
  body("slug").optional().customSanitizer((value) => typeof value === "string" ? value.toLowerCase() : value),
  body("slug").optional().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must use lowercase letters, numbers, and hyphens"),
  body("description").optional().trim().isLength({ max: 500 }),
  body("displayOrder").optional().isInt({ min: 0 }).toInt(),
];

export const careerSubdomainIdRule = [param("id").isMongoId().withMessage("Invalid subdomain id")];
