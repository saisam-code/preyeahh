import { Router } from "express";
import * as guideController from "../controllers/guide.controller.js";
import { protect, roleGate } from "../middleware/auth.middleware.js";

const router = Router();

// Public
router.post("/register", guideController.register);
router.post("/login", guideController.login);
router.post("/forgot-password", guideController.forgotPassword);
router.post("/reset-password", guideController.resetPassword);
router.post("/resend-verification", guideController.resendVerification);
router.post("/refresh", guideController.refresh);

// Protected
router.post("/logout", protect, guideController.logout);
router.get("/me", roleGate("guide"), guideController.me);

export default router;
