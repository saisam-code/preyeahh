import { getProfileCompleteness } from "../utils/profileCompleteness.js";
import { getLearningProgress, getQuizProgress } from "./progressService.js";

const STALE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Rule-based analysis of a student's quiz + roadmap activity.
 * Returns topic strengths/weaknesses and a prioritised list of suggestions
 * ({ id, severity: high|medium|low|info, title, description, action? }).
 */
export async function getPerformance(student) {
  const [learning, quizProgress] = await Promise.all([
    getLearningProgress(student.id),
    getQuizProgress(student.id),
  ]);
  const roadmaps = learning.roadmapProgressList || [];
  const weakTopics = quizProgress.weakTopics || [];
  const strongTopics = quizProgress.strongTopics || [];

  const suggestions = [];
  const add = (severity, title, description) =>
    suggestions.push({ id: `s${suggestions.length + 1}`, severity, title, description });

  const prefs = student.doc?.preferences;
  const profileCompleteness = getProfileCompleteness(prefs);
  if (!profileCompleteness.isComplete) {
    add("info", "Complete your learning profile", `Add ${profileCompleteness.missingFields.map((field) => field.label).join(", ")} so roadmaps and quizzes can be tailored to you.`);
  }
  if (roadmaps.length === 0) {
    add("info", "Generate your first roadmap", "Open any role and tap “Generate AI Roadmap”, or create one from My Roadmaps.");
  }
  if (quizProgress.completedQuizzes === 0) {
    add("info", "Take your first quiz", "A short quiz shows which topics need work and unlocks personalised suggestions here.");
  }

  for (const t of weakTopics.slice(0, 3)) {
    add(
      t.averageScore < 50 ? "high" : "medium",
      `Revise ${t.topic}`,
      `You average ${t.averageScore}% across ${t.attempts} quiz${t.attempts > 1 ? "zes" : ""} on this topic. Review the basics in Resources, then retake a quiz.`
    );
  }

  const now = Date.now();
  for (const rm of roadmaps) {
    if (rm.isCompleted) continue;
    const updatedAt = rm.updatedAt ? new Date(rm.updatedAt).getTime() : now;
    const idleDays = Math.floor((now - updatedAt) / DAY_MS);
    if (idleDays >= STALE_DAYS) {
      add("medium", `Resume “${rm.title}”`, `No progress for ${idleDays} days. Pick the next topic and tick it off when done.`);
    }
  }

  if (roadmaps.length > 0 && roadmaps.every((r) => r.isCompleted)) {
    add("low", "All roadmaps completed", "Generate a roadmap for a more advanced role, or take an advanced quiz to test your depth.");
  }
  if (strongTopics.length > 0) {
    add("low", `Strong in ${strongTopics[0].topic}`, `${strongTopics[0].averageScore}% average. Try an advanced-difficulty quiz on it.`);
  }

  const order = { high: 0, medium: 1, low: 2, info: 3 };
  suggestions.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    profileComplete: profileCompleteness.isComplete,
    missingProfileFields: profileCompleteness.missingFields,
    quizzesTaken: quizProgress.completedQuizzes,
    averageScore: quizProgress.averageScore,
    weakTopics,
    strongTopics,
    suggestions,
  };
}
