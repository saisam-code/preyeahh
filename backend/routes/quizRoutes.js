import express from "express";
import { protect, roleGate as authorize } from "../middleware/auth.middleware.js";
import {
  generateQuizController,
  getUserQuizzesController as getStudentQuizzesController,
  getQuizByIdController,
  submitQuizController,
  deleteQuizController,
} from "../controllers/quiz.controller.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.post("/generate", generateQuizController);
router.get("/", getStudentQuizzesController);
router.get("/:id", getQuizByIdController);
router.post("/:id/submit", submitQuizController);
router.delete("/:id", deleteQuizController);

export default router;