import express from "express";
import { protect, roleGate as authorize } from "../middleware/auth.middleware.js";
import {
  getLearningProgressController,
  getQuizProgressController,
} from "../controllers/progress.controller.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/", getLearningProgressController);
router.get("/quizzes", getQuizProgressController);

export default router;
