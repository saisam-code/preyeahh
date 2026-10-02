import AIRoadmap from "../models/AIRoadmap.js";
import ApiError from "../utils/ApiError.js";
import { jsonCompletion } from "./groqService.js";
import { getRoleContext } from "./roleContextService.js";
import { getRecommendedResources, listTechnologies } from "./resourceService.js";
import { buildRoadmapPrompt } from "../utils/aiPrompts.js";

const LEVELS = ["beginner", "intermediate", "advanced"];
const RESOURCE_TYPES = ["video", "article", "course", "documentation", "book", "practice", "github"];

/** Replaces each AI "searchQuery" with a real library resource when one matches (title-only fallback otherwise). */
async function attachResources(sections, { level, learningStyle, branch }) {
  const cache = new Map();

  const lookup = async (q) => {
    const key = JSON.stringify([q.technology, q.tags]);
    if (!cache.has(key)) {
      cache.set(
        key,
        getRecommendedResources({ technology: q.technology, tags: q.tags, difficulty: level, learningStyle, branch })
      );
    }
    return cache.get(key);
  };

  for (const section of sections) {
    for (const topic of section.topics) {
      const mapped = [];
      for (const aiRes of topic.resources) {
        const matches = aiRes.searchQuery ? await lookup(aiRes.searchQuery) : [];
        if (matches.length) {
          mapped.push({ title: matches[0].title, type: matches[0].type, url: matches[0].url });
        } else {
          mapped.push({
            title: aiRes.title || `Learn ${topic.title}`,
            type: RESOURCE_TYPES.includes(aiRes.type) ? aiRes.type : "article",
            url: "",
          });
        }
      }
      topic.resources = mapped;
    }
  }
}

/** Coerces raw model output into something that always passes the AIRoadmap schema. */
function sanitizeSections(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s.title === "string")
    .map((s) => ({
      title: s.title,
      description: typeof s.description === "string" ? s.description : "",
      topics: (Array.isArray(s.topics) ? s.topics : [])
        .filter((t) => t && typeof t.title === "string")
        .map((t) => ({
          title: t.title,
          description: typeof t.description === "string" ? t.description : "",
          resources: (Array.isArray(t.resources) ? t.resources : []).filter((r) => r && typeof r === "object"),
        })),
    }))
    .filter((s) => s.topics.length > 0);
}

function cleanTextList(value, limit = 3) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim().slice(0, 280))
    .filter(Boolean)
    .slice(0, limit);
}

function sanitizeFitSnapshot(raw, { roleTitle, branch, level, preferences, roleGuidance }) {
  const whyThisFits = cleanTextList(raw?.whyThisFits);
  const alternatives = Array.isArray(raw?.whyNotAlternatives)
    ? raw.whyNotAlternatives
      .filter((item) => item && typeof item.path === "string" && typeof item.tradeoff === "string")
      .map((item) => ({ path: item.path.trim().slice(0, 100), tradeoff: item.tradeoff.trim().slice(0, 280) }))
      .filter((item) => item.path && item.tradeoff)
      .slice(0, 2)
    : [];

  const basedOn = cleanTextList(raw?.basedOn, 4);
  if (!whyThisFits.length) {
    whyThisFits.push(`This plan is organized around your selected ${roleTitle} goal${branch ? ` in ${branch}` : ""} and starts at the ${level} level.`);
    if (preferences.learningStyle) whyThisFits.push(`Its learning activities account for your ${preferences.learningStyle} learning preference.`);
    else if (roleGuidance.steps?.length) whyThisFits.push("It incorporates the mentor-curated steps for this role.");
  }

  if (!basedOn.length) {
    if (preferences.targetRole) basedOn.push(`Target role: ${preferences.targetRole}`);
    if (preferences.skills?.length) basedOn.push(`Recorded skills: ${preferences.skills.map((skill) => typeof skill === "string" ? skill : skill.name).filter(Boolean).slice(0, 4).join(", ")}`);
    if (preferences.weeklyHoursAvailable > 0) basedOn.push(`${preferences.weeklyHoursAvailable} study hours per week`);
    if (roleGuidance.steps?.length) basedOn.push("Mentor-curated role guidance");
  }

  return {
    whyThisFits: whyThisFits.slice(0, 3),
    whyNotAlternatives: alternatives,
    basedOn: basedOn.slice(0, 4),
  };
}

/**
 * Generates and stores a personalised roadmap.
 * With roleId: uses that Role's curated steps/skills as context and stores the link.
 * Without: `topic` is used as the role title.
 */
export async function generateAIRoadmap(student, { topic, roleId }) {
  const role = await getRoleContext(roleId);
  const roleTitle = role?.title || topic?.trim();
  if (!roleTitle) throw ApiError.badRequest("Provide a topic or a roleId");

  const branch = role?.branch || student.branch || "";
  const prefs = student.doc?.preferences?.toObject?.() ?? student.doc?.preferences ?? {};

  const prompt = buildRoadmapPrompt({
    roleTitle,
    branch,
    roleGuidance: { steps: role?.steps, skills: role?.skills },
    preferences: prefs,
    knownTechnologies: await listTechnologies(),
  });

  const data = await jsonCompletion(prompt, { temperature: 0.3, maxTokens: 3500 });

  const sections = sanitizeSections(data.sections);
  if (!sections.length) throw ApiError.internal("AI returned an empty roadmap. Please try again.");

  const level = LEVELS.includes(data.level) ? data.level : prefs.experienceLevel || "beginner";
  const fitSnapshot = sanitizeFitSnapshot(data.fitSnapshot, {
    roleTitle,
    branch,
    level,
    preferences: prefs,
    roleGuidance: { steps: role?.steps, skills: role?.skills },
  });
  await attachResources(sections, { level, learningStyle: prefs.learningStyle || "", branch });

  return AIRoadmap.create({
    studentId: student.id,
    roleId: role?.id || null,
    roleTitle,
    branch,
    title: typeof data.title === "string" && data.title ? data.title : `Learning Path: ${roleTitle}`,
    description: typeof data.description === "string" ? data.description : "",
    level,
    estimatedWeeks: Math.min(Math.max(parseInt(data.estimatedWeeks, 10) || 8, 1), 104),
    fitSnapshot,
    sections,
  });
}

export async function listRoadmaps(studentId, { page = 1, limit = 20 } = {}) {
  const filter = { studentId };
  const [items, total] = await Promise.all([
    // sections are needed by the list view to show per-roadmap progress bars
    AIRoadmap.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
    AIRoadmap.countDocuments(filter),
  ]);
  return { items, meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) } };
}

export async function getRoadmap(id, studentId) {
  const roadmap = await AIRoadmap.findOne({ _id: id, studentId });
  if (!roadmap) throw ApiError.notFound("Roadmap not found");
  return roadmap;
}

export async function setTopicCompleted(id, topicId, isCompleted, studentId) {
  const roadmap = await getRoadmap(id, studentId);

  let topic = null;
  for (const section of roadmap.sections) {
    topic = section.topics.id(topicId);
    if (topic) break;
  }
  if (!topic) throw ApiError.notFound("Topic not found in roadmap");

  topic.isCompleted = Boolean(isCompleted);
  roadmap.isCompleted = roadmap.sections.every((s) => s.topics.every((t) => t.isCompleted));
  await roadmap.save();
  return roadmap;
}

export async function deleteRoadmap(id, studentId) {
  const roadmap = await AIRoadmap.findOneAndDelete({ _id: id, studentId });
  if (!roadmap) throw ApiError.notFound("Roadmap not found");
}
