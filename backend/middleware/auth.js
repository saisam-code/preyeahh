import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Student from "../models/Student.js";
import Guide from "../models/Guide.js";
import Admin from "../models/Admin.js";

const MODEL_BY_ROLE = { student: Student, guide: Guide, admin: Admin };

/**
 * Verifies the Bearer access token and attaches req.user.
 * Re-fetches the user document on every request (not just trusting the
 * JWT payload) so a guide whose status flips to "rejected" after their
 * token was issued is blocked immediately, not just at next login.
 */
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.split(" ")[1] : null;

  if (!token) throw ApiError.unauthorized("Not authenticated — no token provided");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  // Reject onboarding-only tokens — they must never be used for normal access
  if (decoded.purpose === "google_onboarding") {
    throw ApiError.unauthorized("Onboarding token cannot be used for this action");
  }

  const Model = MODEL_BY_ROLE[decoded.role];
  if (!Model) throw ApiError.unauthorized("Invalid token role");

  const user = await Model.findById(decoded.id);
  if (!user) throw ApiError.unauthorized("User belonging to this token no longer exists");

  if (decoded.role === "guide" && user.status !== "approved") {
    throw ApiError.forbidden("Guide account is not approved yet");
  }

  req.user = {
    id: user._id.toString(),
    role: decoded.role,
    branch: user.branch || null,
    doc: user,
  };
  next();
});

/**
 * Restricts a route to specific roles. Must run after protect().
 * Usage: router.delete("/:id", protect, authorize("admin"), controllerFn);
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw ApiError.forbidden("You do not have permission to perform this action");
  }
  next();
};

/**
 * Like protect(), but never throws if there's no/invalid token —
 * useful for routes that are public but behave differently when
 * a student happens to be logged in (e.g. cross-branch role badges).
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.split(" ")[1] : null;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose === "google_onboarding") return next(); // skip — onboarding token can't access optional routes
    const Model = MODEL_BY_ROLE[decoded.role];
    const user = Model && (await Model.findById(decoded.id));
    if (user) {
      req.user = { id: user._id.toString(), role: decoded.role, branch: user.branch || null, doc: user };
    }
  } catch {
    // invalid/expired token on an optional route — proceed as anonymous
  }
  next();
});

/**
 * Accepts ONLY Google onboarding tokens (short-lived, purpose-scoped).
 * Used by the POST /api/students/google-onboarding endpoint.
 * Normal access tokens are rejected — a pending Google student
 * must not be able to use a regular JWT here (or anywhere else).
 */
const protectGoogleOnboarding = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.split(" ")[1] : null;

  if (!token) throw ApiError.unauthorized("Not authenticated — no onboarding token provided");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw ApiError.unauthorized("Invalid or expired onboarding token");
  }

  if (decoded.purpose !== "google_onboarding") {
    throw ApiError.unauthorized("Invalid token for onboarding");
  }

  if (decoded.role !== "student") {
    throw ApiError.unauthorized("Invalid token for onboarding");
  }

  const student = await Student.findById(decoded.id);
  if (!student) throw ApiError.unauthorized("User belonging to this token no longer exists");

  req.user = {
    id: student._id.toString(),
    role: "student",
    branch: student.branch || null,
    doc: student,
  };
  next();
});

export { protect, authorize, optionalAuth, protectGoogleOnboarding };
