import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

// Helper to get Google OAuth Client dynamically
const getGoogleClient = () => {
  return new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
};

// Helper to sign JWT tokens
export const generateToken = (userId, email) => {
  const secret = process.env.JWT_SECRET || "default_jwt_secret_key";
  return jwt.sign({ userId, email }, secret, { expiresIn: "7d" });
};

// Helper to format user payload
const formatUserPayload = (user) => ({
  id: user._id.toString(),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  avatarUrl: user.avatarUrl,
  preferences: user.preferences || {},
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Register Service
export const registerUser = async ({ email, password, firstName, lastName }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("User already exists with this email");
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    email: normalizedEmail,
    password: hashedPassword,
    firstName: firstName || "",
    lastName: lastName || "",
  });

  const accessToken = generateToken(user._id.toString(), user.email);

  return {
    user: formatUserPayload(user),
    accessToken,
  };
};

// Login Service
export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (!user.password) {
    const error = new Error("This account uses Google OAuth. Please use Google Login");
    error.statusCode = 400;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = generateToken(user._id.toString(), user.email);

  return {
    user: formatUserPayload(user),
    accessToken,
  };
};

// Google OAuth Service
export const googleAuthUser = async (credential) => {
  const googleClient = getGoogleClient();
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    const error = new Error("Invalid Google token");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = payload.email.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.create({
      email: normalizedEmail,
      firstName: payload.given_name || "",
      lastName: payload.family_name || "",
      avatarUrl: payload.picture || "",
      googleId: payload.sub,
    });
  } else {
    let updated = false;
    if (!user.googleId) {
      user.googleId = payload.sub;
      updated = true;
    }
    if (payload.picture && !user.avatarUrl) {
      user.avatarUrl = payload.picture;
      updated = true;
    }
    if (payload.given_name && !user.firstName) {
      user.firstName = payload.given_name;
      updated = true;
    }
    if (payload.family_name && !user.lastName) {
      user.lastName = payload.family_name;
      updated = true;
    }
    if (updated) {
      await user.save();
    }
  }

  const accessToken = generateToken(user._id.toString(), user.email);

  return {
    user: formatUserPayload(user),
    accessToken,
  };
};

// Get User Profile Service
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return formatUserPayload(user);
};
