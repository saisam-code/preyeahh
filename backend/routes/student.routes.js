import { Router } from "express";
import * as studentController from "../controllers/student.controller.js";
import { protect, roleGate } from "../middleware/auth.middleware.js";

const router = Router();

// Public
router.post("/register", studentController.register);
router.post("/login", studentController.login);
router.post("/forgot-password", studentController.forgotPassword);
router.post("/reset-password", studentController.resetPassword);
router.post("/resend-verification", studentController.resendVerification);
router.post("/refresh", studentController.refresh);

// Protected
router.post("/logout", protect, studentController.logout);
router.get("/me", roleGate("student"), studentController.me);

export default router;
