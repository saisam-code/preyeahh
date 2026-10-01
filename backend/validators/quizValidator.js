import { body, param, query } from "express-validator";

export const idParamRule = [param("id").isMongoId().withMessage("Invalid quiz id")];

export const listRules = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
];

export const generateRules = [
  body("topic").optional({ values: "falsy" }).isString().trim().isLength({ max: 120 }),
  body("roleId").optional({ nullable: true, values: "falsy" }).isMongoId().withMessage("Invalid role id"),
  body("difficulty").optional().isIn(["beginner", "intermediate", "advanced"]).withMessage("Invalid difficulty"),
  body().custom((_, { req }) => {
    if (!req.body.topic?.trim() && !req.body.roleId) throw new Error("Provide a topic or a roleId");
    return true;
  }),
];

export const submitRules = [
  ...idParamRule,
  body("answers").isArray({ min: 1, max: 20 }).withMessage("answers must be a non-empty array"),
  body("answers.*").isString().withMessage("Each answer must be a string"),
];
