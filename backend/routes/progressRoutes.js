import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { getLearningProgress, getQuizProgress } from "../controllers/progressController.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/", getLearningProgress);
router.get("/quizzes", getQuizProgress);

export default router;
