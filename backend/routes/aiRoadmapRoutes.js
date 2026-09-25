const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  generateRoadmapController,
  getStudentRoadmapsController,
  getRoadmapByIdController,
  updateTopicProgressController,
  deleteRoadmapController,
} = require("../controllers/aiRoadmapController");

// Students only
router.use(protect, authorize("student"));

router.post("/generate", generateRoadmapController);
router.get("/", getStudentRoadmapsController);
router.get("/:id", getRoadmapByIdController);
router.patch("/:id/progress", updateTopicProgressController);
router.delete("/:id", deleteRoadmapController);

module.exports = router;