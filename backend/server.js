/**
 * SOURCE: Merged from preyeahouter/backend/server.js (App A)
 *         + preyeah-main/server/server.js (App B)
 *
 * UNIFIED SERVER:
 *   - Single Express instance
 *   - All middleware wired in order
 *   - All route domains under /api prefix
 *   - Global error handler
 *   - CORS configured for frontend
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { ApiError } from "./utils/ApiError.js";

// ─────────────────────────────────────────────────────────────────────────────
// LOAD ENV
// ─────────────────────────────────────────────────────────────────────────────
dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// CONNECT DATABASE
// ─────────────────────────────────────────────────────────────────────────────
await connectDB();

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZE EXPRESS
// ─────────────────────────────────────────────────────────────────────────────
const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

// CORS
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));

// Cookie parsing
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES (import and wire in order)
// ─────────────────────────────────────────────────────────────────────────────

import authRoutes from "./routes/auth.routes.js";

// (Add more route imports here as you build them)
// import userRoutes from "./routes/user.routes.js";
// import branchRoutes from "./routes/branch.routes.js";
// import roleRoutes from "./routes/role.routes.js";
// import roadmapRoutes from "./routes/roadmap.routes.js";
// etc.

app.use("/api/auth", authRoutes);
// app.use("/api/user", userRoutes);
// app.use("/api/branches", branchRoutes);
// etc.

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 HANDLER
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  throw new ApiError(404, `Route not found: ${req.originalUrl}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Log error
  console.error("Error:", {
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: err.stack,
  });

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ API docs: http://localhost:${PORT}/api`);
  console.log(`✓ Health check: http://localhost:${PORT}/health\n`);
});
