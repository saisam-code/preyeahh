import { Router } from "express";
import { protect, roleGate as authorize } from "../middleware/auth.middleware.js";
import {
  createResourceController,
  searchResourcesController,
  recommendResourcesController,
  getResourceByIdController,
  incrementViewsController,
  deleteResourceController,
} from "../controllers/resourceController.js";

const router = Router();

// Public — search and browse
router.get("/", searchResourcesController);
router.get("/:id", getResourceByIdController);
router.patch("/:id/view", incrementViewsController);

// Student — get recommendations (used internally by AI roadmap)
router.post("/recommend", protect, authorize("student"), recommendResourcesController);

// Admin only — curate resources
router.post("/", protect, authorize("admin"), createResourceController);
router.delete("/:id", protect, authorize("admin"), deleteResourceController);

export default router;