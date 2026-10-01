import mongoose from "mongoose";
import logger from "../utils/logger.js";

mongoose.set("strictQuery", true);

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Exits the process on failure to connect at boot (fail fast in production).
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    logger.error("[db] MONGO_URI is not set in environment variables.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    logger.error(`[db] Initial connection failed: ${err.message}`);
    process.exit(1);
  }

  mongoose.connection.on("error", (err) => {
    logger.error(`[db] Connection error: ${err.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("[db] MongoDB disconnected.");
  });

  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    logger.info("[db] Connection closed due to app termination (SIGINT).");
    process.exit(0);
  });
}

export default connectDB;
