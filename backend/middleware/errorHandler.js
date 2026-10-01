import ApiError from "../utils/ApiError.js";

/**
 * Centralized error handler — must be the LAST middleware registered in app.js.
 * Normalizes Mongoose errors (CastError, ValidationError, duplicate key)
 * into ApiError before responding, so every error leaving the API has the
 * same JSON shape: { success, statusCode, message, errors }
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // Invalid MongoDB ObjectId
  if (err.name === "CastError") {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // Mongoose schema validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = ApiError.badRequest("Validation failed", messages);
  }

  // Duplicate key error (unique index violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    error = ApiError.conflict(`Duplicate value for field: ${field}`);
  }

  // Invalid / expired JWT
  if (err.name === "JsonWebTokenError") {
    error = ApiError.unauthorized("Invalid authentication token");
  }
  if (err.name === "TokenExpiredError") {
    error = ApiError.unauthorized("Authentication token expired");
  }

  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : "Something went wrong on the server";

  if (process.env.NODE_ENV === "development") {
    console.error(err);
  } else if (statusCode === 500) {
    console.error(`[error] ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

export default errorHandler;
