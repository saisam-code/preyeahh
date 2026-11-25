import Role from "../models/Role.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { assertGuideOwnsContent, contributorSnapshot, recordContentEdit } from "../utils/contentAuthorization.js";
import escapeRegex from "../utils/escapeRegex.js";
import CareerDomain from "../models/CareerDomain.js";
import CareerSubdomain from "../models/CareerSubdomain.js";
import Branch from "../models/Branch.js";
import { resolveCareerDomain } from "../utils/resolveCareerDomain.js";
import { Institution } from "../models/Institution.js";
import mongoose from "mongoose";

async function findBranchForDomain(branchName, domainRecord) {
  if (!domainRecord) return null;
  const branch = await Branch.findOne({ name: branchName.trim().toUpperCase() });
  if (branch?.domainIds.length && !branch.domainIds.some((id) => String(id) === String(domainRecord._id))) {
    throw ApiError.badRequest("Career domain is not associated with this branch");
  }
  return branch;
}

async function resolveRoleSubdomain(subdomainId, branchName, domainRecord) {
  if (!subdomainId) return null;
  if (!domainRecord) throw ApiError.badRequest("A subdomain requires a recognized career domain");

  const branch = await Branch.findOne({ name: branchName.trim().toUpperCase() });
  if (!branch) throw ApiError.badRequest("A subdomain requires a registered branch");

  const subdomain = await CareerSubdomain.findOne({
    _id: subdomainId,
    domainId: domainRecord._id,
    branchId: branch._id,
  });
  if (!subdomain) {
    throw ApiError.badRequest("Subdomain must belong to the selected career domain and branch");
  }
  return subdomain;
}

/**
 * GET /api/roles?branch=CSE&type=core&search=engineer&page=1&limit=20
 * Public — mirrors roles.html's renderRoles(): branch filter, type tabs
 * (all/core/non-core), and substring search across title + description.
 */
export const getRoles = asyncHandler(async (req, res) => {
  const { branch, type, search, domainId, subdomainId } = req.query;
  const page = req.query.page || 1;
  const limit = req.query.limit || 20;

  const filter = {};
  filter.institution = null;
  if (branch) filter.branch = branch.toUpperCase();
  if (type) filter.type = type;
  if (domainId) filter.domainId = domainId;
  if (subdomainId) filter.subdomainId = subdomainId;
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
  const { title, type, description, guidance, reality, experiments, verification, domain, domainId } = req.body;
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

  const requestedDomain = domain || "Technology & Engineering";
  const domainRecord = await resolveCareerDomain(CareerDomain, { domainId, domain: requestedDomain });
  await findBranchForDomain(branch, domainRecord);
  const subdomainRecord = await resolveRoleSubdomain(req.body.subdomainId, branch, domainRecord);
  const role = await Role.create({
    title,
    branch,
    domain: domainRecord?.name || requestedDomain,
    domainId: domainRecord?._id || null,
    subdomainId: subdomainRecord?._id || null,
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

  const editableFields = ["title", "branch", "type", "description"];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) role[field] = req.body[field];
  });

  if (req.body.domain !== undefined || req.body.domainId !== undefined) {
    const domainRecord = await resolveCareerDomain(CareerDomain, req.body);
    if (domainRecord) {
      role.domain = domainRecord.name;
      role.domainId = domainRecord._id;
    } else if (req.body.domain !== undefined) {
      role.domain = req.body.domain;
      role.domainId = null;
    } else {
      role.domainId = null;
    }
  }

  const taxonomyChanged = ["branch", "domain", "domainId", "subdomainId"].some(
    (field) => req.body[field] !== undefined
  );
  if (taxonomyChanged) {
    const domainRecord = role.domainId ? await CareerDomain.findById(role.domainId) : null;
    await findBranchForDomain(role.branch, domainRecord);

    if (req.body.subdomainId !== undefined) {
      const subdomainRecord = await resolveRoleSubdomain(req.body.subdomainId, role.branch, domainRecord);
      role.subdomainId = subdomainRecord?._id || null;
    } else if (role.subdomainId) {
      const existingSubdomain = await CareerSubdomain.findOne({
        _id: role.subdomainId,
        domainId: domainRecord?._id,
      });
      if (!existingSubdomain || !(await Branch.exists({ _id: existingSubdomain.branchId, name: role.branch }))) {
        role.subdomainId = null;
      }
    }
  }

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
