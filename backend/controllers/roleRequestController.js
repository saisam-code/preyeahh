import RoleRequest from "../models/RoleRequest.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * POST /api/role-requests
 * Mirrors submitRoleRequest() in roles.html. The original wrote to
 * localStorage only (never actually hit Supabase's role_requests table
 * despite it existing in schema) — this wires it to a real, shared
 * backend so every admin sees every request, not just the submitter's browser.
 * optionalAuth: works logged-out (original modal doesn't require login),
 * but attaches the student if one happens to be signed in.
 */
export const createRoleRequest = asyncHandler(async (req, res) => {
  const { roleName, branch, summary } = req.body;
  const request = await RoleRequest.create({
    roleName,
    branch,
    summary,
    student: req.user?.role === "student" ? req.user.id : null,
    email: req.user?.doc?.email || null,
  });
  res.status(201).json(new ApiResponse(201, request, "Request submitted! Admin will review it."));
});

// GET /api/role-requests — admin, mirrors renderRoleRequests()
export const listRoleRequests = asyncHandler(async (req, res) => {
  const requests = await RoleRequest.find({ status: "pending" }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, requests, "Role requests fetched"));
});

// PATCH /api/role-requests/:id/dismiss — admin, mirrors dismissRequest()
export const dismissRoleRequest = asyncHandler(async (req, res) => {
  const request = await RoleRequest.findByIdAndUpdate(req.params.id, { status: "dismissed" }, { new: true });
  if (!request) throw ApiError.notFound("Role request not found");
  res.status(200).json(new ApiResponse(200, request, "Request dismissed"));
});

// DELETE /api/role-requests — admin, mirrors clearRoleRequests()
export const clearRoleRequests = asyncHandler(async (req, res) => {
  await RoleRequest.deleteMany({});
  res.status(200).json(new ApiResponse(200, null, "All role requests cleared"));
});
