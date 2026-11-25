import CareerDomain from "../models/CareerDomain.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getCareerDomains = asyncHandler(async (req, res) => {
  const domains = await CareerDomain.find().sort({ displayOrder: 1, name: 1 });
  res.status(200).json(new ApiResponse(200, domains, "Career domains fetched"));
});
