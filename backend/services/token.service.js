/**
 * SOURCE: preyeah-main/server/services/tokenService.js (App B)
 * CHANGES:
 *   - CJS require → ESM import/export
 *   - pp_rt_{role} (3 role-scoped cookies) → pp_rt (single unified cookie)
 *     Rationale from audit: collapsing to one cookie is a "rewrite pattern,
 *     modify implementation" — the role is already in the JWT payload so the
 *     cookie name no longer needs to encode it.
 *   - JWT_EXPIRE default raised to 15m (kept from App B)
 *   - JWT_REFRESH_EXPIRE default kept at 7d
 *   - All function signatures preserved; callers no longer pass role to
 *     clearRefreshCookie / refreshCookieOptions.
 *
 * NOT CHANGED: signing logic, version check pattern, cookie security options.
 */
import jwt from "jsonwebtoken";

// ── Access token (short-lived, sent as Bearer in Authorization header) ─────
export function signAccessToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "15m",
  });
}

// ── Refresh token (long-lived, stored in httpOnly cookie pp_rt) ────────────
export function signRefreshToken(id, role, version = 0) {
  return jwt.sign({ id, role, version }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

// ── Cookie options (shared; role removed from cookie name) ────────────────
export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/api",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

/**
 * issueTokens — signs a fresh access token AND rotates the refresh cookie.
 * Called on login and on every successful POST /api/auth/refresh.
 * Rotation limits replay if a refresh token ever leaks.
 *
 * App B used: res.cookie(`pp_rt_${role}`, ...)
 * UNI uses:   res.cookie("pp_rt", ...)   ← role is inside the JWT payload
 */
export function issueTokens(res, user, role) {
  const accessToken  = signAccessToken(user._id, role);
  const refreshToken = signRefreshToken(user._id, role, user.refreshTokenVersion || 0);
  res.cookie("pp_rt", refreshToken, refreshCookieOptions());
  return accessToken;
}

/**
 * clearRefreshCookie — removes the unified pp_rt cookie on logout.
 * App B had clearRefreshCookie(res, role) — role param dropped here
 * since the cookie is no longer role-scoped.
 */
export function clearRefreshCookie(res) {
  const opts = refreshCookieOptions();
  delete opts.maxAge;
  res.clearCookie("pp_rt", opts);
}
