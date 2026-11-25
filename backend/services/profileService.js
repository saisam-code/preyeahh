import Student from "../models/Student.js";
import StudentGoal from "../models/StudentGoal.js";
import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import { jsonCompletion } from "./groqService.js";
import { buildProfileExtractionPrompt, buildPassiveExtractionPrompt } from "../utils/aiPrompts.js";
import { normalizeEducationStage } from "../constants/educationStages.js";

const LEVELS = ["beginner", "intermediate", "advanced"];
const STYLES = ["visual", "hands-on", "reading"];
const PUBLIC_SELECT = "-password -refreshTokenVersion";

const str = (v, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const strList = (v, maxItems = 15) =>
  Array.isArray(v) ? [...new Set(v.map((x) => str(x)).filter(Boolean))].slice(0, maxItems) : [];

function normalizeSkills(v) {
  if (!Array.isArray(v)) return [];
  const seen = new Set();
  const out = [];
  for (const s of v) {
    const name = str(typeof s === "string" ? s : s?.name, 60);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    const level = LEVELS.includes(s?.level) ? s.level : "beginner";
    out.push({ name, level });
  }
  return out.slice(0, 30);
}

async function syncCareerGoals(studentId, raw) {
  const selections = [
    ["primaryCareerGoal", "PRIMARY"],
    ["alternativeCareerGoal", "ALTERNATIVE"],
  ];

  for (const [field, type] of selections) {
    if (!Object.hasOwn(raw, field)) continue;
    const goalTitle = str(raw[field]);
    const activeGoals = await StudentGoal.find({ student: studentId, type, status: "ACTIVE" });
    for (const activeGoal of activeGoals) {
      if (activeGoal.goalTitle !== goalTitle) {
        activeGoal.status = "PAUSED";
        await activeGoal.save();
      }
    }
    if (goalTitle) {
      const existing = await StudentGoal.findOne({ student: studentId, goalTitle, status: "ACTIVE" });
      if (existing) {
        existing.type = type;
        await existing.save();
      } else {
        await StudentGoal.create({ student: studentId, goalTitle, type, status: "ACTIVE" });
      }
    }
  }

  if (Object.hasOwn(raw, "exploringCareers")) {
    const goalTitles = strList(raw.exploringCareers);
    await StudentGoal.updateMany(
      { student: studentId, type: "EXPLORING", status: "ACTIVE", goalTitle: { $nin: goalTitles } },
      { $set: { status: "PAUSED" } }
    );
    for (const goalTitle of goalTitles) {
      const existing = await StudentGoal.findOne({ student: studentId, goalTitle, status: "ACTIVE" });
      if (existing) {
        existing.type = "EXPLORING";
        await existing.save();
      } else {
        await StudentGoal.create({ student: studentId, goalTitle, type: "EXPLORING", status: "ACTIVE" });
      }
    }
  }
}

/**
 * Validates/cleans a raw preferences object (from AI or from the form) into $set-ready dotted fields.
 *
 * SECURITY: shareContactWithGuides and shareProfileWithGuides are INTENTIONALLY excluded.
 * Privacy consent flags must only be changed by the student through an explicit UI action
 * (PUT /students/profile/privacy). AI passive extraction must NEVER override them.
 */
function toSetFields(raw) {
  const set = {};
  // NOTE: share flags deliberately omitted — see security comment above.
  if (raw.educationStage) set["preferences.educationStage"] = normalizeEducationStage(raw.educationStage);
  if (str(raw.academicStream, 40)) set["preferences.academicStream"] = str(raw.academicStream, 40);
  if (str(raw.degreeOrProgram, 60)) set["preferences.degreeOrProgram"] = str(raw.degreeOrProgram, 60);
  if (str(raw.specialization, 60)) set["preferences.specialization"] = str(raw.specialization, 60);
  if (str(raw.yearOfStudy, 20)) set["preferences.yearOfStudy"] = str(raw.yearOfStudy, 20);
  if (str(raw.semester, 20)) set["preferences.semester"] = str(raw.semester, 20);
  if (str(raw.schoolOrInstitution, 120)) set["preferences.schoolOrInstitution"] = str(raw.schoolOrInstitution, 120);
  if (str(raw.board, 40)) set["preferences.board"] = str(raw.board, 40);
  for (const field of ["country", "state", "city"]) {
    if (str(raw[field], field === "country" ? 60 : 80)) {
      set[`preferences.${field}`] = str(raw[field], field === "country" ? 60 : 80);
    }
  }
  if (raw.expectedGraduationYear === null) {
    set["preferences.expectedGraduationYear"] = null;
  } else {
    const graduationYear = Number(raw.expectedGraduationYear);
    if (Number.isInteger(graduationYear) && graduationYear >= 1900 && graduationYear <= 2200) {
      set["preferences.expectedGraduationYear"] = graduationYear;
    }
  }
  const subjects = strList(raw.subjects);
  if (subjects.length) set["preferences.subjects"] = subjects;
  if (str(raw.primaryCareerGoal)) set["preferences.primaryCareerGoal"] = str(raw.primaryCareerGoal);
  if (str(raw.alternativeCareerGoal)) set["preferences.alternativeCareerGoal"] = str(raw.alternativeCareerGoal);
  if (Object.hasOwn(raw, "childhoodDream")) set["preferences.childhoodDream"] = str(raw.childhoodDream);
  if (Object.hasOwn(raw, "formerCareerGoal")) set["preferences.formerCareerGoal"] = str(raw.formerCareerGoal);
  if (Object.hasOwn(raw, "careerSwitchReason")) set["preferences.careerSwitchReason"] = str(raw.careerSwitchReason, 500);
  const exploring = strList(raw.exploringCareers);
  if (exploring.length) set["preferences.exploringCareers"] = exploring;
  if (str(raw.budgetRange, 40)) set["preferences.budgetRange"] = str(raw.budgetRange, 40);
  const strengths = strList(raw.strengths);
  if (strengths.length) set["preferences.strengths"] = strengths;
  const weaknesses = strList(raw.weaknesses);
  if (weaknesses.length) set["preferences.weaknesses"] = weaknesses;
  if (raw.dateOfBirth) set["dateOfBirth"] = new Date(raw.dateOfBirth);
  if (["UNDER_18", "18_PLUS"].includes(raw.ageBand)) set["ageBand"] = raw.ageBand;

  if (str(raw.currentRole)) set["preferences.currentRole"] = str(raw.currentRole);
  if (str(raw.targetRole)) set["preferences.targetRole"] = str(raw.targetRole);
  if (LEVELS.includes(raw.experienceLevel)) set["preferences.experienceLevel"] = raw.experienceLevel;
  if (STYLES.includes(raw.learningStyle)) set["preferences.learningStyle"] = raw.learningStyle;
  const hours = Number(raw.weeklyHoursAvailable);
  if (Number.isFinite(hours) && hours > 0) set["preferences.weeklyHoursAvailable"] = Math.min(hours, 168);
  if (str(raw.preferredLanguage, 40)) set["preferences.preferredLanguage"] = str(raw.preferredLanguage, 40);
  if (["traditional", "unconventional", "both", "unsure"].includes(raw.careerPreference)) {
    set["preferences.careerPreference"] = raw.careerPreference;
  }
  if (Number.isInteger(raw.onboardingStep) && raw.onboardingStep >= 1 && raw.onboardingStep <= 6) {
    set["preferences.onboardingStep"] = raw.onboardingStep;
  }
  if (str(raw.aiProfileSummary, 600)) set["preferences.aiProfileSummary"] = str(raw.aiProfileSummary, 600);
  const goals = strList(raw.goals);
  if (goals.length) set["preferences.goals"] = goals;
  const interests = strList(raw.interests);
  if (interests.length) set["preferences.interests"] = interests;
  const skills = normalizeSkills(raw.skills);
  if (skills.length) set["preferences.skills"] = skills;
  return set;
}

async function saveProfileFields(studentId, fields) {
  const student = await Student.findById(studentId);
  if (!student) throw ApiError.notFound("Student not found");

  const previousStage = student.preferences.educationStage;
  const nextStage = fields["preferences.educationStage"];
  const educationPaths = [
    "preferences.educationStage",
    "preferences.schoolOrInstitution",
    "preferences.board",
    "preferences.academicStream",
    "preferences.degreeOrProgram",
    "preferences.specialization",
    "preferences.yearOfStudy",
    "preferences.semester",
    "preferences.expectedGraduationYear",
  ];
  const educationChanged = educationPaths.some(
    (path) => Object.hasOwn(fields, path) && !Object.is(student.get(path), fields[path])
  );
  if (student.preferences.onboardingCompleted && previousStage && educationChanged) {
    student.educationHistory.push({
      educationStage: previousStage,
      schoolOrInstitution: student.preferences.schoolOrInstitution,
      board: student.preferences.board,
      academicStream: student.preferences.academicStream,
      degreeOrProgram: student.preferences.degreeOrProgram,
      specialization: student.preferences.specialization,
      yearOfStudy: student.preferences.yearOfStudy,
      semester: student.preferences.semester,
      expectedGraduationYear: student.preferences.expectedGraduationYear,
    });
  }

  for (const [path, value] of Object.entries(fields)) student.set(path, value);
  await student.save();
  return student;
}

/** POST /students/profile/extract — free text -> structured preferences (replaces provided fields). */
export async function extractAndSaveProfile(studentId, branch, text) {
  const extracted = await jsonCompletion(buildProfileExtractionPrompt(text, branch), {
    temperature: 0.2,
    maxTokens: 1024,
  });

  const $set = {
    ...toSetFields(extracted),
    "preferences.onboardingCompleted": true,
    "preferences.onboardingSkipped": false,
    "preferences.lastExtractedAt": new Date(),
  };

  const student = await saveProfileFields(studentId, $set);
  await syncCareerGoals(studentId, extracted);
  return { preferences: student.preferences, extracted };
}

/** PUT /students/profile/preferences — manual onboarding form. Only sent fields are changed. */
export async function updatePreferences(studentId, body) {
  const $set = {
    ...toSetFields(body),
    "preferences.onboardingCompleted":
      typeof body.onboardingCompleted === "boolean" ? body.onboardingCompleted : true,
    "preferences.onboardingSkipped": false,
  };
  // Allow explicitly clearing text/array fields that toSetFields skips when empty
  for (const key of [
    "currentRole",
    "targetRole",
    "primaryCareerGoal",
    "alternativeCareerGoal",
    "academicStream",
    "degreeOrProgram",
    "specialization",
    "yearOfStudy",
    "semester",
    "schoolOrInstitution",
    "board",
    "country",
    "state",
    "city",
  ]) {
    if (body[key] === "") $set[`preferences.${key}`] = "";
  }
  for (const key of ["goals", "interests", "skills", "subjects", "exploringCareers"]) {
    if (Array.isArray(body[key]) && body[key].length === 0) $set[`preferences.${key}`] = [];
  }
  for (const key of ["childhoodDream", "formerCareerGoal", "careerSwitchReason"]) {
    if (body[key] === "") $set[`preferences.${key}`] = "";
  }

  const student = await saveProfileFields(studentId, $set);
  await syncCareerGoals(studentId, body);
  return student.preferences;
}

/** POST /students/profile/skip-onboarding */
export async function skipOnboarding(studentId) {
  const student = await Student.findByIdAndUpdate(
    studentId,
    { $set: { "preferences.onboardingSkipped": true, "preferences.onboardingCompleted": false } },
    { new: true }
  ).select(PUBLIC_SELECT);
  if (!student) throw ApiError.notFound("Student not found");
  return student.preferences;
}

/**
 * Fire-and-forget: reads recent chat messages and MERGES new profile signals
 * (arrays are unioned, skills merged by name). Never throws.
 */
export async function passivelyUpdateProfile(studentId, messages, currentPreferences = {}) {
  try {
    const extracted = await jsonCompletion(buildPassiveExtractionPrompt(messages, currentPreferences), {
      temperature: 0.2,
      maxTokens: 512,
    });

    const fields = toSetFields(extracted);
    const $set = { "preferences.lastExtractedAt": new Date() };
    const $addToSet = {};

    for (const [path, value] of Object.entries(fields)) {
      if (path === "preferences.goals" || path === "preferences.interests") {
        $addToSet[path] = { $each: value };
      } else if (path === "preferences.skills") {
        const existing = (currentPreferences.skills || []).map((s) => ({ name: s.name, level: s.level }));
        for (const incoming of value) {
          const i = existing.findIndex((s) => s.name.toLowerCase() === incoming.name.toLowerCase());
          if (i >= 0) existing[i] = incoming;
          else existing.push(incoming);
        }
        $set[path] = existing;
      } else {
        $set[path] = value;
      }
    }

    const update = { $set };
    if (Object.keys($addToSet).length) update.$addToSet = $addToSet;
    await Student.findByIdAndUpdate(studentId, update);
  } catch (err) {
    logger.warn(`[profile] passive update failed for ${studentId}: ${err.message}`);
  }
}
