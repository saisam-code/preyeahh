import { body, cookie } from "express-validator";

const emailRule = (field) => body(field)
  .trim()
  .notEmpty()
  .withMessage("Email is required")
  .isEmail()
  .withMessage("Enter a valid email address")
  .normalizeEmail();

const passwordRule = () => body("password")
  .isString()
  .notEmpty()
  .withMessage("Password is required");

export const parentRegisterRules = [
  body("name").isString().trim().notEmpty().isLength({ max: 100 }),
  emailRule("email"),
  passwordRule(),
  body("phone").optional().isString().trim().isLength({ max: 30 }),
  body("relationship").optional().isString().trim().isLength({ max: 40 }),
  body("studentEmail").optional({ values: "falsy" }).trim().isEmail().normalizeEmail(),
];

export const institutionRegisterRules = [
  body("name").isString().trim().notEmpty().isLength({ max: 120 }),
  body("code").isString().trim().notEmpty().isLength({ max: 40 }),
  body("category").optional().isString().trim().isLength({ max: 80 }),
  body("location").optional().isString().trim().isLength({ max: 160 }),
  body("website").optional({ values: "falsy" }).isURL({ require_protocol: true }).isLength({ max: 2048 }),
  emailRule("contactEmail"),
  passwordRule(),
  body("contactPerson").optional().isString().trim().isLength({ max: 100 }),
  body("designation").optional().isString().trim().isLength({ max: 100 }),
];

export const extendedLoginRules = [
  emailRule("email"),
  passwordRule(),
];

export const parentRefreshRules = [
  cookie("pp_rt_parent").optional().isString().isLength({ max: 4096 }),
];

export const institutionRefreshRules = [
  cookie("pp_rt_institution").optional().isString().isLength({ max: 4096 }),
];
