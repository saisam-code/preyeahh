import Role from "../models/Role.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { assertGuideOwnsContent, contributorSnapshot, recordContentEdit } from "../utils/contentAuthorization.js";
import escapeRegex from "../utils/escapeRegex.js";
import { Institution } from "../models/Institution.js";
import mongoose from "mongoose";

/**
 * GET /api/roles?branch=CSE&type=core&search=engineer&page=1&limit=20
 * Public — mirrors roles.html's renderRoles(): branch filter, type tabs
 * (all/core/non-core), and substring search across title + description.
 */
export const getRoles = asyncHandler(async (req, res) => {
  const { branch, type, search } = req.query;
  const page = req.query.page || 1;
  const limit = req.query.limit || 20;

  const filter = {};
  filter.institution = null;
  if (branch) filter.branch = branch.toUpperCase();
  if (type) filter.type = type;
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: re }, { description: re }];
  }

  const [roles, total] = await Promise.all([
    Role.find(filter)
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Role.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, roles, "Roles fetched", {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    })
  );
});

export const getManagedRoles = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "institution") {
    filter.institution = req.user.id;
  } else if (req.query.institutionId === "platform") {
    filter.institution = null;
  } else if (req.query.institutionId) {
    if (!mongoose.isValidObjectId(req.query.institutionId)) {
      throw ApiError.badRequest("Institution id must be valid");
    }
    filter.institution = req.query.institutionId;
  }
  if (req.query.branch) filter.branch = req.query.branch.toUpperCase();

  const roles = await Role.find(filter).sort({ domain: 1, title: 1 }).limit(100);
  res.status(200).json(new ApiResponse(200, roles, "Roles fetched"));
});

/**
 * GET /api/roles/:id — public, powers the role detail modal.
 */
export const getRoleById = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound("Role not found");
  res.status(200).json(new ApiResponse(200, role, "Role fetched"));
});

/**
 * POST /api/roles — admin (any branch) or approved guide (own branch only).
 * Mirrors guide.html's gOpenRoleModal, which hardcodes
 * role.branch = _guide.branch and never lets the guide type a different one.
 */
export const createRole = asyncHandler(async (req, res) => {
  const { title, type, description, guidance, reality, experiments, verification, domain } = req.body;
  let branch = req.body.branch;
  let institution = null;

  if (req.user.role === "guide") {
    branch = req.user.branch; // guide cannot choose — forced to their own branch
  } else if (req.user.role === "institution") {
    institution = req.user.id;
  } else if (req.body.institutionId) {
    institution = req.body.institutionId;
    if (!(await Institution.exists({ _id: institution }))) {
      throw ApiError.notFound("Institution not found");
    }
  }

  const role = await Role.create({
    title,
    branch,
    domain,
    institution,
    type,
    description,
    guidance: guidance || {},
    reality: reality || {},
    experiments: Array.isArray(experiments) ? experiments : [],
    verification: req.user.role === "admin" && verification ? verification : { status: "UNVERIFIED" },
    createdBy: contributorSnapshot(req.user),
  });

  res.status(201).json(new ApiResponse(201, role, "Role created"));
});

/**
 * PUT /api/roles/:id — admin can edit any role.
 * Guides can only edit roles already in their own branch, and cannot
 * move a role to a different branch (matches gDoSaveRole's readonly
 * branch display field in guide.html).
 */
export const updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound("Role not found");

  if (req.user.role === "guide") {
    if (role.branch !== req.user.branch) {
      throw ApiError.forbidden("You can only edit roles in your own branch");
    }
    assertGuideOwnsContent(role, req.user);
    delete req.body.branch;
  }
  if (req.user.role === "institution" && String(role.institution || "") !== req.user.id) {
    throw ApiError.forbidden("You can only edit roles owned by your institution");
  }

  const editableFields = ["title", "branch", "type", "description", "domain"];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) role[field] = req.body[field];
  });

  if (req.user.role === "admin" && req.body.institutionId !== undefined) {
    if (req.body.institutionId && !(await Institution.exists({ _id: req.body.institutionId }))) {
      throw ApiError.notFound("Institution not found");
    }
    role.institution = req.body.institutionId || null;
  }

  if (req.body.guidance) {
    role.guidance = { ...role.guidance.toObject(), ...req.body.guidance };
  }
  if (req.body.reality) {
    role.reality = { ...role.reality.toObject(), ...req.body.reality };
  }
  if (Array.isArray(req.body.experiments)) {
    role.experiments = req.body.experiments;
  }
  if (req.body.verification && req.user.role === "admin") {
    role.verification = { ...role.verification.toObject(), ...req.body.verification };
  }

  recordContentEdit(role, req.user);
  await role.save();
  res.status(200).json(new ApiResponse(200, role, "Role updated"));
});

/**
 * DELETE /api/roles/:id — admin only. Guide panel has no delete button
 * in the original app (guide.html only exposes gOpenRoleModal for edit).
 * Uses findByIdAndDelete so Role's pre("findOneAndDelete") cascade hook
 * fires, deleting any Guidance entries linked to this role.
 */
export const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound("Role not found");

  if (req.user.role === "guide" && role.branch !== req.user.branch) {
    throw ApiError.forbidden("You can only delete roles in your own branch");
  }
  if (req.user.role === "institution" && String(role.institution || "") !== req.user.id) {
    throw ApiError.forbidden("You can only delete roles owned by your institution");
  }
  assertGuideOwnsContent(role, req.user);

  await Role.findByIdAndDelete(role._id);
  res.status(200).json(new ApiResponse(200, null, "Role deleted"));
});
