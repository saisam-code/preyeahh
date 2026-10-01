import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as aiRoadmapService from "../services/aiRoadmapService.js";

// POST /api/ai-roadmaps/generate   body: { topic?, roleId? }
export const generateRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await aiRoadmapService.generateAIRoadmap(req.user, req.body);
  res.status(201).json(new ApiResponse(201, roadmap, "Roadmap generated successfully"));
});

// GET /api/ai-roadmaps
export const listRoadmaps = asyncHandler(async (req, res) => {
  const { items, meta } = await aiRoadmapService.listRoadmaps(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, items, "Roadmaps fetched", meta));
});

// GET /api/ai-roadmaps/:id
export const getRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await aiRoadmapService.getRoadmap(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, roadmap, "Roadmap fetched"));
});

// PATCH /api/ai-roadmaps/:id/progress   body: { topicId, isCompleted }
export const updateTopicProgress = asyncHandler(async (req, res) => {
  const { topicId, isCompleted } = req.body;
  const roadmap = await aiRoadmapService.setTopicCompleted(req.params.id, topicId, isCompleted, req.user.id);
  res.status(200).json(new ApiResponse(200, roadmap, "Progress updated"));
});

// DELETE /api/ai-roadmaps/:id
export const deleteRoadmap = asyncHandler(async (req, res) => {
  await aiRoadmapService.deleteRoadmap(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, null, "Roadmap deleted"));
});
