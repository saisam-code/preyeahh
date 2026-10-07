import { body, param } from "express-validator";

export const createRoleRequestRules = [
  body("roleName").trim().notEmpty().withMessage("Role name is required").isLength({ max: 150 }),
  body("branch").trim().notEmpty().withMessage("Branch is required").isLength({ max: 20 }),
  body("summary").trim().notEmpty().withMessage("Summary is required").isLength({ max: 1000 }),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email address"),
];

export const idParamRule = [param("id").isMongoId().withMessage("Invalid request id")];
