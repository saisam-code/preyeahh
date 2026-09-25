import { getUserPerformance } from "../services/performance.service.js";
import User from "../models/User.js";
import UserGuidanceProgress from "../models/UserGuidanceProgress.js";

/**
 * GET /api/performance
 * Fetch performance metrics and diagnostic suggestions for the authenticated user.
 */
export const getPerformanceMetrics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user + current role
    const user = await User.findById(userId).populate("careerRole");
    if (!user || !user.careerRole) {
      return res.status(400).json({
        success: false,
        message: "No career role selected",
      });
    }

    // Get role required skills
    const roleSkills = user.careerRole.guidance.skills || [];

    // Get user skills from preferences
    const userSkills = user.preferences.skills || [];

    // Calculate readiness score
    const matchedSkills = userSkills.filter(skill => 
      roleSkills.includes(skill)
    ).length;
    const readinessScore = Math.round(
      (matchedSkills / roleSkills.length) * 100
    );

    // Get progress on milestones
    const progress = await UserGuidanceProgress.findOne({
      userId,
      roleId: user.careerRole._id,
    });

    res.json({
      success: true,
      data: {
        role: user.careerRole.name,
        readinessScore,
        matchedSkills: `${matchedSkills}/${roleSkills.length}`,
        progressPercentage: progress?.progressPercentage || 0,
        missingSkills: roleSkills.filter(s => !userSkills.includes(s)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};