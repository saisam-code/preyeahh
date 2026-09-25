import AIRoadmap from "../models/AIRoadmap.js";
import User from "../models/User.js";
import CareerRole from "../models/CareerRole.js";
import { getGroqClient, GROQ_MODEL } from "../config/groq.js";
import { buildAIRoadmapPrompt } from "../utils/aiPrompts.js";
import { getRecommendedResources } from "./resource.service.js";

/**
 * Generate AI roadmap
 * roleId is optional — if provided, pulls Role.guidance for context
 */
export const generateAIRoadmap = async (studentId, { topic, roleId }) => {
  if (!topic || topic.trim().length === 0) {
    const error = new Error("Topic is required to generate a roadmap");
    error.statusCode = 400;
    throw error;
  }

  const student = await User.findById(studentId).select("preferences branch");
  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  const preferences = student.preferences || {};
  const branch = student.branch || "";

  // Pull existing role guidance for richer context if roleId provided
  let roleGuidance = {};
  let roleTitle = topic.trim();
  let linkedRoleId = null;

  if (roleId) {
    const role = await CareerRole.findById(roleId);
    if (role) {
      roleGuidance = role.guidance || {};
      roleTitle = role.title;
      linkedRoleId = role._id;
    }
  }

  // Call Groq
  const groq = getGroqClient();
  const prompt = buildAIRoadmapPrompt(roleTitle, branch, roleGuidance, preferences);

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 3000,
  });

  let roadmapData;
  try {
    roadmapData = JSON.parse(completion.choices[0]?.message?.content || "{}");
  } catch {
    const error = new Error("AI failed to generate a valid roadmap. Please try again.");
    error.statusCode = 500;
    throw error;
  }

  // Map AI resource search queries to actual DB resources
  if (Array.isArray(roadmapData.sections)) {
    for (const section of roadmapData.sections) {
      if (Array.isArray(section.topics)) {
        for (const topicObj of section.topics) {
          if (Array.isArray(topicObj.resources)) {
            const mappedResources = [];
            for (const aiResource of topicObj.resources) {
              if (aiResource.searchQuery) {
                const { technology, tags } = aiResource.searchQuery;
                const difficulty = roadmapData.level || "beginner";
                const learningStyle = preferences.learningStyle || "";

                const dbResources = await getRecommendedResources(
                  technology,
                  tags,
                  difficulty,
                  learningStyle,
                  branch
                );

                if (dbResources && dbResources.length > 0) {
                  const matched = dbResources[0];
                  mappedResources.push({
                    title: matched.title,
                    type: matched.type,
                    url: matched.url,
                  });
                } else {
                  // Fallback — use AI suggested title but no URL
                  mappedResources.push({
                    title: aiResource.title || `Learn ${tags?.[0] || technology}`,
                    type: aiResource.type || "article",
                    url: "",
                  });
                }
              }
            }
            topicObj.resources = mappedResources;
          }
        }
      }
    }
  }

  // Save to DB
  const roadmap = await AIRoadmap.create({
    studentId,
    roleId: linkedRoleId,
    roleTitle,
    branch,
    title: roadmapData.title || `Learning Path: ${roleTitle}`,
    description: roadmapData.description || "",
    level: roadmapData.level || "beginner",
    estimatedWeeks: roadmapData.estimatedWeeks || 4,
    sections: roadmapData.sections || [],
  });

  return roadmap;
};

export const getStudentRoadmaps = async (studentId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const roadmaps = await AIRoadmap.find({ studentId })
    .select("title roleTitle branch level estimatedWeeks isCompleted createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await AIRoadmap.countDocuments({ studentId });

  return {
    roadmaps,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit),
  };
};

export const getRoadmapById = async (roadmapId, studentId) => {
  const roadmap = await AIRoadmap.findOne({ _id: roadmapId, studentId });
  if (!roadmap) {
    const error = new Error("Roadmap not found");
    error.statusCode = 404;
    throw error;
  }
  return roadmap;
};

export const updateTopicProgress = async (roadmapId, topicId, isCompleted, studentId) => {
  const roadmap = await AIRoadmap.findOne({ _id: roadmapId, studentId });
  if (!roadmap) {
    const error = new Error("Roadmap not found");
    error.statusCode = 404;
    throw error;
  }

  let found = false;
  for (const section of roadmap.sections) {
    for (const topic of section.topics) {
      const tId = topic._id ? topic._id.toString() : "";
      if (tId === topicId.toString()) {
        topic.isCompleted = Boolean(isCompleted);
        found = true;
        break;
      }
    }
    if (found) break;
  }

  if (!found) {
    const error = new Error("Topic not found in roadmap");
    error.statusCode = 404;
    throw error;
  }

  // Check if all topics done
  const allDone = roadmap.sections.every((s) =>
    s.topics.every((t) => t.isCompleted)
  );
  roadmap.isCompleted = allDone;

  const updated = await AIRoadmap.findOneAndUpdate(
    { _id: roadmapId, studentId },
    { $set: { sections: roadmap.sections, isCompleted: allDone } },
    { new: true }
  );

  return updated;
};

export const deleteRoadmap = async (roadmapId, studentId) => {
  const roadmap = await AIRoadmap.findOneAndDelete({ _id: roadmapId, studentId });
  if (!roadmap) {
    const error = new Error("Roadmap not found");
    error.statusCode = 404;
    throw error;
  }
  return { id: roadmapId, message: "Roadmap deleted successfully" };
};

export default {
  generateAIRoadmap,
  getStudentRoadmaps,
  getRoadmapById,
  updateTopicProgress,
  deleteRoadmap,
};