import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { getPerformance } from "../controllers/performanceController.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/", getPerformance);

export default router;
