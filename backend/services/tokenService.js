import jwt from "jsonwebtoken";

function signAccessToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "15m",
  });
}

/**
 * Short-lived token for Google onboarding only.
 * Cannot be used as a normal access token — protect() rejects tokens
 * that carry a `purpose` claim.
 */
function signOnboardingToken(id, role) {
  return jwt.sign({ id, role, purpose: "google_onboarding" }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
}

function signRefreshToken(id, role, version = 0) {
  return jwt.sign({ id, role, version }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/api",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

// Issues a fresh access token AND rotates the refresh cookie. Call this on
// login and on every successful /refresh — rotation limits replay if a
// refresh token ever leaks.
function issueTokens(res, doc, role) {
  const accessToken = signAccessToken(doc._id, role);
  const refreshToken = signRefreshToken(doc._id, role, doc.refreshTokenVersion || 0);
  res.cookie(`pp_rt_${role}`, refreshToken, refreshCookieOptions());
  return accessToken;
}

function clearRefreshCookie(res, role) {
  res.clearCookie(`pp_rt_${role}`, { ...refreshCookieOptions(), maxAge: undefined });
}

export {
  signAccessToken,
  signOnboardingToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
  issueTokens,
  clearRefreshCookie,
};
