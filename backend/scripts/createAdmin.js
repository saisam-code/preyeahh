/**
 * One-off admin bootstrap script.
 * Usage: ADMIN_NAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run create-admin
 * Refuses to run if an admin already exists — delete it first if you mean to replace it.
 */
import "dotenv/config";
import mongoose from "mongoose";
import "../models/index.js";

async function main() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (and optionally ADMIN_NAME) as env vars before running this script.");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  const Admin = mongoose.model("Admin");

  const existing = await Admin.countDocuments();
  if (existing > 0) {
    console.log(`Refusing — ${existing} admin account(s) already exist. Delete them first if you really mean to replace.`);
    process.exit(1);
  }

  await Admin.create({ name: ADMIN_NAME || "Admin", email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  console.log(`Admin created: ${ADMIN_EMAIL}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to create admin:", err.message);
  process.exit(1);
});
