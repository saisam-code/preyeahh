import { body, param, query } from "express-validator";

const TYPES = ["video", "article", "documentation", "course", "github", "practice", "book"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced", "all"];

export const idParamRule = [param("id").isMongoId().withMessage("Invalid resource id")];

export const searchRules = [
  query("q").optional().trim().isLength({ max: 100 }),
  query("technology").optional().trim().isLength({ max: 50 }),
  query("branch").optional().trim().isLength({ max: 20 }),
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
