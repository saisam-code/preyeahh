import AIRoadmap from "../models/AIRoadmap.js";
import Quiz from "../models/Quiz.js";

/**
 * Compute detailed learning progress per AI roadmap and overall completion.
 */
export const getLearningProgress = async (studentId) => {
  const roadmaps = await AIRoadmap.find({ studentId }).sort({ updatedAt: -1 });

  if (!roadmaps || roadmaps.length === 0) {
    return {
      overallProgress: 0,
      totalRoadmaps: 0,
      completedRoadmaps: 0,
      totalTopics: 0,
      completedTopics: 0,
      roadmapProgressList: [],
    };
  }

  let totalTopicsGlobal = 0;
  let completedTopicsGlobal = 0;
  let completedRoadmapsCount = 0;

  const roadmapProgressList = roadmaps.map((rm) => {
    let rmTotalTopics = 0;
    let rmCompletedTopics = 0;

    if (Array.isArray(rm.sections)) {
      rm.sections.forEach((sec) => {
        if (Array.isArray(sec.topics)) {
          sec.topics.forEach((tp) => {
            rmTotalTopics += 1;
            totalTopicsGlobal += 1;
            if (tp.isCompleted) {
              rmCompletedTopics += 1;
              completedTopicsGlobal += 1;
            }
          });
        }
      });
    }

    const completionPercentage =
      rmTotalTopics > 0
        ? Math.round((rmCompletedTopics / rmTotalTopics) * 100)
        : 0;

    if (completionPercentage === 100) completedRoadmapsCount += 1;

    return {
      id: rm._id.toString(),
      title: rm.title,
      roleTitle: rm.roleTitle,
      branch: rm.branch,
      level: rm.level,
      estimatedWeeks: rm.estimatedWeeks,
      totalTopics: rmTotalTopics,
      completedTopics: rmCompletedTopics,
      completionPercentage,
      isCompleted: rm.isCompleted || completionPercentage === 100,
      updatedAt: rm.updatedAt,
    };
  });

  const overallProgress =
    totalTopicsGlobal > 0
      ? Math.round((completedTopicsGlobal / totalTopicsGlobal) * 100)
      : 0;

  return {
    overallProgress,
    totalRoadmaps: roadmaps.length,
    completedRoadmaps: completedRoadmapsCount,
    totalTopics: totalTopicsGlobal,
    completedTopics: completedTopicsGlobal,
    roadmapProgressList,
  };
};

/**
 * Compute quiz progress stats for the student.
 */
export const getQuizProgress = async (studentId) => {
  const quizzes = await Quiz.find({ studentId, isCompleted: true })
    .select("title topic branch roleTitle difficulty score createdAt")
    .sort({ createdAt: -1 });

  const total = await Quiz.countDocuments({ studentId });
  const completed = quizzes.length;

  const avgScore =
    completed > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / completed)
      : 0;

  return {
    totalQuizzes: total,
    completedQuizzes: completed,
    averageScore: avgScore,
    recentQuizzes: quizzes.slice(0, 5),
  };
};
