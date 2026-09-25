import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { connectDB } from "./config/db.js";
import { ApiError } from "./utils/ApiError.js";

dotenv.config();
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
app.use("/api/ai-roadmaps", require("./routes/aiRoadmapRoutes"));
app.use(express.json({ limit: "16kb" }));
app.use("/api/resources", require("./routes/resourceRoutes"));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT ALL ROUTES
// ─────────────────────────────────────────────────────────────────────────────

import authRoutes from "./routes/auth.routes.js";       // /verify-email only (shared)
import studentRoutes from "./routes/student.routes.js"; // register/login/etc for role=student
import guideRoutes from "./routes/guide.routes.js";      // register/login/etc for role=guide
import careerRoleRoutes from "./routes/careerRole.routes.js";
// import branchRoutes from "./routes/branch.routes.js";
// import guidanceRoutes from "./routes/guidance.routes.js";
// import roadmapRoutes from "./routes/roadmap.routes.js";
// import quizRoutes from "./routes/quiz.routes.js";
// import chatRoutes from "./routes/chat.routes.js";
// import progressRoutes from "./routes/progress.routes.js";
// import performanceRoutes from "./routes/performance.routes.js";
// import resourceRoutes from "./routes/resource.routes.js";
// import adminRoutes from "./routes/admin.routes.js";

// ─────────────────────────────────────────────────────────────────────────────
// WIRE ROUTES - UNCOMMENT AS YOU CREATE THEM
// ─────────────────────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/guides", guideRoutes);
app.use("/api/roles", careerRoleRoutes);

// COMING SOON - uncomment when routes exist
// app.use("/api/branches", branchRoutes);
// app.use("/api/guidance", guidanceRoutes);
// app.use("/api/roadmaps", roadmapRoutes);
// app.use("/api/quizzes", quizRoutes);
// app.use("/api/chat", chatRoutes);
// app.use("/api/progress", progressRoutes);
// app.use("/api/performance", performanceRoutes);
// app.use("/api/resources", resourceRoutes);
// app.use("/api/admin", adminRoutes);

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
