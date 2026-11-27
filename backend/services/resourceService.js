import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";

export async function createResource(data) {
  return mongoose.model("Resource").create(data);
}

export async function searchResources({
  query,
  difficulty,
  branch,
  type,
  role,
  domain,
  page = 1,
  limit = 12,
} = {}) {
  const Resource = mongoose.model("Resource");
  const filter = { isActive: true };
  if (query) filter.$text = { $search: query };
  if (difficulty && difficulty !== "all") filter.difficulty = { $in: [difficulty, "all"] };
  if (type) filter.type = type;
  if (mongoose.isValidObjectId(role)) filter.roleIds = role;
  if (mongoose.isValidObjectId(domain)) filter.domainIds = domain;

  const find = Resource.find(filter);
  if (query) find.select({ textScore: { $meta: "textScore" } }).sort({ textScore: { $meta: "textScore" } });
  else find.sort({ title: 1 });

  const [items, total] = await Promise.all([
    find.skip((page - 1) * limit).limit(limit),
    Resource.countDocuments(filter),
  ]);
  return { items, meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) } };
}

export async function getRecommendedResources({ role = "", skill = "", learningStyle = "" } = {}) {
  if (!role && !skill) return [];
  const Resource = mongoose.model("Resource");
  const filter = { isActive: true };
  if (mongoose.isValidObjectId(role)) filter.roleIds = role;
  if (skill) filter.skills = { $in: [skill] };
  const pool = await Resource.find(filter).limit(20).lean();
  const styleTypes = {
    visual: ["video"],
    reading: ["article", "documentation", "book"],
    "hands-on": ["practice", "github", "course"],
  };
  const preferred = styleTypes[learningStyle] || [];
  return pool
    .sort((a, b) => (preferred.includes(b.type) ? 1 : 0) - (preferred.includes(a.type) ? 1 : 0))
    .slice(0, 3);
}

export async function getResourceCoverage() {
  const Resource = mongoose.model("Resource");
  return { totalImported: 0, totalDiscovered: await Resource.countDocuments(), statuses: {}, repositories: [], domains: [], roles: [], categories: [] };
}

export async function updateResource(id, data) {
  const Resource = mongoose.model("Resource");
  const resource = await Resource.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  if (!resource) throw ApiError.notFound("Resource not found");
  return resource;
}

export async function listTechnologies({ role = "", skills = [] } = {}) {
  const Resource = mongoose.model("Resource");
  const filter = {};
  if (mongoose.isValidObjectId(role)) filter.roleIds = role;
  if (Array.isArray(skills) && skills.length) filter.skills = { $in: skills };
  return (await Resource.distinct("skills", filter)).filter(Boolean).sort().slice(0, 100);
}

export async function getResourceById(id) {
  const resource = await mongoose.model("Resource").findById(id);
  if (!resource) throw ApiError.notFound("Resource not found");
  return resource;
}

export async function incrementViews(id) {
  return mongoose.model("Resource").findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
}

export async function deleteResource(id) {
  const resource = await mongoose.model("Resource").findByIdAndDelete(id);
  if (!resource) throw ApiError.notFound("Resource not found");
}
