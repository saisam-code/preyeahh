import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import * as resourceService from "../services/resourceService.js";

// GET /api/resources   (public)  ?q&technology&branch&difficulty&page&limit
export const searchResources = asyncHandler(async (req, res) => {
  const { q, technology, branch, difficulty, page, limit } = req.query;
  const { items, meta } = await resourceService.searchResources({ query: q, technology, branch, difficulty, page, limit });
  res.status(200).json(new ApiResponse(200, items, "Resources fetched", meta));
});

// GET /api/resources/:id   (public)
export const getResource = asyncHandler(async (req, res) => {
  const resource = await resourceService.getResourceById(req.params.id);
  res.status(200).json(new ApiResponse(200, resource, "Resource fetched"));
});

// PATCH /api/resources/:id/view   (public — analytics counter)
export const incrementViews = asyncHandler(async (req, res) => {
  const resource = await resourceService.incrementViews(req.params.id);
  res.status(200).json(new ApiResponse(200, { id: resource.id, views: resource.views }, "View recorded"));
});

// POST /api/resources/recommend   (student)
export const recommendResources = asyncHandler(async (req, res) => {
  const resources = await resourceService.getRecommendedResources(req.body);
  res.status(200).json(new ApiResponse(200, resources, "Recommendations fetched"));
});

// POST /api/resources   (admin)
export const createResource = asyncHandler(async (req, res) => {
  if (req.user?.role === "guide") {
    const branchList = Array.isArray(req.body.branches) ? req.body.branches : [];
    const allowed = branchList.every((value) => String(value).toUpperCase() === String(req.user.branch || "").toUpperCase());
    if (!allowed) {
      throw ApiError.forbidden("You can only curate resources for your own branch");
    }
    req.body.branches = [req.user.branch];
  }
  const resource = await resourceService.createResource(req.body);
  res.status(201).json(new ApiResponse(201, resource, "Resource added"));
});

// DELETE /api/resources/:id   (admin)
export const deleteResource = asyncHandler(async (req, res) => {
  const resource = await resourceService.getResourceById(req.params.id);
  if (req.user?.role === "guide") {
    const branchList = Array.isArray(resource.branches) ? resource.branches : [];
    const ownsBranch = branchList.length > 0 && branchList.every((value) => String(value).toUpperCase() === String(req.user.branch || "").toUpperCase());
    if (!ownsBranch) {
      throw ApiError.forbidden("You can only delete resources relevant to your own branch");
    }
  }
  await resourceService.deleteResource(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Resource deleted"));
});
