import { body, query } from "express-validator";

export const loginRules = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Enter a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const interestQueryRules = [
  query("branch").optional().trim().isLength({ max: 20 }),
  query("type").optional().isIn(["committed", "exploring"]),
];
