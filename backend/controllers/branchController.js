import Branch from "../models/Branch.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/branches — public, powers index.html's branch cards & every register dropdown
export const getBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find().sort({ name: 1 });
  res.status(200).json(new ApiResponse(200, branches.map((b) => b.name), "Branches fetched"));
});

// POST /api/branches — admin only, mirrors doSaveBranch()
export const createBranch = asyncHandler(async (req, res) => {
  const name = req.body.name.trim().toUpperCase();
  const existing = await Branch.findOne({ name });
  if (existing) throw ApiError.conflict ? ApiError.conflict("Branch already exists") : new ApiError(409, "Branch already exists");
  const branch = await Branch.create({ name });
  res.status(201).json(new ApiResponse(201, branch, "Branch created"));
});

// DELETE /api/branches/:name — admin only, cascades to roles/beyond/guidance via Branch's pre-hook
export const deleteBranch = asyncHandler(async (req, res) => {
  const name = req.params.name.trim().toUpperCase();
  const branch = await Branch.findOneAndDelete({ name });
  if (!branch) throw new ApiError(404, "Branch not found");
  res.status(200).json(new ApiResponse(200, null, "Branch deleted (cascaded to its roles/beyond/guidance)"));
});
