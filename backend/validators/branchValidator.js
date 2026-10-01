import { body, param } from "express-validator";

export const createBranchRules = [
  body("name").trim().notEmpty().withMessage("Branch name is required").isLength({ min: 2, max: 20 }),
];

export const branchNameParamRule = [
  param("name").trim().notEmpty().withMessage("Branch name is required"),
];
