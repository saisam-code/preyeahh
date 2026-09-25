import AIRoadmap from "../models/AIRoadmap.js";
import Quiz from "../models/Quiz.js";

/**
 * Calculate user performance metrics per AI roadmap with quiz breakdown
 * and generate diagnostic suggestions on where to fix/focus.
 */
export const getUserPerformance = async (studentId) => {
  const [roadmaps, quizzes] = await Promise.all([
    AIRoadmap.find({ studentId }),
    Quiz.find({ studentId, isCompleted: true }),
  ]);

  if (roadmaps.length === 0 && quizzes.length === 0) {
    return {
      overallProgress: 0,
      totalTopics: 0,
      completedTopics: 0,
      topicBreakdown: [],
      quizBreakdown: [],
      suggestions: [
        {
          id: "no-data",
          type: "action",
          title: "Get started",
          description:
            "Generate your first AI roadmap for a role in your branch to start tracking performance.",
          severity: "info",
        },
      ],
    };
  }

  // ── Roadmap performance ───────────────────────────────────────
  let grandTotalTopics = 0;
  let grandCompletedTopics = 0;
  const weakTopics = [];

  const topicBreakdown = roadmaps.map((rm) => {
    let total = 0;
    let completed = 0;
    const incompleteList = [];

    if (Array.isArray(rm.sections)) {
      rm.sections.forEach((sec) => {
        if (Array.isArray(sec.topics)) {
          sec.topics.forEach((tp) => {
            total += 1;
            grandTotalTopics += 1;
            if (tp.isCompleted) {
              completed += 1;
              grandCompletedTopics += 1;
            } else {
              incompleteList.push({
                sectionTitle: sec.title,
                topicTitle: tp.title,
              });
            }
          });
        }
      });
    }

    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    let proficiency = "Needs Review";
    let statusColor = "red";
    if (pct >= 80) {
      proficiency = "Mastered";
      statusColor = "green";
    } else if (pct >= 40) {
      proficiency = "Moderate";
      statusColor = "amber";
    }

    if (pct < 60) {
      weakTopics.push({
        roadmapTitle: rm.title,
        roleTitle: rm.roleTitle,
        pct,
        incomplete: incompleteList.slice(0, 3),
      });
    }

    return {
      roadmapId: rm._id.toString(),
      title: rm.title,
      roleTitle: rm.roleTitle,
      branch: rm.branch,
      level: rm.level,
      totalTopics: total,
      completedTopics: completed,
      percentage: pct,
      proficiency,
      statusColor,
    };
  });

  // ── Quiz performance ──────────────────────────────────────────
  const quizBreakdown = quizzes.map((q) => ({
    quizId: q._id.toString(),
    title: q.title,
    topic: q.topic,
    branch: q.branch,
    difficulty: q.difficulty,
    score: q.score,
    grade:
      q.score >= 80 ? "Excellent" :
      q.score >= 60 ? "Good" :
      q.score >= 40 ? "Average" : "Needs Work",
  }));

  const avgQuizScore =
    quizzes.length > 0
      ? Math.round(quizzes.reduce((s, q) => s + q.score, 0) / quizzes.length)
      : 0;

  const overallProgress =
    grandTotalTopics > 0
      ? Math.round((grandCompletedTopics / grandTotalTopics) * 100)
      : 0;

  // ── Diagnostic suggestions ────────────────────────────────────
  const suggestions = [];

  weakTopics.forEach((wt) => {
    if (wt.incomplete.length > 0) {
      const slug = (wt.roleTitle || wt.roadmapTitle || "topic")
        .replace(/\s+/g, "-")
        .toLowerCase();
      suggestions.push({
        id: `fix-${slug}`,
        type: "weakness",
        title: `Complete topics in ${wt.roleTitle || wt.roadmapTitle}`,
        description: `You are at ${wt.pct}% on this roadmap. Next up: "${wt.incomplete[0].topicTitle}" under ${wt.incomplete[0].sectionTitle}.`,
        severity: wt.pct < 30 ? "high" : "medium",
      });
    }
  });

  if (avgQuizScore > 0 && avgQuizScore < 50) {
    suggestions.push({
      id: "quiz-low",
      type: "weakness",
      title: "Quiz scores need improvement",
      description: `Your average quiz score is ${avgQuizScore}%. Revisit topics and retake quizzes to improve retention.`,
      severity: "high",
    });
  }

  if (overallProgress >= 80) {
    suggestions.push({
      id: "mastery",
      type: "achievement",
      title: "Great progress!",
      description:
        "You have completed over 80% of your roadmaps. Consider generating an advanced roadmap.",
      severity: "low",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: "steady",
      type: "guidance",
      title: "Keep going",
      description: "Complete your next pending topic to boost your mastery score.",
      severity: "info",
    });
  }

  return {
    overallProgress,
    totalTopics: grandTotalTopics,
    completedTopics: grandCompletedTopics,
    remainingTopics: grandTotalTopics - grandCompletedTopics,
    avgQuizScore,
    topicBreakdown,
    quizBreakdown,
    suggestions,
  };
};
