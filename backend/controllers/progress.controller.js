import { getLearningProgress } from "../services/progress.service.js";

/**
 * GET /api/progress
 * Get comprehensive learning progress broken down by roadmap for the authenticated user.
 */
export const getLearningProgressController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const progress = await getLearningProgress(userId);

    return res.status(200).json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("Error in getLearningProgressController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
