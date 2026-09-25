import { Router } from "express";
import { protect, roleGate as authorize } from "../middleware/auth.middleware.js";
import {
  generateRoadmapController,
  getStudentRoadmapsController,
  getRoadmapByIdController,
  updateTopicProgressController,
  deleteRoadmapController,
} from "../controllers/aiRoadmapController.js";

const router = Router();

// Students only
router.use(protect, authorize("student"));

router.post("/generate", generateRoadmapController);
router.get("/", getStudentRoadmapsController);
router.get("/:id", getRoadmapByIdController);
router.patch("/:id/progress", updateTopicProgressController);
router.delete("/:id", deleteRoadmapController);

export default router;