import crypto from "crypto";
import { Institution, InstitutionMembership } from "../models/Institution.js";
import ApiError from "../utils/ApiError.js";

export async function requestMembershipByAssociationCode({ studentId, associationCode }) {
  if (typeof associationCode !== "string" || !associationCode.trim()) {
    throw ApiError.badRequest("Association code is required");
  }

  const normalizedCode = associationCode.trim().toUpperCase();
  const associationCodeHash = crypto.createHash("sha256").update(normalizedCode).digest("hex");
  const institution = await Institution.findOne({
    associationCodeHash,
    status: "APPROVED",
  });

  if (!institution) {
    throw ApiError.notFound("No approved institution matches this association code");
  }

  const existing = await InstitutionMembership.findOne({
    student: studentId,
    institution: institution._id,
  });
  if (existing?.status === "ACTIVE") {
    throw ApiError.badRequest("You are already an active verified member of this institution");
  }

  const membership = await InstitutionMembership.findOneAndUpdate(
    { student: studentId, institution: institution._id },
    {
      student: studentId,
      institution: institution._id,
      status: "PENDING",
      source: "ASSOCIATION_CODE",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  return { institution, membership };
}
