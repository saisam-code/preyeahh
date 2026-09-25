import Roadmap from "../models/Roadmap.js";
import User from "../models/User.js";
import { getGroqClient, GROQ_MODEL } from "../config/groq.js";
import { buildRoadmapGenerationPrompt } from "../utils/prompts.js";
import { getRecommendedResources } from "./resource.service.js";

/**
 * Generate a new AI roadmap for a specific topic, tailored to user preferences.
 */
export const generateRoadmap = async (userId, topic) => {
  if (!topic || topic.trim().length === 0) {
    const error = new Error("Topic is required to generate a roadmap");
    error.statusCode = 400;
    throw error;
  }

  // 1. Fetch user preferences
  const user = await User.findById(userId).select("preferences");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const preferences = user.preferences || {};

  // 2. Call AI to generate roadmap JSON
  const groq = getGroqClient();
  const prompt = buildRoadmapGenerationPrompt(topic, preferences);

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3, // Slightly creative but structured
    max_tokens: 3000, // Roadmaps can be long
  });

  let roadmapData;
  try {
    roadmapData = JSON.parse(completion.choices[0]?.message?.content || "{}");
  } catch (err) {
    const error = new Error("AI failed to generate a valid roadmap. Please try again.");
    error.statusCode = 500;
    throw error;
  }

  // 3. Map AI-generated search queries to actual DB resources
  if (roadmapData.sections && Array.isArray(roadmapData.sections)) {
    for (const section of roadmapData.sections) {
      if (section.topics && Array.isArray(section.topics)) {
        for (const topicObj of section.topics) {
          if (topicObj.resources && Array.isArray(topicObj.resources)) {
            const mappedResources = [];
            for (const aiResource of topicObj.resources) {
              if (aiResource.searchQuery) {
                const { technology, tags } = aiResource.searchQuery;
                const difficulty = roadmapData.level || "beginner";
                const learningStyle = preferences.learningStyle || "";
                
                // Search MongoDB for matches
                const dbResources = await getRecommendedResources(technology, tags, difficulty, learningStyle);
                
                // If we found matches in the DB, use the top 1
                if (dbResources && dbResources.length > 0) {
                  const matched = dbResources[0];
                  mappedResources.push({
                    title: matched.title,
                    type: matched.type,
                    url: matched.url
                  });
                } else {
                  // Fallback if no DB resources exist for these tags:
                  // Save the AI generated resource to the DB for future curation
                  const aiTitle = aiResource.title || `Learn ${tags[0] || technology}`;
                  const aiType = aiResource.type || "article";
                  
                  try {
                    import("./resource.service.js").then(({ createResource }) => {
                      createResource({
                        title: aiTitle,
                        description: `AI suggested resource for ${technology}`,
                        type: aiType,
                        url: "", // Empty URL for curation
                        technology: technology,
                        category: roadmapData.topic || "",
                        tags: tags,
                        difficulty: difficulty,
                        isCurated: false
                      }).catch(err => console.error("Error saving unmapped AI resource:", err.message));
                    });
                  } catch (e) {
                     // ignore import errors here
                  }
                  
                  mappedResources.push({
                    title: aiTitle,
                    type: aiType,
                    url: "" 
                  });
                }
              }
            }
            topicObj.resources = mappedResources; // Overwrite with actual mapped resources
          }
        }
      }
    }
  }

  // 4. Save to database
  const roadmap = await Roadmap.create({
    userId,
    title: roadmapData.title || `Learning Path: ${topic}`,
    topic: roadmapData.topic || topic,
    description: roadmapData.description || "",
    level: roadmapData.level || "beginner",
    estimatedWeeks: roadmapData.estimatedWeeks || 4,
    sections: roadmapData.sections || [],
  });

  return roadmap;
};

/**
 * Get all roadmaps for a user with pagination.
 */
export const getUserRoadmaps = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const roadmaps = await Roadmap.find({ userId })
    .select("title topic level estimatedWeeks isCompleted createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
  const total = await Roadmap.countDocuments({ userId });

  return {
    roadmaps,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get a specific roadmap by ID (with full sections/topics).
 */
export const getRoadmapById = async (roadmapId, userId) => {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });
  if (!roadmap) {
    const error = new Error("Roadmap not found");
    error.statusCode = 404;
    throw error;
  }
  return roadmap;
};

/**
 * Update the progress (isCompleted) of a specific topic in a roadmap.
 */
export const updateTopicProgress = async (roadmapId, sectionId, topicId, isCompleted, userId) => {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });
  if (!roadmap) {
    const error = new Error("Roadmap not found");
    error.statusCode = 404;
    throw error;
  }

  let found = false;
  const targetIdStr = topicId ? topicId.toString().trim() : "";

  // Search and update in-memory for calculation
  for (const section of roadmap.sections) {
    for (const topic of section.topics) {
      const tId = topic._id ? topic._id.toString() : (topic.id || "");
      const tTitle = topic.title ? topic.title.trim().toLowerCase() : "";

      if (
        (tId && tId === targetIdStr) ||
        (tTitle && targetIdStr && tTitle === targetIdStr.toLowerCase())
      ) {
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

  let allDone = true;
  for (const section of roadmap.sections) {
    for (const topic of section.topics) {
      if (!topic.isCompleted) {
        allDone = false;
        break;
      }
    }
    if (!allDone) break;
  }
  roadmap.isCompleted = allDone;

  // Use findOneAndUpdate to explicitly bypass mongoose change tracking bugs
  // and force the entire sections array to be replaced with the updated one
  const updatedRoadmap = await Roadmap.findOneAndUpdate(
    { _id: roadmapId, userId },
    { 
      $set: { 
        sections: roadmap.sections,
        isCompleted: allDone
      } 
    },
    { new: true }
  );

  return updatedRoadmap;
};

/**
 * Delete a roadmap.
 */
export const deleteRoadmap = async (roadmapId, userId) => {
  const roadmap = await Roadmap.findOneAndDelete({ _id: roadmapId, userId });
  if (!roadmap) {
    const error = new Error("Roadmap not found");
    error.statusCode = 404;
    throw error;
  }
  return { id: roadmapId, message: "Roadmap deleted successfully" };
};
