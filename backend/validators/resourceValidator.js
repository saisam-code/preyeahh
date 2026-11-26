import { body, param, query } from "express-validator";

const TYPES = ["video", "article", "documentation", "course", "github", "practice", "book"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced", "all"];
const RESOURCE_TYPES = ["curated-list", "tutorial", "project", "course", "documentation", "article", "video", "tool", "repository", "other", ""];

export const idParamRule = [param("id").isMongoId().withMessage("Invalid resource id")];

export const searchRules = [
  query("q").optional().trim().isLength({ max: 100 }),
  query("technology").optional().trim().isLength({ max: 50 }),
  query("branch").optional().trim().isLength({ max: 20 }),
  query("type").optional().isIn(TYPES),
  query("resourceType").optional().isIn(RESOURCE_TYPES),
  query("category").optional().trim().isLength({ max: 100 }),
  query("role").optional().trim().isLength({ max: 120 }),
  query("skill").optional().trim().isLength({ max: 100 }),
  query("domain").optional().trim().isLength({ max: 80 }),
  query("sourceRepository").optional().trim().isLength({ max: 120 }),
  query("sourceCategory").optional().trim().isLength({ max: 100 }),
  query("difficulty").optional().isIn(DIFFICULTIES),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
];

export const recommendRules = [
  body("technology").isString().trim().notEmpty().withMessage("technology is required"),
  body("tags").optional().isArray({ max: 10 }),
  body("difficulty").optional().isIn(DIFFICULTIES),
  body("learningStyle").optional().isIn(["visual", "hands-on", "reading", ""]),
  body("branch").optional().isString().trim().isLength({ max: 20 }),
];

export const createResourceRules = [
  body("title").isString().trim().notEmpty().isLength({ max: 200 }),
  body("description").isString().trim().notEmpty().isLength({ max: 1000 }),
  body("type").isIn(TYPES).withMessage("Invalid resource type"),
  body("url").isURL({ require_protocol: true }).withMessage("A full URL (https://…) is required"),
  body("technology").isString().trim().notEmpty().isLength({ max: 50 }),
  body("category").optional().isString().trim().isLength({ max: 50 }),
  body("provider").optional().isString().trim().isLength({ max: 80 }),
  body("tags").optional().isArray({ max: 20 }),
  body("branches").optional().isArray({ max: 20 }),
  body("difficulty").optional().isIn(DIFFICULTIES),
  body("estimatedDuration").optional().isInt({ min: 0 }).toInt(),
];

export const updateResourceRules = [
  param("id").isMongoId().withMessage("Invalid resource id"),
  body().custom((value) => Object.keys(value || {}).length > 0).withMessage("Provide at least one resource field to update"),
  body("title").optional().isString().trim().notEmpty().isLength({ max: 200 }),
  body("description").optional().isString().trim().notEmpty().isLength({ max: 1000 }),
  body("type").optional().isIn(TYPES),
  body("url").optional().isURL({ require_protocol: true }),
  body("technology").optional().isString().trim().notEmpty().isLength({ max: 50 }),
  body("category").optional().isString().trim().isLength({ max: 100 }),
  body("provider").optional().isString().trim().isLength({ max: 120 }),
  body("tags").optional().isArray({ max: 30 }),
  body("difficulty").optional().isIn(DIFFICULTIES),
  body("resourceType").optional().isIn(RESOURCE_TYPES),
  body("sourceCategory").optional().isString().trim().isLength({ max: 100 }),
  body("sourceSubcategory").optional().isString().trim().isLength({ max: 200 }),
  body("relatedDomains").optional().isArray({ max: 20 }),
  body("relatedRoles").optional().isArray({ max: 50 }),
  body("relatedSkills").optional().isArray({ max: 50 }),
  body("relatedTechnologies").optional().isArray({ max: 50 }),
  body("relatedDomains.*").optional().isString().trim().isLength({ max: 80 }),
  body("relatedRoles.*").optional().isString().trim().isLength({ max: 120 }),
  body("relatedSkills.*").optional().isString().trim().isLength({ max: 100 }),
  body("relatedTechnologies.*").optional().isString().trim().isLength({ max: 80 }),
  body("tags.*").optional().isString().trim().isLength({ max: 60 }),
  body("attribution").optional().isString().trim().isLength({ max: 500 }),
  body("sourceLicense").optional().isString().trim().isLength({ max: 200 }),
  body("importStatus").optional().isIn(["mapped", "duplicate", "excluded", "failed", ""]),
  body("exclusionReason").optional().isString().trim().isLength({ max: 500 }),
];
