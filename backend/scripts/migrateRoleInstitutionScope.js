/**
 * Adds institution scope to the role title/branch unique constraint.
 *
 * Usage:
 *   npm run migrate:role-institution-scope
 */

import "dotenv/config";
import mongoose from "mongoose";
import Role from "../models/Role.js";

async function run() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");
  await mongoose.connect(process.env.MONGO_URI);

  const scopedIndex = "title_1_branch_1_institution_1";
  await Role.collection.createIndex(
    { title: 1, branch: 1, institution: 1 },
    { unique: true, name: scopedIndex }
  );

  const indexes = await Role.collection.indexes();
  if (indexes.some((index) => index.name === "title_1_branch_1")) {
    await Role.collection.dropIndex("title_1_branch_1");
  }

  console.log("Role institution-scope index migration complete.");
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(`Role institution-scope migration failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
