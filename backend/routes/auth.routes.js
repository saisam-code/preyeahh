/**
 * SOURCE: Merged from preyeahouter/backend/routes/auth.routes.js (App A)
 *         + preyeah-main/server/routes/authRoutes.js (App B)
 */

import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// Public endpoints
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/refresh", authController.refresh);

// Protected endpoints
router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.me);

export default router;
