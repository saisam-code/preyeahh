import Resource from "../models/Resource.js";
import SourceInventory from "../models/SourceInventory.js";
import ApiError from "../utils/ApiError.js";

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Resources with no branches listed apply to every branch. */
const branchFilter = (branch) =>
  branch ? { $or: [{ branches: branch.toUpperCase() }, { branches: { $size: 0 } }] } : {};

export async function createResource(data) {
  return Resource.create(data);
}

/** Library search: text query + mapping filters, paginated. */
export async function searchResources({
  query, technology, difficulty, branch, type, resourceType, category, role, skill, domain,
  sourceRepository, sourceCategory, page = 1, limit = 12,
} = {}) {
  const filter = { ...branchFilter(branch) };
  if (query) filter.$text = { $search: query };
  if (technology) filter.technology = technology.toLowerCase().trim();
  if (difficulty && difficulty !== "all") filter.difficulty = { $in: [difficulty, "all"] };
  if (type) filter.type = type;
  if (resourceType) filter.resourceType = resourceType;
  if (category) filter.category = new RegExp(escapeRegex(category.trim()), "i");
  if (role) filter.relatedRoles = new RegExp(escapeRegex(role.trim().toLowerCase()), "i");
  if (skill) filter.relatedSkills = new RegExp(escapeRegex(skill.trim().toLowerCase()), "i");
  if (domain) filter.relatedDomains = domain.trim().toLowerCase();
  if (sourceRepository) filter.sourceRepository = sourceRepository;
  if (sourceCategory) {
    const categoryPattern = new RegExp(escapeRegex(sourceCategory.trim()), "i");
    filter.$and = [{ $or: [{ sourceCategory: categoryPattern }, { sourceSubcategory: categoryPattern }] }];
  }

  const find = Resource.find(filter);
  if (query) find.select({ textScore: { $meta: "textScore" } }).sort({ textScore: { $meta: "textScore" } });
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
export async function getRecommendedResources({
  technology, tags = [], difficulty = "all", learningStyle = "", branch = "", role = "", skill = "",
} = {}) {
  if (!technology && !role && !skill) return [];

  const filter = { ...branchFilter(branch) };
  const relevance = [];
  if (technology) relevance.push({ technology: technology.toLowerCase().trim() });
  if (role) relevance.push({ relatedRoles: new RegExp(escapeRegex(role.trim().toLowerCase()), "i") });
  if (skill) relevance.push({ relatedSkills: new RegExp(escapeRegex(skill.trim().toLowerCase()), "i") });
  if (relevance.length === 1) Object.assign(filter, relevance[0]);
  else filter.$or = relevance;
  const cleanTags = (Array.isArray(tags) ? tags : []).map((t) => String(t).trim()).filter(Boolean);
  if (cleanTags.length) filter.tags = { $in: cleanTags.map((t) => new RegExp(escapeRegex(t), "i")) };
  if (difficulty && difficulty !== "all") filter.difficulty = { $in: [difficulty, "all"] };

  const pool = await Resource.find(filter).limit(20);
  const boosted = STYLE_BOOST[learningStyle] || [];
  const score = (r) => r.views + (boosted.includes(r.type) ? 10000 : 0);
  return pool.sort((a, b) => score(b) - score(a)).slice(0, 3);
}

export async function getResourceCoverage() {
  const [totalImported, totalDiscovered, statusCounts, repositoryStatuses, domains, roles, categoryStatuses] = await Promise.all([
    Resource.countDocuments({ sourceId: { $exists: true, $ne: "" } }),
    SourceInventory.countDocuments(),
    SourceInventory.aggregate([
      { $group: { _id: "$importStatus", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    SourceInventory.aggregate([
      { $group: { _id: { repository: "$sourceRepository", status: "$importStatus" }, count: { $sum: 1 } } },
      { $sort: { "_id.repository": 1, "_id.status": 1 } },
    ]),
    SourceInventory.aggregate([
      { $match: { importStatus: "mapped" } },
      { $unwind: "$relatedDomains" },
      { $group: { _id: "$relatedDomains", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    SourceInventory.aggregate([
      { $match: { importStatus: "mapped" } },
      { $unwind: "$relatedRoles" },
      { $group: { _id: "$relatedRoles", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    SourceInventory.aggregate([
      { $group: { _id: { repository: "$sourceRepository", category: "$sourceCategory", status: "$importStatus" }, count: { $sum: 1 } } },
      { $sort: { "_id.repository": 1, "_id.category": 1 } },
    ]),
  ]);
  const groupStatuses = (rows, getKey) => {
    const groups = new Map();
    for (const row of rows) {
      const key = getKey(row);
      groups.set(key, { ...(groups.get(key) || {}), [row._id.status]: row.count });
    }
    return [...groups.entries()].map(([key, counts]) => ({ key, ...counts }));
  };
  return {
    totalImported,
    totalDiscovered,
    statuses: Object.fromEntries(statusCounts.map(({ _id, count }) => [_id, count])),
    repositories: groupStatuses(repositoryStatuses, (row) => row._id.repository),
    domains,
    roles,
    categories: groupStatuses(categoryStatuses, (row) => `${row._id.repository} / ${row._id.category}`),
  };
}

export async function updateResource(id, data) {
  const resource = await Resource.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  if (!resource) throw ApiError.notFound("Resource not found");
  return resource;
}

/** Distinct technologies in the library — given to the roadmap prompt so AI queries actually match. */
export async function listTechnologies({ role = "", skills = [] } = {}) {
  const filter = {};
  const relevance = [];
  if (role) relevance.push({ relatedRoles: new RegExp(escapeRegex(role.trim().toLowerCase()), "i") });
  if (Array.isArray(skills) && skills.length) {
    relevance.push({ relatedSkills: { $in: skills.map((skill) => new RegExp(escapeRegex(String(skill).trim()), "i")) } });
  }
  if (relevance.length) filter.$or = relevance;
  const technologies = await Resource.distinct("technology", filter);
  return technologies.filter(Boolean).sort().slice(0, 100);
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
