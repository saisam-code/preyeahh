import Roadmap from "../models/Roadmap.js";

/**
 * Calculate user performance metrics grouped by topic/technology
 * and generate diagnostic suggestions on where to fix/focus.
 */
export const getUserPerformance = async (userId) => {
  const roadmaps = await Roadmap.find({ userId });

  if (!roadmaps || roadmaps.length === 0) {
    return {
      overallProgress: 0,
      totalTopics: 0,
      completedTopics: 0,
      topicBreakdown: [],
      suggestions: [
        {
          id: "no-roadmap",
          type: "action",
          title: "Generate your first roadmap",
          description: "Create a learning roadmap to start tracking your performance and progress.",
          severity: "info",
        },
      ],
    };
  }

  let grandTotalTopics = 0;
  let grandCompletedTopics = 0;

  const topicPerformanceMap = {};
  const weakTopics = [];
  const pendingSections = [];

  // Iterate over all roadmaps and calculate section/topic performance
  roadmaps.forEach((rm) => {
    const rmTopic = rm.topic || rm.title || "General";
    
    if (!topicPerformanceMap[rmTopic]) {
      topicPerformanceMap[rmTopic] = {
        roadmapId: rm._id ? rm._id.toString() : (rm.id || ""),
        topic: rmTopic,
        level: rm.level || "beginner",
        totalTopics: 0,
        completedTopics: 0,
        sectionsCount: rm.sections?.length || 0,
        incompleteTopicsList: [],
      };
    }

    const entry = topicPerformanceMap[rmTopic];

    if (Array.isArray(rm.sections)) {
      rm.sections.forEach((section) => {
        if (Array.isArray(section.topics)) {
          section.topics.forEach((tp) => {
            entry.totalTopics += 1;
            grandTotalTopics += 1;

            const isDone = tp.isCompleted === true || tp.isCompleted === "true";
            if (isDone) {
              entry.completedTopics += 1;
              grandCompletedTopics += 1;
            } else {
              entry.incompleteTopicsList.push({
                sectionTitle: section.title || "Section",
                topicTitle: tp.title || "Topic",
                description: tp.description || "",
              });
            }
          });
        }
      });
    }
  });

  // Calculate percentages and proficiency status
  const topicBreakdown = Object.values(topicPerformanceMap).map((item) => {
    const pct = item.totalTopics > 0 ? Math.round((item.completedTopics / item.totalTopics) * 100) : 0;
    
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
        topic: item.topic,
        pct,
        incomplete: item.incompleteTopicsList.slice(0, 3),
      });
    }

    return {
      roadmapId: item.roadmapId,
      topic: item.topic,
      level: item.level,
      totalTopics: item.totalTopics,
      completedTopics: item.completedTopics,
      percentage: pct,
      proficiency,
      statusColor,
    };
  });

  const overallProgress = grandTotalTopics > 0 ? Math.round((grandCompletedTopics / grandTotalTopics) * 100) : 0;

  // Generate Diagnostic Fix Suggestions
  const suggestions = [];

  if (weakTopics.length > 0) {
    weakTopics.forEach((wt) => {
      if (wt.incomplete.length > 0) {
        const nextTopic = wt.incomplete[0];
        suggestions.push({
          id: `fix-${wt.topic.replace(/\s+/g, '-').toLowerCase()}`,
          type: "weakness",
          title: `Fix gap in ${wt.topic}`,
          description: `You are at ${wt.pct}% completion. Focus on "${nextTopic.topicTitle}" under ${nextTopic.sectionTitle} to strengthen this area.`,
          severity: wt.pct < 30 ? "high" : "medium",
          targetTopic: wt.topic,
          recommendedStep: nextTopic.topicTitle,
        });
      }
    });
  }

  if (overallProgress >= 80) {
    suggestions.push({
      id: "mastery-next",
      type: "achievement",
      title: "Great proficiency achieved!",
      description: "You've completed over 80% of your current roadmaps. Consider creating an advanced roadmap to test your skills.",
      severity: "low",
    });
  } else if (suggestions.length === 0) {
    suggestions.push({
      id: "steady-progress",
      type: "guidance",
      title: "Keep up the steady momentum",
      description: "Complete your next pending topic to boost your overall mastery score.",
      severity: "info",
    });
  }

  return {
    overallProgress,
    totalTopics: grandTotalTopics,
    completedTopics: grandCompletedTopics,
    remainingTopics: grandTotalTopics - grandCompletedTopics,
    topicBreakdown,
    suggestions,
  };
};
