import Roadmap from "../models/Roadmap.js";

/**
 * Compute detailed learning progress per roadmap and overall total completion.
 */
export const getLearningProgress = async (userId) => {
  const roadmaps = await Roadmap.find({ userId }).sort({ updatedAt: -1 });

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

            const isDone = tp.isCompleted === true || tp.isCompleted === "true";
            if (isDone) {
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

    if (completionPercentage === 100) {
      completedRoadmapsCount += 1;
    }

    return {
      id: rm._id ? rm._id.toString() : rm.id,
      title: rm.title || rm.topic || "Untitled Roadmap",
      topic: rm.topic || rm.title || "General",
      level: rm.level || "beginner",
      estimatedWeeks: rm.estimatedWeeks || 4,
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
