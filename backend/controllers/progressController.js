import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as progressService from "../services/progressService.js";

// GET /api/progress
export const getLearningProgress = asyncHandler(async (req, res) => {
  const progress = await progressService.getLearningProgress(req.user.id);
  res.status(200).json(new ApiResponse(200, progress, "Learning progress fetched"));
});

// GET /api/progress/quizzes
export const getQuizProgress = asyncHandler(async (req, res) => {
  const progress = await progressService.getQuizProgress(req.user.id);
  res.status(200).json(new ApiResponse(200, progress, "Quiz progress fetched"));
});
