import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";
import "./models/index.js"; // registers every schema before the app starts handling requests

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`[server] Preyeahh API running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });

  // Fail loudly on unhandled promise rejections instead of a silent hang
  process.on("unhandledRejection", (err) => {
    logger.error(`[server] Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
}

start();
