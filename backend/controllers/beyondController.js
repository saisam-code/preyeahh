import Beyond from "../models/Beyond.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/beyond?branch=CSE&category=startup&search=...&page=&limit=
 * Public. branch filter includes "All" entries too — mirrors beyond.html's
 * renderCards(): l.branch === branch || l.branch === "All".
 */
export const getBeyond = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const page = req.query.page || 1;
  const limit = req.query.limit || 20;

  const filter = {};
  if (req.query.branch) filter.branch = { $in: [req.query.branch.toUpperCase(), "All"] };
  if (category) filter.category = category;
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: re }, { description: re }];
  }

  const [items, total] = await Promise.all([
    Beyond.find(filter).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit),
    Beyond.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, items, "Beyond entries fetched", {
      page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1),
    })
  );
});

export const getBeyondById = asyncHandler(async (req, res) => {
  const item = await Beyond.findById(req.params.id);
  if (!item) throw ApiError.notFound("Beyond entry not found");
  res.status(200).json(new ApiResponse(200, item, "Beyond entry fetched"));
});

function enforceGuideBranch(req, branchValue) {
  if (req.user?.role !== "guide") return;
  const branch = String(branchValue || "").toUpperCase();
  if (!branch || branch !== String(req.user.branch || "").toUpperCase()) {
    throw ApiError.forbidden("You can only manage beyond entries in your own branch");
  }
}

// POST /api/beyond — admin or branch guide
export const createBeyond = asyncHandler(async (req, res) => {
  if (req.user?.role === "guide") {
    req.body.branch = req.user.branch;
  }
  enforceGuideBranch(req, req.body.branch);
  const item = await Beyond.create(req.body);
  res.status(201).json(new ApiResponse(201, item, "Beyond entry created"));
});

export const updateBeyond = asyncHandler(async (req, res) => {
  const item = await Beyond.findById(req.params.id);
  if (!item) throw ApiError.notFound("Beyond entry not found");
  if (req.user?.role === "guide" && item.branch !== req.user.branch) {
    throw ApiError.forbidden("You can only update beyond entries in your own branch");
  }
  if (req.user?.role === "guide") {
    req.body.branch = req.user.branch;
  }
  enforceGuideBranch(req, req.body.branch ?? item.branch);
  Object.assign(item, req.body);
  await item.save();
  res.status(200).json(new ApiResponse(200, item, "Beyond entry updated"));
});

export const deleteBeyond = asyncHandler(async (req, res) => {
  const item = await Beyond.findById(req.params.id);
  if (!item) throw ApiError.notFound("Beyond entry not found");
  if (req.user?.role === "guide" && item.branch !== req.user.branch) {
    throw ApiError.forbidden("You can only delete beyond entries in your own branch");
  }
  await item.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Beyond entry deleted"));
});
