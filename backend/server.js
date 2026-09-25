import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
dotenv.config();

import { connectDB } from "./config/db.js";
import { ApiError } from "./utils/ApiError.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import guideRoutes from "./routes/guide.routes.js";
import careerRoleRoutes from "./routes/careerRole.routes.js";
import aiRoadmapRoutes from "./routes/aiRoadmapRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import progressRoutes from "./routes/progress.routes.js";
import performanceRoutes from "./routes/performance.routes.js";

await connectDB();

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// CORE MIDDLEWARE (must run before any route uses req.body / req.cookies)
// ─────────────────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────────────────────
// WIRE ROUTES
// ─────────────────────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/guides", guideRoutes);
app.use("/api/roles", careerRoleRoutes);
app.use("/api/ai-roadmaps", aiRoadmapRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/performance", performanceRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 HANDLER (must be AFTER all routes)
// ─────────────────────────────────────────────────────────────────────────────

app.use((req, res, next) => {
  throw new ApiError(404, `Route not found: ${req.originalUrl}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER (must be LAST)
// ─────────────────────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error("Error:", {
    message: err.message,
    statusCode: err.statusCode || 500,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
