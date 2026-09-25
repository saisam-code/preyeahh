import jwt from "jsonwebtoken";

// Matches decoded shape expected by backend/middleware/auth.middleware.js:
// { id, version } where version === user.refreshTokenVersion

export const signAccessToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), version: user.refreshTokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "15m" }
  );

export const signRefreshToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), version: user.refreshTokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d" }
  );

export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

/**
 * Issues a new access + refresh token pair for a user.
 * Sets the refresh token as an httpOnly cookie (pp_rt) and
 * returns the access token to be sent in the JSON body.
 */
export const issueTokenPair = (user, res) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie("pp_rt", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d, keep in sync with JWT_REFRESH_EXPIRE
  });

  return accessToken;
};
