import RoleRequest from "../models/RoleRequest.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendEmail, { getClientUrl } from "../utils/sendEmail.js";
import logger from "../utils/logger.js";

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
  const { roleName, branch, summary, email } = req.body;
  const studentId = req.user?.role === "student" ? req.user.id : null;
  const userEmail = req.user?.doc?.email || email || null;

  const request = await RoleRequest.create({
    roleName,
    branch,
    summary,
    student: studentId,
    email: userEmail,
  });
  res.status(201).json(new ApiResponse(201, request, "Request submitted! Admin will review it."));
});

// GET /api/role-requests — admin, mirrors renderRoleRequests()
export const listRoleRequests = asyncHandler(async (req, res) => {
  const requests = await RoleRequest.find({ status: "pending" })
    .populate("student", "name email branch isVerified")
    .sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, requests, "Role requests fetched"));
});

// PATCH /api/role-requests/:id/dismiss — admin, mirrors dismissRequest()
export const dismissRoleRequest = asyncHandler(async (req, res) => {
  const request = await RoleRequest.findByIdAndUpdate(req.params.id, { status: "dismissed" }, { new: true });
  if (!request) throw ApiError.notFound("Role request not found");
  res.status(200).json(new ApiResponse(200, request, "Request dismissed"));
});

// PATCH /api/role-requests/:id/accept — admin accepts request and links the newly created role
export const acceptRoleRequest = asyncHandler(async (req, res) => {
  const { roleId } = req.body;
  const request = await RoleRequest.findById(req.params.id).populate("student", "name email");
  if (!request) throw ApiError.notFound("Role request not found");

  request.status = "accepted";
  if (roleId) request.acceptedRole = roleId;
  request.notifiedStudent = false;
  await request.save();

  // If email can be sent, notify them immediately via email as well
  const recipientEmail = request.student?.email || request.email;
  const recipientName = request.student?.name || "Student";
  if (recipientEmail) {
    try {
      await sendEmail({
        to: recipientEmail,
        subject: `Great news! Role '${request.roleName}' has been added to Preyeahh`,
        html: `<p>Hi ${recipientName},</p><p>We are excited to let you know that your requested role <strong>${request.roleName}</strong> (${request.branch}) has been approved and added to Preyeahh!</p><p>Log in to explore the guidance, curated roadmaps, and AI mentorship for this role.</p><p><a href="${getClientUrl()}/roles">Explore Roles</a></p>`,
      });
    } catch (err) {
      logger.dev(`Failed to send role acceptance email: ${err.message}`);
    }
  }

  res.status(200).json(new ApiResponse(200, request, "Role request accepted and student will be notified"));
});

// GET /api/role-requests/student-notifications — student checks for accepted requests when logged in
export const getStudentNotifications = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const studentEmail = req.user.doc?.email;

  const filter = {
    status: "accepted",
    notifiedStudent: false,
  };
  if (studentEmail) {
    filter.$or = [{ student: studentId }, { email: studentEmail.toLowerCase() }];
  } else {
    filter.student = studentId;
  }

  const acceptedRequests = await RoleRequest.find(filter).populate("acceptedRole", "title branch");
  res.status(200).json(new ApiResponse(200, acceptedRequests, "Notifications fetched"));
});

// POST /api/role-requests/student-notifications/:id/read — student acknowledges the notification
export const markNotificationRead = asyncHandler(async (req, res) => {
  const request = await RoleRequest.findByIdAndUpdate(
    req.params.id,
    { notifiedStudent: true },
    { new: true }
  );
  if (!request) throw ApiError.notFound("Notification not found");
  res.status(200).json(new ApiResponse(200, null, "Notification marked as read"));
});

// DELETE /api/role-requests — admin, mirrors clearRoleRequests()
export const clearRoleRequests = asyncHandler(async (req, res) => {
  await RoleRequest.deleteMany({});
  res.status(200).json(new ApiResponse(200, null, "All role requests cleared"));
});
