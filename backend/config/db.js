/**
 * SOURCE: preyeahouter/backend/config/db.js (App A)
 * Unified MongoDB connection with logging.
 */

import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/preyeah";

    const connection = await mongoose.connect(mongoUri);
    // ↑ Remove useNewUrlParser and useUnifiedTopology (they're no longer needed)

    console.log(`✓ MongoDB connected: ${connection.connection.host}:${connection.connection.port}/${connection.connection.name}`);
    return connection;
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
