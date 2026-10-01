import Resource from "../models/Resource.js";
import ApiError from "../utils/ApiError.js";

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Resources with no branches listed apply to every branch. */
const branchFilter = (branch) =>
  branch ? { $or: [{ branches: branch.toUpperCase() }, { branches: { $size: 0 } }] } : {};

export async function createResource(data) {
  return Resource.create(data);
}

/** Library search: text query + technology / difficulty / branch filters, paginated. */
export async function searchResources({ query, technology, difficulty, branch, page = 1, limit = 12 } = {}) {
  const filter = { ...branchFilter(branch) };
  if (query) filter.$text = { $search: query };
  if (technology) filter.technology = technology.toLowerCase().trim();
  if (difficulty && difficulty !== "all") filter.difficulty = { $in: [difficulty, "all"] };

  const find = Resource.find(filter);
  if (query) find.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
  else find.sort({ views: -1, createdAt: -1 });

  const [items, total] = await Promise.all([
    find.skip((page - 1) * limit).limit(limit),
    Resource.countDocuments(filter),
  ]);
  return { items, meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) } };
}

const STYLE_BOOST = {
  visual: ["video"],
  reading: ["article", "documentation", "book"],
  "hands-on": ["practice", "github", "course"],
};

/**
 * Matches an AI-generated { technology, tags } search query to curated resources.
 * Ranks by learning-style fit, then by views. Returns the top 3.
 */
export async function getRecommendedResources({ technology, tags = [], difficulty = "all", learningStyle = "", branch = "" }) {
  if (!technology) return [];

  const filter = { technology: technology.toLowerCase().trim(), ...branchFilter(branch) };
  const cleanTags = (Array.isArray(tags) ? tags : []).map((t) => String(t).trim()).filter(Boolean);
  if (cleanTags.length) filter.tags = { $in: cleanTags.map((t) => new RegExp(escapeRegex(t), "i")) };
  if (difficulty && difficulty !== "all") filter.difficulty = { $in: [difficulty, "all"] };

  const pool = await Resource.find(filter).limit(20);
  const boosted = STYLE_BOOST[learningStyle] || [];
  const score = (r) => r.views + (boosted.includes(r.type) ? 10000 : 0);
  return pool.sort((a, b) => score(b) - score(a)).slice(0, 3);
}

/** Distinct technologies in the library — given to the roadmap prompt so AI queries actually match. */
export async function listTechnologies() {
  return Resource.distinct("technology");
}

export async function getResourceById(id) {
  const resource = await Resource.findById(id);
  if (!resource) throw ApiError.notFound("Resource not found");
  return resource;
}

export async function incrementViews(id) {
  const resource = await Resource.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
  if (!resource) throw ApiError.notFound("Resource not found");
  return resource;
}

export async function deleteResource(id) {
  const resource = await Resource.findByIdAndDelete(id);
  if (!resource) throw ApiError.notFound("Resource not found");
}
