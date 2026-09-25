import { getLearningProgress, getQuizProgress } from "../services/progress.service.js";

/**
 * GET /api/progress
 */
export const getLearningProgressController = async (req, res, next) => {
  try {
    const studentId = req.user?.id || req.user?.userId;
    const progress = await getLearningProgress(studentId);
    return res.status(200).json({ success: true, progress });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/progress/quizzes
 */
export const getQuizProgressController = async (req, res, next) => {
  try {
    const studentId = req.user?.id || req.user?.userId;
    const progress = await getQuizProgress(studentId);
    return res.status(200).json({ success: true, progress });
  } catch (err) {
    next(err);
  }
};
