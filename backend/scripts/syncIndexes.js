import mongoose from "mongoose";
import "dotenv/config";
import connectDB from "../config/db.js";
import logger from "../utils/logger.js";
import "../models/index.js";

/**
 * Migration utility to synchronize database indexes for all registered Mongoose models.
 * Usage:
 *   node scripts/syncIndexes.js           (Applies index synchronization)
 *   node scripts/syncIndexes.js --dry-run (Inspects and reports differences without modifying DB)
 */
async function syncAllIndexes() {
  const isDryRun = process.argv.includes("--dry-run");

  logger.info(`[syncIndexes] Starting index sync (${isDryRun ? "DRY RUN MODE" : "LIVE APPLY MODE"})...`);

  await connectDB();

  const modelNames = mongoose.modelNames();
  logger.info(`[syncIndexes] Found ${modelNames.length} registered models: ${modelNames.join(", ")}`);

  const results = [];

  for (const name of modelNames) {
    const Model = mongoose.model(name);
    try {
      if (isDryRun) {
        const existingIndexes = await Model.collection.indexes().catch(() => []);
        const schemaIndexes = Model.schema.indexes();
        logger.info(`[syncIndexes] Model ${name}: ${existingIndexes.length} active collection indexes, ${schemaIndexes.length} schema indexes.`);
        results.push({ model: name, status: "INSPECTED", existingCount: existingIndexes.length, schemaCount: schemaIndexes.length });
      } else {
        await Model.syncIndexes();
        logger.info(`[syncIndexes] Successfully synchronized indexes for model: ${name}`);
        results.push({ model: name, status: "SYNCHRONIZED" });
      }
    } catch (err) {
      logger.error(`[syncIndexes] Error syncing indexes for model ${name}:`, err.message);
      results.push({ model: name, status: "ERROR", error: err.message });
    }
  }

  logger.info(`[syncIndexes] Index sync completed for ${results.length} models.`);
  await mongoose.disconnect();
}

syncAllIndexes().catch((err) => {
  logger.error("[syncIndexes] Fatal execution failure:", err);
  process.exit(1);
});
