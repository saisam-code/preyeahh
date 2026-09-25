import {
  generateRoadmap,
  getUserRoadmaps,
  getRoadmapById,
  updateTopicProgress,
  deleteRoadmap,
} from "../services/roadmap.service.js";

/**
 * POST /api/roadmaps/generate
 */
export const generateRoadmapController = async (req, res) => {
  try {
    const { topic } = req.body;
    const roadmap = await generateRoadmap(req.user.userId, topic);

    return res.status(201).json({
      success: true,
      message: "Roadmap generated successfully",
      roadmap,
    });
  } catch (error) {
    console.error("Error in generateRoadmapController:", error);

    // Handle AI quota / rate-limit errors cleanly
    if (
      error.status === 429 ||
      error.statusCode === 429 ||
      error.message?.includes("429") ||
      error.message?.includes("Too Many Requests") ||
      error.message?.includes("rate_limit")
    ) {
      return res.status(429).json({
        success: false,
        message: "AI service is temporarily unavailable due to rate limits. Please try again.",
      });
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * GET /api/roadmaps
 */
export const getUserRoadmapsController = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await getUserRoadmaps(req.user.userId, page, limit);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in getUserRoadmapsController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * GET /api/roadmaps/:id
 */
export const getRoadmapByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const roadmap = await getRoadmapById(id, req.user.userId);
    return res.status(200).json({
      success: true,
      roadmap,
    });
  } catch (error) {
    console.error("Error in getRoadmapByIdController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * PATCH /api/roadmaps/:id/progress
 */
export const updateProgressController = async (req, res) => {
  try {
    const { id } = req.params;
    const { sectionId, topicId, isCompleted } = req.body;

    if (!topicId || typeof isCompleted !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "topicId and isCompleted (boolean) are required",
      });
    }

    const roadmap = await updateTopicProgress(id, sectionId, topicId, isCompleted, req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Progress updated successfully",
      roadmap,
    });
  } catch (error) {
    console.error("Error in updateProgressController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * DELETE /api/roadmaps/:id
 */
export const deleteRoadmapController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteRoadmap(id, req.user.userId);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in deleteRoadmapController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
