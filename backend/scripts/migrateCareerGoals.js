/**
 * Idempotent migration from legacy career-intent fields to StudentGoal.
 *
 * Sources in priority order:
 * 1. Student preferences primaryCareerGoal / targetRole
 * 2. Student preferences alternativeCareerGoal / exploringCareers
 * 3. PersonalCareerPlan primaryCareer / alternativeCareer / embedded goals
 *
 * Usage:
 *   npm run migrate:career-goals
 */

import "dotenv/config";
import mongoose from "mongoose";
import "../models/index.js";
import Student from "../models/Student.js";
import PersonalCareerPlan from "../models/PersonalCareerPlan.js";
import StudentGoal from "../models/StudentGoal.js";

async function upsertGoal(studentId, goalTitle, type) {
  const title = typeof goalTitle === "string" ? goalTitle.trim() : "";
  if (!title) return false;

  const existing = await StudentGoal.findOne({
    student: studentId,
    goalTitle: title,
    status: "ACTIVE",
  });
  if (existing) {
    if (existing.type !== type) {
      existing.type = type;
      await existing.save();
      return true;
    }
    return false;
  }

  await StudentGoal.create({
    student: studentId,
    goalTitle: title,
    type,
    status: "ACTIVE",
  });
  return true;
}

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/preyeah";
  await mongoose.connect(mongoUri);

  let createdOrUpdated = 0;
  const students = await Student.find({}).lean();

  for (const student of students) {
    const studentId = student._id;
    const preferences = student.preferences || {};
    const plan = await PersonalCareerPlan.findOne({ student: studentId }).lean();

    const primary = preferences.primaryCareerGoal || preferences.targetRole || plan?.primaryCareer || "";
    const alternative = preferences.alternativeCareerGoal || plan?.alternativeCareer || "";
    const exploring = [
      ...(Array.isArray(preferences.exploringCareers) ? preferences.exploringCareers : []),
      ...(Array.isArray(plan?.goals)
        ? plan.goals
            .filter((goal) => ["Exploring", "Temporary", "Long-term"].includes(goal.goalType))
            .map((goal) => goal.title)
        : []),
    ];

    if (await upsertGoal(studentId, primary, "PRIMARY")) createdOrUpdated++;
    if (await upsertGoal(studentId, alternative, "ALTERNATIVE")) createdOrUpdated++;
    for (const title of new Set(exploring.map((value) => String(value).trim()).filter(Boolean))) {
      if (await upsertGoal(studentId, title, "EXPLORING")) createdOrUpdated++;
    }
  }

  console.log(`Career-goal migration complete: ${createdOrUpdated} goal records created or updated.`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(`Career-goal migration failed: ${err.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
