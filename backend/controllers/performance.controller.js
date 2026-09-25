import { getUserPerformance } from "../services/performance.service.js";

/**
 * GET /api/performance
 */
export const getUserPerformanceController = async (req, res, next) => {
  try {
    const studentId = req.user?.id || req.user?.userId;
    const performance = await getUserPerformance(studentId);
    return res.status(200).json({ success: true, performance });
  } catch (err) {
    next(err);
  }
};