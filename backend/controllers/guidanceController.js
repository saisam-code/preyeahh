import Guidance from "../models/Guidance.js";
import Role from "../models/Role.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { assertGuideOwnsContent, contributorSnapshot, recordContentEdit } from "../utils/contentAuthorization.js";

// GET /api/guidance?branch=CSE&role=<id> — public, powers admin/guide guidance tables
export const getGuidance = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.branch) {
    const b = req.query.branch.toUpperCase();
    filter.branch = b === "ALL" ? "All" : { $in: [b, "All"] };
  }
  if (req.query.role) filter.role = req.query.role;
  const entries = await Guidance.find(filter).sort({ createdAt: 1 });
  res.status(200).json(new ApiResponse(200, entries, "Guidance fetched"));
});

/**
 * GET /api/guidance/for-role/:roleId
 * Mirrors _openRoleDetailContent()'s roadmap assembly in role-guidance.js:
 * merges this role's own roadmap entries with its branch's branch-wide
 * entries (branch === role.branch or branch === "All").
 */
export const getGuidanceForRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.roleId);
  if (!role) throw ApiError.notFound("Role not found");

  const [roleRoadmap, branchRoadmap] = await Promise.all([
    Guidance.find({ role: role._id }).sort({ createdAt: 1 }),
    Guidance.find({ role: null, branch: { $in: [role.branch, "All"] } }).sort({ createdAt: 1 }),
  ]);

  res.status(200).json(new ApiResponse(200, { roleRoadmap, branchRoadmap }, "Roadmap fetched"));
});

/**
 * POST /api/guidance — admin (any branch) or approved guide (own branch only).
 */
export const createGuidance = asyncHandler(async (req, res) => {
  const { title, points } = req.body;
  let branch = req.body.branch;
  const roleId = req.body.role || null;

  if (req.user.role === "guide") {
    branch = req.user.branch;
  }

  if (roleId) {
    const role = await Role.findById(roleId);
    if (!role) throw ApiError.notFound("Role not found");
    if (role.branch !== branch) {
      throw ApiError.badRequest("Role-specific guidance must match the entry's branch");
    }
  }

  const entry = await Guidance.create({ title, branch, points, role: roleId, createdBy: contributorSnapshot(req.user) });
  res.status(201).json(new ApiResponse(201, entry, "Guidance entry created"));
});

export const updateGuidance = asyncHandler(async (req, res) => {
  const entry = await Guidance.findById(req.params.id);
  if (!entry) throw ApiError.notFound("Guidance entry not found");

  if (req.user.role === "guide") {
    if (entry.branch !== req.user.branch) {
      throw ApiError.forbidden("You can only edit guidance entries in your own branch");
    }
    assertGuideOwnsContent(entry, req.user);
    delete req.body.branch;
  }

  const fields = ["title", "branch", "points", "role"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) entry[f] = req.body[f];
  });

  if (entry.role) {
    const role = await Role.findById(entry.role);
    if (!role) throw ApiError.notFound("Role not found");
    if (role.branch !== entry.branch) {
      throw ApiError.badRequest("Role-specific guidance must match the entry's branch");
    }
  }

  recordContentEdit(entry, req.user);
  await entry.save();
  res.status(200).json(new ApiResponse(200, entry, "Guidance entry updated"));
});

export const deleteGuidance = asyncHandler(async (req, res) => {
  const entry = await Guidance.findById(req.params.id);
  if (!entry) throw ApiError.notFound("Guidance entry not found");

  if (req.user.role === "guide" && entry.branch !== req.user.branch) {
    throw ApiError.forbidden("You can only delete guidance entries in your own branch");
  }
  assertGuideOwnsContent(entry, req.user);

  await entry.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Guidance entry deleted"));
});
