/**
 * Creates demo accounts for testing student and guide experiences in a non-production database.
 * Usage: npm run seed:demo
 * Refuses to run in production and never overwrites existing accounts.
 */
import "dotenv/config";
import mongoose from "mongoose";
import "../models/index.js";

const DEMOS = [
  {
    model: mongoose.model("Student"),
    name: "Demo Student",
    email: "demo.student@gmail.com",
    password: "DemoStudent123!",
    branch: "CSE",
    extra: { isVerified: true },
  },
  {
    model: mongoose.model("Guide"),
    name: "Demo Guide",
    email: "demo.guide@nbkrist.org",
    password: "DemoGuide123!",
    branch: "CSE",
    extra: {
      roleNames: ["Software Engineer"],
      bio: "Local demo guide account for testing the guide experience.",
      status: "approved",
      isVerified: true,
    },
  },
];

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo accounts are disabled in production.");
  }

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/preyeah";
  await mongoose.connect(mongoUri);

  const Branch = mongoose.model("Branch");
  if (!(await Branch.exists({ name: "CSE" }))) {
    await Branch.create({ name: "CSE" });
  }

  for (const demo of DEMOS) {
    const existing = await demo.model.findOne({ email: demo.email });
    if (existing) {
      console.log(`Skipped ${demo.email}: account already exists; its password was not changed.`);
      continue;
    }

    await demo.model.create({
      name: demo.name,
      email: demo.email,
      password: demo.password,
      branch: demo.branch,
      ...demo.extra,
    });
    console.log(`Created ${demo.email}`);
  }

  console.log("Demo account setup complete. Use only with a non-production database.");
}

main()
  .catch((error) => {
    console.error("Demo account setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
