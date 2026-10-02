import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as quizService from "../services/quizService.js";

// POST /api/quiz/generate   body: { topic?, roleId?, difficulty? }
export const generateQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizService.generateQuiz(req.user, req.body);
  res.status(201).json(new ApiResponse(201, quiz, "Quiz generated successfully"));
});

// GET /api/quiz
export const listQuizzes = asyncHandler(async (req, res) => {
  const { items, meta } = await quizService.listQuizzes(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, items, "Quizzes fetched", meta));
});

// GET /api/quiz/:id
export const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizService.getQuiz(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, quiz, "Quiz fetched"));
});

// GET /api/quiz/:id/export
export const exportQuiz = asyncHandler(async (req, res) => {
  const payload = await quizService.exportQuiz(req.params.id, req.user.id);
  const fileName = `${(payload.title || "quiz").replace(/\s+/g, "-").toLowerCase() || "quiz"}.json`;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.status(200).send(JSON.stringify(payload, null, 2));
});

// POST /api/quiz/:id/submit   body: { answers: string[] }
export const submitQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizService.submitQuiz(req.params.id, req.user.id, req.body.answers);
  res.status(200).json(new ApiResponse(200, quiz, "Quiz submitted successfully"));
});

// DELETE /api/quiz/:id
export const deleteQuiz = asyncHandler(async (req, res) => {
  await quizService.deleteQuiz(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, null, "Quiz deleted"));
});
