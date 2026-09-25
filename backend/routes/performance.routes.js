import express from "express";
import { protect, roleGate as authorize } from "../middleware/auth.middleware.js";
import { getUserPerformanceController } from "../controllers/performance.controller.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/", getUserPerformanceController);

export default router;
