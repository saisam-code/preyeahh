import Branch from "../models/Branch.js";
import CareerDomain from "../models/CareerDomain.js";
import Role from "../models/Role.js";
import Student from "../models/Student.js";
import { Institution } from "../models/Institution.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// GET /api/branches — public, powers index.html's branch cards & every register dropdown
export const getBranches = asyncHandler(async (req, res) => {
  const filter = req.query.domainId ? { domainIds: req.query.domainId } : {};
  const branches = await Branch.find(filter).sort({ name: 1 });
  res.status(200).json(new ApiResponse(200, branches.map((b) => b.name), "Branches fetched"));
});

export const getManagedBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find()
    .sort({ name: 1 })
    .populate({ path: "domainIds", select: "name slug" });
  res.status(200).json(new ApiResponse(200, branches, "Branches fetched"));
});

async function validateDomainIds(domainIds = []) {
  const ids = [...new Set(domainIds.map(String))];
  const count = await CareerDomain.countDocuments({ _id: { $in: ids } });
  if (count !== ids.length) throw ApiError.badRequest("One or more career domains do not exist");
  return ids;
}

// POST /api/branches — admin only, mirrors doSaveBranch()
export const createBranch = asyncHandler(async (req, res) => {
  const name = req.body.name.trim().toUpperCase();
  const existing = await Branch.findOne({ name });
  if (existing) throw ApiError.conflict("Branch already exists");
  const domainIds = await validateDomainIds(req.body.domainIds);
  const branch = await Branch.create({ name, domainIds });
  res.status(201).json(new ApiResponse(201, branch, "Branch created"));
});

export const updateBranchDomains = asyncHandler(async (req, res) => {
  const name = req.params.name.trim().toUpperCase();
  const branch = await Branch.findOne({ name });
  if (!branch) throw ApiError.notFound("Branch not found");

  const domainIds = await validateDomainIds(req.body.domainIds);
  const removedDomainIds = branch.domainIds
    .map(String)
    .filter((domainId) => !domainIds.includes(domainId));

  if (removedDomainIds.length) {
    const linkedRole = await Role.exists({
      branchIds: branch._id,
      domainId: { $in: removedDomainIds },
    });
    if (linkedRole) {
      throw ApiError.conflict("Remove linked roles before disassociating this domain");
    }
  }

  branch.domainIds = domainIds;
  await branch.save();
  await branch.populate({ path: "domainIds", select: "name slug" });
  res.status(200).json(new ApiResponse(200, branch, "Branch domains updated"));
});

// DELETE /api/branches/:name — admin only, no content cascade
export const deleteBranch = asyncHandler(async (req, res) => {
  const name = req.params.name.trim().toUpperCase();
  const branch = await Branch.findOne({ name });
  if (!branch) throw ApiError.notFound("Branch not found");
  const [roleUsed, studentUsed, institutionUsed] = await Promise.all([
    Role.exists({ branchIds: branch._id }),
    Student.exists({ branch: name }),
    Institution.exists({ branch: name }),
  ]);
  if (roleUsed || studentUsed || institutionUsed) {
    if (req.query.force !== "true") {
      throw ApiError.conflict("Branch is in use; pass force=true to remove it as a tag");
    }
  }
  await Role.updateMany({ branchIds: branch._id }, { $pull: { branchIds: branch._id } });
  await Branch.deleteOne({ _id: branch._id });
  res.status(200).json(new ApiResponse(200, null, "Branch tag deleted"));
});
