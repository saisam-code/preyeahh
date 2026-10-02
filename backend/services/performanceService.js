import AIRoadmap from "../models/AIRoadmap.js";
import Quiz from "../models/Quiz.js";
import { getProfileCompleteness } from "../utils/profileCompleteness.js";

const STALE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Rule-based analysis of a student's quiz + roadmap activity.
 * Returns topic strengths/weaknesses and a prioritised list of suggestions
 * ({ id, severity: high|medium|low|info, title, description, action? }).
 */
export async function getPerformance(student) {
  const [quizzes, roadmaps] = await Promise.all([
    Quiz.find({ studentId: student.id, isCompleted: true }).select("topic score updatedAt"),
    AIRoadmap.find({ studentId: student.id }).select("title isCompleted updatedAt sections"),
  ]);

  // Average score per topic
  const byTopic = new Map();
  for (const q of quizzes) {
    const key = q.topic.trim().toLowerCase();
    const entry = byTopic.get(key) || { topic: q.topic.trim(), total: 0, attempts: 0 };
    entry.total += q.score;
    entry.attempts += 1;
    byTopic.set(key, entry);
  }
  const topics = [...byTopic.values()]
    .map((t) => ({ topic: t.topic, attempts: t.attempts, averageScore: Math.round(t.total / t.attempts) }))
    .sort((a, b) => a.averageScore - b.averageScore);

  const weakTopics = topics.filter((t) => t.averageScore < 70);
  const strongTopics = topics.filter((t) => t.averageScore >= 80).reverse();

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
  if (quizzes.length === 0) {
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
    const idleDays = Math.floor((now - rm.updatedAt.getTime()) / DAY_MS);
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
    quizzesTaken: quizzes.length,
    averageScore: quizzes.length ? Math.round(quizzes.reduce((s, q) => s + q.score, 0) / quizzes.length) : 0,
    weakTopics,
    strongTopics,
    suggestions,
  };
}
