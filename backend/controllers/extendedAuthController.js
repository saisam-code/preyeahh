import jwt from "jsonwebtoken";
import Parent from "../models/Parent.js";
import Student from "../models/Student.js";
import { Institution } from "../models/Institution.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "7d",
  });
};

/**
 * POST /api/auth/parent/register
 */
export const registerParent = asyncHandler(async (req, res) => {
  const { name, email, password, phone, relationship, studentEmail } = req.body;
  if (!name || !email || !password) throw ApiError.badRequest("Name, email and password are required");

  const existing = await Parent.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  let associatedStudents = [];
  if (studentEmail) {
    const student = await Student.findOne({ email: studentEmail.toLowerCase() });
    if (student) {
      associatedStudents.push({
        student: student._id,
        studentEmail: student.email,
        isVerified: true,
        consentGranted: true,
      });
    }
  }

  const parent = await Parent.create({
    name,
    email: email.toLowerCase(),
    password,
    phone: phone || "",
    relationship: relationship || "Parent",
    associatedStudents,
    isVerified: true,
  });

  const token = createToken(parent._id, "parent");
  res.status(201).json(
    new ApiResponse(201, { user: parent.toSafeJSON(), accessToken: token }, "Parent account registered successfully")
  );
});

/**
 * POST /api/auth/parent/login
 */
export const loginParent = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest("Email and password are required");

  const parent = await Parent.findOne({ email: email.toLowerCase() }).select("+password");
  if (!parent || !(await parent.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = createToken(parent._id, "parent");
  res.status(200).json(
    new ApiResponse(200, { user: parent.toSafeJSON(), accessToken: token }, "Logged in as Parent")
  );
});

/**
 * POST /api/auth/institution/register
 */
export const registerInstitution = asyncHandler(async (req, res) => {
  const { name, code, category, location, website, contactEmail, password, contactPerson, designation } = req.body;
  if (!name || !code || !contactEmail || !password) {
    throw ApiError.badRequest("Institution name, code, official email and password are required");
  }

  const existing = await Institution.findOne({
    $or: [{ code: code.toUpperCase() }, { contactEmail: contactEmail.toLowerCase() }],
  });
  if (existing) throw ApiError.conflict("An institution with this code or email already exists");

  const associationCode = `${code.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const inst = await Institution.create({
    name,
    code: code.toUpperCase(),
    category: category || "Engineering College",
    location: location || "",
    website: website || "",
    contactEmail: contactEmail.toLowerCase(),
    password,
    contactPerson: contactPerson || "",
    designation: designation || "Placement Cell Head",
    associationCode,
    status: "APPROVED",
  });

  const token = createToken(inst._id, "institution");
  res.status(201).json(
    new ApiResponse(201, { user: inst.toSafeJSON(), accessToken: token }, "Institution registered successfully")
  );
});

/**
 * POST /api/auth/institution/login
 */
export const loginInstitution = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest("Email and password are required");

  const inst = await Institution.findOne({ contactEmail: email.toLowerCase() }).select("+password");
  if (!inst || !(await inst.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid credentials for institution");
  }

  const token = createToken(inst._id, "institution");
  res.status(200).json(
    new ApiResponse(200, { user: inst.toSafeJSON(), accessToken: token }, "Logged in as Institution")
  );
});
