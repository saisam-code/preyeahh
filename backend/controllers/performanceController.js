import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as performanceService from "../services/performanceService.js";

// GET /api/performance
export const getPerformance = asyncHandler(async (req, res) => {
  const performance = await performanceService.getPerformance(req.user);
  res.status(200).json(new ApiResponse(200, performance, "Performance fetched"));
});
