import express from "express";
import {
  getStudentPlan,
  addTask,
  toggleTaskCompletion,
  rescheduleTask,
  deleteTask,
  generateAdaptiveSchedule,
  addCareerGoal,
  addExamDeadline,
  submitReview,
} from "../controllers/plannerController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/", getStudentPlan);
router.post("/tasks", addTask);
router.patch("/tasks/:taskId/toggle", toggleTaskCompletion);
router.patch("/tasks/:taskId/reschedule", rescheduleTask);
router.delete("/tasks/:taskId", deleteTask);
router.post("/generate-schedule", generateAdaptiveSchedule);
router.post("/goals", addCareerGoal);
router.post("/deadlines", addExamDeadline);
router.post("/reviews", submitReview);

export default router;
