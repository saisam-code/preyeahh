const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createResourceController,
  searchResourcesController,
  recommendResourcesController,
  getResourceByIdController,
  incrementViewsController,
  deleteResourceController,
} = require("../controllers/resourceController");

// Public — search and browse
router.get("/", searchResourcesController);
router.get("/:id", getResourceByIdController);
router.patch("/:id/view", incrementViewsController);

// Student — get recommendations (used internally by AI roadmap)
router.post("/recommend", protect, authorize("student"), recommendResourcesController);

// Admin only — curate resources
router.post("/", protect, authorize("admin"), createResourceController);
router.delete("/:id", protect, authorize("admin"), deleteResourceController);

module.exports = router;