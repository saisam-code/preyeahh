import { Router } from "express";
import * as studentController from "../controllers/student.controller.js";
import { protect, roleGate } from "../middleware/auth.middleware.js";

const router = Router();

// =====================================================
// Public
// =====================================================

router.post("/register", studentController.register);
router.post("/login", studentController.login);
router.post("/forgot-password", studentController.forgotPassword);
router.post("/reset-password", studentController.resetPassword);
router.post("/resend-verification", studentController.resendVerification);
router.post("/refresh", studentController.refresh);

// =====================================================
// Protected — Student only
// =====================================================

router.post(
  "/logout",
  protect,
  roleGate("student"),
  studentController.logout
);

router.get(
  "/me",
  protect,
  roleGate("student"),
  studentController.me
);

router.post(
  "/profile/extract",
  protect,
  roleGate("student"),
  studentController.extractProfileController
);

router.put(
  "/profile/preferences",
  protect,
  roleGate("student"),
  studentController.updatePreferencesController
);

router.post(
  "/profile/skip-onboarding",
  protect,
  roleGate("student"),
  studentController.skipOnboardingController
);

export default router;