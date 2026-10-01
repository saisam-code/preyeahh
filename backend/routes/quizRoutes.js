import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiters.js";
import validate from "../middleware/validate.js";
import { idParamRule, listRules, generateRules, submitRules } from "../validators/quizValidator.js";
import { generateQuiz, listQuizzes, getQuiz, submitQuiz, deleteQuiz } from "../controllers/quizController.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.post("/generate", aiLimiter, generateRules, validate, generateQuiz);
router.get("/", listRules, validate, listQuizzes);
router.get("/:id", idParamRule, validate, getQuiz);
router.post("/:id/submit", submitRules, validate, submitQuiz);
router.delete("/:id", idParamRule, validate, deleteQuiz);

export default router;
