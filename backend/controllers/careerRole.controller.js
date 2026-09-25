import CareerRole from "../models/CareerRole.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/roles?branch=CSE&type=core&search=engineer&page=1&limit=20
 * Public — branch filter, type tabs (all/core/non-core), substring
 * search across title + description.
 */
export const getRoles = asyncHandler(async (req, res) => {
  const { branch, type, search } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const filter = {};
  if (branch) filter.branch = branch.toUpperCase();
  if (type) filter.type = type;
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: re }, { description: re }];
  }

  const [roles, total] = await Promise.all([
    CareerRole.find(filter)
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    CareerRole.countDocuments(filter),
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

// GET /api/roles/:id — public, powers the role detail modal / RoleGuidanceView.
export const getRoleById = asyncHandler(async (req, res) => {
  const role = await CareerRole.findById(req.params.id);
  if (!role) throw ApiError.notFound("Role not found");
  res.status(200).json(new ApiResponse(200, role, "Role fetched"));
});

/**
 * POST /api/roles — admin (any branch) or approved guide (own branch only).
 * Guide cannot choose a branch — forced to their own.
 */
export const createRole = asyncHandler(async (req, res) => {
  const { title, type, description, guidance } = req.body;
  let branch = req.body.branch;

  if (req.user.role === "guide") {
    branch = req.user.branch;
  }
  if (!branch) throw ApiError.badRequest("Branch is required");

  const role = await CareerRole.create({
    title,
    branch,
    type,
    description,
    guidance: guidance || {},
  });

  res.status(201).json(new ApiResponse(201, role, "Role created"));
});

/**
 * PUT /api/roles/:id — admin can edit any role. Guides can only edit
 * roles already in their own branch, and cannot move a role to a
 * different branch.
 */
export const updateRole = asyncHandler(async (req, res) => {
  const role = await CareerRole.findById(req.params.id);
  if (!role) throw ApiError.notFound("Role not found");

  if (req.user.role === "guide") {
    if (role.branch !== req.user.branch) {
      throw ApiError.forbidden("You can only edit roles in your own branch");
    }
    delete req.body.branch;
  }

  const editableFields = ["title", "branch", "type", "description"];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) role[field] = req.body[field];
  });

  if (req.body.guidance) {
    role.guidance = { ...role.guidance.toObject(), ...req.body.guidance };
  }

  await role.save();
  res.status(200).json(new ApiResponse(200, role, "Role updated"));
});

/**
 * DELETE /api/roles/:id — admin only.
 * Uses findByIdAndDelete so CareerRole's pre("findOneAndDelete") cascade
 * hook fires, deleting any Guidance entries linked to this role.
 */
export const deleteRole = asyncHandler(async (req, res) => {
  const role = await CareerRole.findByIdAndDelete(req.params.id);
  if (!role) throw ApiError.notFound("Role not found");
  res.status(200).json(new ApiResponse(200, null, "Role deleted"));
});
