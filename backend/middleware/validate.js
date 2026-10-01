import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

/**
 * Runs after an array of express-validator rules on a route.
 * Collects all field errors into ApiError's standard `errors` array
 * instead of express-validator's default shape, so every endpoint
 * returns the same { success, message, errors: [{ field, message }] } body.
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  next(ApiError.badRequest("Validation failed", errors));
}

export default validate;
