/**
 * SOURCE: Merged from preyeah-main/server/middleware/auth.js (App B)
 *         + preyeahouter/backend/middleware/auth.middleware.js (App A)
 *
 * UNIFIED PATTERN:
 *   - Bearer token (from Authorization header) or pp_rt cookie (from cookies)
 *   - Single req.user shape: { id, userId, role, branch, doc }
 *   - protect: mandatory auth, throws 401 if missing
 *   - optionalAuth: proceeds logged-in or anonymous (for onboarding flows)
 *   - roleGate(roles): optional auth + role check
 *
 * SECURITY:
 *   - Protect re-fetches user from DB on every request (prevent stale data)
 *   - refreshTokenVersion check prevents token reuse after logout
 *   - req.user.doc = full User document (for service methods that need it)
 */

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Extract JWT from Authorization header (Bearer) or pp_rt cookie.
 * Returns { token, source } or throws.
 */
function extractToken(req) {
  let token = null;
  let source = null;

  // ── Priority 1: Authorization: Bearer <token> ────────────────────────────
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.slice(7);
    source = "header";
  }
  // ── Priority 2: Cookie pp_rt ──────────────────────────────────────────────
  else if (req.cookies?.pp_rt) {
    token = req.cookies.pp_rt;
    source = "cookie";
  }

  if (!token) {
    throw new ApiError(401, "No access token provided");
  }

  return { token, source };
}

/**
 * Decode and verify JWT. If verification fails, handle gracefully.
 * Returns decoded { id, role, version } or throws.
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    }
    throw new ApiError(401, "Invalid access token");
  }
}

/**
 * PROTECT MIDDLEWARE
 * Mandatory: user must be authenticated.
 * Fetches fresh user from DB, validates refreshTokenVersion.
 * Sets req.user = { id, userId, role, branch, doc }.
 *
 * Usage: router.get("/profile", protect, userController.getProfile)
 */
export const protect = async (req, res, next) => {
  try {
    const { token } = extractToken(req);
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // ── Check if refresh token was revoked (logout happened) ────────────────
    if (user.refreshTokenVersion !== decoded.version) {
      throw new ApiError(401, "Refresh token invalidated (logged out elsewhere)");
    }

    // ── Set canonical req.user shape ───────────────────────────────────────
    req.user = {
      id:     decoded.id,
      userId: decoded.id, // Back-compat alias for AI-learning controllers
      role:   user.role,
      branch: user.branch || null,
      doc:    user, // Full user document for services
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * OPTIONAL AUTH MIDDLEWARE
 * Non-mandatory: proceeds logged-in or anonymous.
 * If token exists and valid, sets req.user. Otherwise, req.user = null.
 *
 * Usage: router.get("/onboarding", optionalAuth, onboardingController.get)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const { token } = extractToken(req);
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id);
    if (user && user.refreshTokenVersion === decoded.version) {
      req.user = {
        id:     decoded.id,
        userId: decoded.id, // Back-compat alias
        role:   user.role,
        branch: user.branch || null,
        doc:    user,
      };
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
};

/**
 * ROLE GATE MIDDLEWARE
 * Requires auth + one of the specified roles.
 *
 * Usage: router.post("/admin", roleGate("admin"), adminController.getDashboard)
 *        router.post("/guide", roleGate(["guide", "admin"]), guideController.getStudents)
 */
export const roleGate = (allowedRoles) => {
  // Allow single role string or array
  const roles = typeof allowedRoles === "string" ? [allowedRoles] : allowedRoles;

  return async (req, res, next) => {
    try {
      // ── First run protect to get req.user ───────────────────────────────
      await protect(req, res, () => {});

      if (!req.user || !roles.includes(req.user.role)) {
        throw new ApiError(
          403,
          `Forbidden. Required role: ${roles.join(" or ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Extract decoded token WITHOUT fetching user (for refresh flow).
 * Used by POST /auth/refresh to verify refresh token before issuing new access token.
 *
 * Returns { decoded, source } or throws.
 */
export function extractAndVerifyToken(req) {
  const { token } = extractToken(req);
  // Note: This decodes but doesn't validate signature yet.
  // Caller (refresh.controller) will verify using JWT_REFRESH_SECRET.
  return jwt.decode(token);
}
