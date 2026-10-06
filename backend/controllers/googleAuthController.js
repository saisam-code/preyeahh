/**
 * Google OAuth 2.0 Authorization Code flow controller.
 *
 * Routes:
 *   GET /api/auth/google          — initiates OAuth redirect to Google
 *   GET /api/auth/google/callback — receives code, verifies, finds/creates student
 *
 * Security:
 *   - CSRF state: cryptographically random, stored in a short-lived httpOnly cookie
 *   - ID token verified (signature + iss + aud + exp + email_verified)
 *   - google sub used as stable external identity key (never email)
 *   - Client secret never leaves the server
 *   - Only students can use Google OAuth (guide/admin auth is unchanged)
 */

import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import Student from "../models/Student.js";
import logger from "../utils/logger.js";
import { issueTokens, signOnboardingToken } from "../services/tokenService.js";

// ── helpers ──────────────────────────────────────────────────────────────────

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables");
  }
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

function getClientUrl() {
  return (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/\/+$/, "");
}

const STATE_COOKIE = "pp_oauth_state";
const STATE_MAX_AGE = 10 * 60 * 1000; // 10 minutes

function stateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/api/auth/google",
    maxAge: STATE_MAX_AGE,
  };
}

const EMAIL_REGEX = /^[^\s@]+@(gmail\.com|nbkrist\.org)$/i;

import Guide from "../models/Guide.js";

// ── GET /api/auth/google ──────────────────────────────────────────────────────

export async function initiateGoogleAuth(req, res) {
  try {
    const client = getOAuthClient();
    const role = req.query.role === "guide" ? "guide" : "student";

    // Generate a cryptographically random state value to prevent CSRF
    const state = crypto.randomBytes(32).toString("hex") + "__" + role;

    // Store state in a short-lived httpOnly cookie
    res.cookie(STATE_COOKIE, state, stateCookieOptions());

    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      state,
      prompt: "select_account",
    });

    res.redirect(authUrl);
  } catch (err) {
    logger.error("[google-auth] Failed to initiate OAuth:", err.message);
    res.redirect(`${getClientUrl()}/?google_error=config`);
  }
}

// ── GET /api/auth/google/callback ─────────────────────────────────────────────

export async function handleGoogleCallback(req, res) {
  const clientUrl = getClientUrl();

  try {
    const { code, state: returnedState, error: oauthError } = req.query;

    // ── 1. User denied access or Google returned an error ────────────────────
    if (oauthError) {
      logger.warn("[google-auth] OAuth error from Google:", oauthError);
      return res.redirect(`${clientUrl}/?google_error=access_denied`);
    }

    // ── 2. Validate CSRF state ────────────────────────────────────────────────
    const storedState = req.cookies?.[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, { ...stateCookieOptions(), maxAge: undefined });

    if (!storedState || !returnedState || storedState !== returnedState) {
      logger.warn("[google-auth] State mismatch — possible CSRF");
      return res.redirect(`${clientUrl}/?google_error=state_mismatch`);
    }
    
    const role = returnedState.split("__")[1] || "student";

    if (!code) {
      return res.redirect(`${clientUrl}/?google_error=no_code`);
    }

    // ── 3. Exchange authorization code for tokens ─────────────────────────────
    const client = getOAuthClient();
    let tokens;
    try {
      const response = await client.getToken(code);
      tokens = response.tokens;
    } catch (err) {
      logger.error("[google-auth] Token exchange failed:", err.message);
      return res.redirect(`${clientUrl}/?google_error=token_exchange`);
    }

    // ── 4. Verify and decode the Google ID token ──────────────────────────────
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      logger.error("[google-auth] ID token verification failed:", err.message);
      return res.redirect(`${clientUrl}/?google_error=token_invalid`);
    }

    // ── 5. Validate the Google identity we received ───────────────────────────
    const { sub: googleId, email, email_verified, name, given_name } = payload;

    if (!email_verified) {
      logger.warn("[google-auth] Google email not verified for:", email);
      return res.redirect(`${clientUrl}/?google_error=email_not_verified`);
    }

    if (!EMAIL_REGEX.test(email)) {
      logger.warn("[google-auth] Disallowed email domain:", email);
      return res.redirect(`${clientUrl}/?google_error=domain_not_allowed`);
    }
    
    if (role === "guide" && !email.toLowerCase().endsWith("@nbkrist.org")) {
      logger.warn("[google-auth] Disallowed email domain for guide:", email);
      return res.redirect(`${clientUrl}/?google_error=domain_not_allowed`);
    }

    // ── 6. Handle Guide Role ──────────────────────────────────────────────────
    if (role === "guide") {
      let guide = await Guide.findOne({ googleId });
      
      if (!guide) {
        guide = await Guide.findOne({ email: email.toLowerCase() });
        if (guide) {
          guide.googleId = googleId;
          if (!guide.isVerified) guide.isVerified = true;
          await guide.save({ validateBeforeSave: false });
          logger.info("[google-auth] Linked Google identity to existing guide:", email);
        } else {
          logger.warn("[google-auth] Guide account not found for:", email);
          return res.redirect(`${clientUrl}/?google_error=not_found`);
        }
      }
      
      const accessToken = issueTokens(res, guide, "guide");
      return res.redirect(`${clientUrl}/google-callback#token=${accessToken}&role=guide`);
    }

    // ── 7. Handle Student Role ────────────────────────────────────────────────
    let student = await Student.findOne({ googleId });

    if (!student) {
      student = await Student.findOne({ email: email.toLowerCase() });

      if (student) {
        student.googleId = googleId;
        if (!student.isVerified) student.isVerified = true;
        await student.save({ validateBeforeSave: false });
        logger.info("[google-auth] Linked Google identity to existing student:", email);
      }
    }

    if (!student) {
      const displayName = name || given_name || email.split("@")[0];
      try {
        student = await Student.create({
          name: displayName,
          email: email.toLowerCase(),
          googleId,
          isVerified: true,
          googlePendingOnboarding: true,
        });
        logger.info("[google-auth] Created new Google student:", email);
      } catch (err) {
        if (err.code === 11000 && err.keyPattern?.googleId) {
          student = await Student.findOne({ googleId });
          if (!student) throw err;
          logger.info("[google-auth] Race condition resolved — found existing googleId:", email);
        } else {
          throw err;
        }
      }
    }

    if (student.googlePendingOnboarding) {
      const onboardingToken = signOnboardingToken(student._id, "student");
      const displayName = encodeURIComponent(student.name || "");
      return res.redirect(`${clientUrl}/google-onboarding#token=${onboardingToken}&role=student&name=${displayName}`);
    }

    const accessToken = issueTokens(res, student, "student");
    return res.redirect(`${clientUrl}/google-callback#token=${accessToken}&role=student`);
  } catch (err) {
    logger.error("[google-auth] Unexpected error in callback:", err.message);
    return res.redirect(`${getClientUrl()}/?google_error=server_error`);
  }
}
