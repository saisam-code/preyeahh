import AIRoadmap from "../models/AIRoadmap.js";
import Quiz from "../models/Quiz.js";

const countTopics = (roadmap) => {
  let total = 0;
  let done = 0;
  for (const s of roadmap.sections) {
    for (const t of s.topics) {
      total += 1;
      if (t.isCompleted) done += 1;
    }
  }
  return { total, done };
};

/** Per-roadmap and overall topic completion for a student. */
export async function getLearningProgress(studentId) {
  const roadmaps = await AIRoadmap.find({ studentId }).sort({ updatedAt: -1 });

  let totalTopics = 0;
  let completedTopics = 0;
  let completedRoadmaps = 0;

  const roadmapProgressList = roadmaps.map((rm) => {
    const { total, done } = countTopics(rm);
    totalTopics += total;
    completedTopics += done;
    const completionPercentage = total > 0 ? Math.round((done / total) * 100) : 0;
    if (total > 0 && done === total) completedRoadmaps += 1;
    return {
      id: rm._id.toString(),
      title: rm.title,
      roleTitle: rm.roleTitle,
      branch: rm.branch,
      level: rm.level,
      estimatedWeeks: rm.estimatedWeeks,
      totalTopics: total,
      completedTopics: done,
      completionPercentage,
      isCompleted: total > 0 && done === total,
      updatedAt: rm.updatedAt,
    };
  });

  return {
    overallProgress: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
    totalRoadmaps: roadmaps.length,
    completedRoadmaps,
    totalTopics,
    completedTopics,
    roadmapProgressList,
  };
}

/** Quiz totals, average score and the 5 most recent attempts (Phase 3.8: combines TTL quizzes with permanent QuizResult records). */
export async function getQuizProgress(studentId) {
  let permanentResults = [];
  try {
    const QuizResult = (await import("../models/QuizResult.js")).default;
    permanentResults = await QuizResult.find({ studentId }).sort({ completedAt: -1 });
  } catch {
    /* fallback to active quizzes only */
  }

  const [completedQuizzes, totalQuizzes] = await Promise.all([
    Quiz.find({ studentId, isCompleted: true })
      .select("title topic branch roleTitle difficulty score updatedAt")
      .sort({ updatedAt: -1 }),
    Quiz.countDocuments({ studentId }),
  ]);

  const combined = [...completedQuizzes];
  const existingIds = new Set(completedQuizzes.map((q) => q._id.toString()));
  for (const r of permanentResults) {
    if (!r.quizId || !existingIds.has(r.quizId.toString())) {
      combined.push({
        _id: r._id,
        title: r.title,
        topic: r.topic,
        difficulty: r.difficulty,
        score: r.score,
        updatedAt: r.completedAt,
      });
    }
  }

  const averageScore = combined.length
    ? Math.round(combined.reduce((sum, q) => sum + q.score, 0) / combined.length)
    : 0;

  return {
    totalQuizzes: Math.max(totalQuizzes, combined.length),
    completedQuizzes: combined.length,
    averageScore,
    recentQuizzes: combined.slice(0, 5).map((q) => ({
      id: q._id.toString(),
      title: q.title,
      topic: q.topic,
      difficulty: q.difficulty,
      score: q.score,
      completedAt: q.updatedAt,
    })),
  };
}
