import { body, param, query } from "express-validator";

const VALID_TYPES = ["core", "non-core"];

const guidanceRules = [
  body("guidance.overview").optional().trim().isLength({ max: 2000 }),
  body("guidance.steps").optional().isArray().withMessage("guidance.steps must be an array of strings"),
  body("guidance.steps.*").optional().isString().trim(),
  body("guidance.skills").optional().isArray().withMessage("guidance.skills must be an array of strings"),
  body("guidance.skills.*").optional().isString().trim(),
  body("guidance.resources").optional().isArray().withMessage("guidance.resources must be an array of strings"),
  body("guidance.resources.*").optional().isString().trim(),
];

export const createRoleRules = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 120 }),
  body("branch").trim().notEmpty().withMessage("Branch is required").isLength({ max: 20 }),
  body("type").isIn(VALID_TYPES).withMessage("Type must be 'core' or 'non-core'"),
  body("description").optional().trim().isLength({ max: 500 }),
  ...guidanceRules,
];

export const updateRoleRules = [
  param("id").isMongoId().withMessage("Invalid role id"),
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty").isLength({ max: 120 }),
  body("branch").optional().trim().isLength({ max: 20 }),
  body("type").optional().isIn(VALID_TYPES).withMessage("Type must be 'core' or 'non-core'"),
  body("description").optional().trim().isLength({ max: 500 }),
  ...guidanceRules,
];

export const idParamRule = [param("id").isMongoId().withMessage("Invalid role id")];

export const listQueryRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be 1-100").toInt(),
  query("type").optional().isIn(VALID_TYPES).withMessage("type must be 'core' or 'non-core'"),
  query("branch").optional().trim().isLength({ max: 20 }),
  query("search").optional().trim().isLength({ max: 100 }),
];
