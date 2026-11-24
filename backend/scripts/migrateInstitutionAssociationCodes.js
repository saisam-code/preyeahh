import "dotenv/config";
import mongoose from "mongoose";
import { Institution } from "../models/Institution.js";

async function run() {
  const apply = process.argv.includes("--apply");
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be set; refusing to choose a database implicitly");
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const filter = { associationCode: { $exists: true } };
    const count = await Institution.collection.countDocuments(filter);
    console.log(`${apply ? "Applying" : "Dry run:"} ${count} institution documents contain a plaintext association code.`);

    if (apply && count > 0) {
      const result = await Institution.collection.updateMany(filter, { $unset: { associationCode: "" } });
      console.log(`Removed plaintext association codes from ${result.modifiedCount} institution documents.`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error("Association-code migration failed:", error.message);
  process.exitCode = 1;
});
