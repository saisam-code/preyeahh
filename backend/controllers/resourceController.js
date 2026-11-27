import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import * as resourceService from "../services/resourceService.js";
import CareerDomain from "../models/CareerDomain.js";
import { contributorSnapshot, recordContentEdit } from "../utils/contentAuthorization.js";

async function getGuideDomain(user) {
  const domainId = user?.doc?.domainId;
  if (!domainId) throw ApiError.forbidden("Ask an administrator to assign your career domain");
  const domain = await CareerDomain.findById(domainId).select("slug");
  if (!domain) throw ApiError.forbidden("Your assigned career domain is unavailable");
  return domain;
}

// GET /api/resources   (public)  ?q&technology&branch&difficulty&page&limit
export const searchResources = asyncHandler(async (req, res) => {
  const { q, ...filters } = req.query;
  if (req.user?.role === "guide") {
    const domain = await getGuideDomain(req.user);
    filters.domain = domain.slug;
    filters.branch = req.user.branch;
  }
  const { items, meta } = await resourceService.searchResources({ query: q, ...filters });
  res.status(200).json(new ApiResponse(200, items, "Resources fetched", meta));
});

// GET /api/resources/coverage (admin)
export const getResourceCoverage = asyncHandler(async (req, res) => {
  const coverage = await resourceService.getResourceCoverage();
  res.status(200).json(new ApiResponse(200, coverage, "Imported resource coverage fetched"));
});

// GET /api/resources/:id   (public)
export const getResource = asyncHandler(async (req, res) => {
  const resource = await resourceService.getResourceById(req.params.id);
  if (req.user?.role === "guide") {
    const domain = await getGuideDomain(req.user);
    if (
      !resource.relatedDomains?.includes(domain.slug)
      || !resource.branches?.includes(String(req.user.branch || "").toUpperCase())
    ) {
      throw ApiError.forbidden("You can only view resources assigned to your career domain and branch");
    }
  }
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
  let relatedDomains;
  if (req.user?.role === "guide") {
    const domain = await getGuideDomain(req.user);
    relatedDomains = [domain.slug];
    req.body.branches = [req.user.branch];
  }

  // 1.10 — Whitelist fields: only accept validated fields, never spread raw req.body
  const { title, description, type, url, technology, category, provider, tags, branches, difficulty, estimatedDuration } = req.body;
  const resource = await resourceService.createResource({
    title, description, type, url, technology, category, provider, tags,
    branches: req.user?.role === "guide" ? [req.user.branch] : branches,
    ...(relatedDomains ? { relatedDomains } : {}),
    difficulty, estimatedDuration,
    createdBy: contributorSnapshot(req.user),
    editHistory: [],
  });
  res.status(201).json(new ApiResponse(201, resource, "Resource added"));
});

// PATCH /api/resources/:id (admin)
export const updateResource = asyncHandler(async (req, res) => {
  if (req.user?.role === "guide") {
    const domain = await getGuideDomain(req.user);
    const resource = await resourceService.getResourceById(req.params.id);
    const belongsToDomain = resource.relatedDomains?.includes(domain.slug);
    const belongsToBranch = resource.branches?.includes(String(req.user.branch || "").toUpperCase());
    if (!belongsToDomain || !belongsToBranch) {
      throw ApiError.forbidden("You can only edit resources assigned to your career domain and branch");
    }

    const guideFields = ["title", "description", "type", "url", "technology", "category", "provider", "tags", "difficulty"];
    const data = Object.fromEntries(guideFields
      .filter((field) => Object.hasOwn(req.body, field))
      .map((field) => [field, req.body[field]]));
    if (!Object.keys(data).length) throw ApiError.badRequest("No editable resource fields provided");
    recordContentEdit(resource, req.user);
    Object.assign(resource, data);
    await resource.save();
    return res.status(200).json(new ApiResponse(200, resource, "Resource updated"));
  }

  const allowedFields = [
    "title", "description", "type", "url", "technology", "category", "provider", "tags", "difficulty",
    "resourceType", "sourceCategory", "sourceSubcategory", "relatedDomains", "relatedRoles", "relatedSkills",
    "relatedTechnologies", "attribution", "sourceLicense", "importStatus", "exclusionReason",
  ];
  const data = Object.fromEntries(allowedFields
    .filter((field) => Object.hasOwn(req.body, field))
    .map((field) => [field, req.body[field]]));
  const resource = await resourceService.updateResource(req.params.id, data);
  res.status(200).json(new ApiResponse(200, resource, "Resource updated"));
});

// DELETE /api/resources/:id   (admin)
export const deleteResource = asyncHandler(async (req, res) => {
  const resource = await resourceService.getResourceById(req.params.id);
  if (req.user?.role === "guide") {
    const domain = await getGuideDomain(req.user);
    if (!resource.relatedDomains?.includes(domain.slug)) {
      throw ApiError.forbidden("You can only delete resources assigned to your career domain");
    }
    const branchList = Array.isArray(resource.branches) ? resource.branches : [];
    const ownsBranch = branchList.length > 0 && branchList.every((value) => String(value).toUpperCase() === String(req.user.branch || "").toUpperCase());
    if (!ownsBranch) {
      throw ApiError.forbidden("You can only delete resources relevant to your own branch");
    }
  }
  await resourceService.deleteResource(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Resource deleted"));
});
