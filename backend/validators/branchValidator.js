import { body, param, query } from "express-validator";

export const listBranchesRules = [
  query("domainId").optional().isMongoId().withMessage("Career domain id must be valid"),
];

export const createBranchRules = [
  body("name").trim().notEmpty().withMessage("Branch name is required").isLength({ min: 2, max: 20 }),
  body("domainIds").optional().isArray().withMessage("domainIds must be an array"),
  body("domainIds.*").optional().isMongoId().withMessage("Every domain id must be valid"),
];

export const updateBranchDomainsRules = [
  param("name").trim().notEmpty().withMessage("Branch name is required"),
  body("domainIds").isArray().withMessage("domainIds must be an array"),
  body("domainIds.*").isMongoId().withMessage("Every domain id must be valid"),
];

export const branchNameParamRule = [
  param("name").trim().notEmpty().withMessage("Branch name is required"),
];
