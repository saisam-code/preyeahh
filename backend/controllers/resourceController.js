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

// GET /api/resources/:id   (public)
export const getResource = asyncHandler(async (req, res) => {
  const resource = await resourceService.getResourceById(req.params.id);
  if (req.user?.role === "guide") {
    const domain = await getGuideDomain(req.user);
    if (!resource.domainIds?.some((id) => String(id) === String(domain._id))) {
      throw ApiError.forbidden("You can only view resources assigned to your career domain");
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
    relatedDomains = [domain._id];
  }

  // 1.10 — Whitelist fields: only accept validated fields, never spread raw req.body
  const { title, description, type, url, provider, tags, difficulty, educationStages, skills } = req.body;
  const resource = await resourceService.createResource({
    title, description, type, url, provider, tags,
    ...(relatedDomains ? { domainIds: relatedDomains } : {}),
    difficulty, educationStages, skills,
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
    const belongsToDomain = resource.domainIds?.some((id) => String(id) === String(domain._id));
    if (!belongsToDomain) {
      throw ApiError.forbidden("You can only edit resources assigned to your career domain");
    }

    const guideFields = ["title", "description", "type", "url", "provider", "tags", "difficulty", "educationStages", "skills"];
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
    "title", "description", "type", "url", "provider", "tags", "difficulty", "educationStages",
    "domainIds", "subdomainIds", "roleIds", "skills", "isActive",
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
    if (!resource.domainIds?.some((id) => String(id) === String(domain._id))) {
      throw ApiError.forbidden("You can only delete resources assigned to your career domain");
    }
  }
  await resourceService.deleteResource(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Resource deleted"));
});
