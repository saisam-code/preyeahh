import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as mentorshipService from "../services/mentorshipService.js";

export const listRoleMentors = asyncHandler(async (req, res) => {
  const mentors = await mentorshipService.listRoleMentors(req.user, req.query.roleId);
  res.status(200).json(new ApiResponse(200, mentors, "Role guides fetched"));
});

export const startConversation = asyncHandler(async (req, res) => {
  const conversation = await mentorshipService.startConversation(req.user, req.body);
  res.status(201).json(new ApiResponse(201, conversation, "Mentor conversation ready"));
});

export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await mentorshipService.listConversations(req.user);
  res.status(200).json(new ApiResponse(200, conversations, "Mentor conversations fetched"));
});

export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await mentorshipService.getConversation(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, conversation, "Mentor conversation fetched"));
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await mentorshipService.sendConversationMessage(req.params.id, req.user, req.body.content);
  res.status(200).json(new ApiResponse(200, conversation, "Message sent"));
});