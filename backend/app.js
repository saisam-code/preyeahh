import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";

import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import ApiResponse from "./utils/ApiResponse.js";

import roleRoutes from "./routes/roleRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import guideRoutes from "./routes/guideRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import beyondRoutes from "./routes/beyondRoutes.js";
import guidanceRoutes from "./routes/guidanceRoutes.js";
import roleRequestRoutes from "./routes/roleRequestRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import aiRoadmapRoutes from "./routes/aiRoadmapRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import performanceRoutes from "./routes/performanceRoutes.js";

const app = express();

// ── Security & parsing middleware ──────────────────────────────
app.set("trust proxy", 1); // required behind Render's proxy for rate-limit/IP + secure cookies

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . from req.body/query/params to block NoSQL injection

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── CORS ────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      // allow non-browser tools (curl/Postman) with no origin header
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// ── Rate limiting (global baseline; auth routes add stricter limiters) ──
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: "Too many requests, please try again later." },
});
app.use("/api", globalLimiter);

// ── Health check ────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json(
    new ApiResponse(200, { uptime: process.uptime(), timestamp: Date.now() }, "Pre-Yeah API is healthy")
  );
});

// ── Core feature routes ─────────────
app.use("/api/roles", roleRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/beyond", beyondRoutes);
app.use("/api/guides", guideRoutes);
app.use("/api/guidance", guidanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/role-requests", roleRequestRoutes);

// ── AI learning modules (student-facing) ──
app.use("/api/chat", chatRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/ai-roadmaps", aiRoadmapRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/performance", performanceRoutes);

// ── 404 + centralized error handler (must be last) ───────────────
app.use(notFound);
app.use(errorHandler);

export default app;
