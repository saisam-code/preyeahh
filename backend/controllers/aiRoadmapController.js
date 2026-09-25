import {
  generateAIRoadmap,
  getStudentRoadmaps,
  getRoadmapById,
  updateTopicProgress,
  deleteRoadmap,
} from "../services/aiRoadmapService.js";

export const generateRoadmapController = async (req, res, next) => {
  try {
    const { topic, roleId } = req.body;
    const roadmap = await generateAIRoadmap(req.user.id || req.user.userId, { topic, roleId });
    return res.status(201).json({
      success: true,
      message: "Roadmap generated successfully",
      roadmap,
    });
  } catch (err) {
    if (
      err.status === 429 ||
      err.statusCode === 429 ||
      err.message?.includes("429") ||
      err.message?.includes("rate_limit") ||
      err.message?.includes("Too Many Requests")
    ) {
      return res.status(429).json({
        success: false,
        message: "AI service is temporarily unavailable. Please try again shortly.",
      });
    }
    next(err);
  }
};

export const getStudentRoadmapsController = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await getStudentRoadmaps(req.user.id || req.user.userId, page, limit);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getRoadmapByIdController = async (req, res, next) => {
  try {
    const roadmap = await getRoadmapById(req.params.id, req.user.id || req.user.userId);
    return res.status(200).json({ success: true, roadmap });
  } catch (err) {
    next(err);
  }
};

export const updateTopicProgressController = async (req, res, next) => {
  try {
    const { topicId, isCompleted } = req.body;

    if (!topicId || typeof isCompleted !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "topicId and isCompleted (boolean) are required",
      });
    }

    const roadmap = await updateTopicProgress(
      req.params.id,
      topicId,
      isCompleted,
      req.user.id || req.user.userId
    );
    return res.status(200).json({
      success: true,
      message: "Progress updated successfully",
      roadmap,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteRoadmapController = async (req, res, next) => {
  try {
    const result = await deleteRoadmap(req.params.id, req.user.id || req.user.userId);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export default {
  generateRoadmapController,
  getStudentRoadmapsController,
  getRoadmapByIdController,
  updateTopicProgressController,
  deleteRoadmapController,
};