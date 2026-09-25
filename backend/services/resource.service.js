import Resource from "../models/Resource.js";

/**
 * Add a curated resource to the library.
 */
export const createResource = async (data) => {
  const resource = await Resource.create(data);
  return resource;
};

/**
 * Search resources for the global library (text search + filters).
 */
export const searchResources = async ({ query, technology, difficulty, page = 1, limit = 10 }) => {
  const filter = {};

  if (query) {
    filter.$text = { $search: query };
  }

  if (technology) {
    filter.technology = { $regex: new RegExp(`^${technology}$`, "i") };
  }

  if (difficulty && difficulty !== "all") {
    filter.difficulty = { $in: [difficulty, "all"] };
  }

  const skip = (page - 1) * limit;

  const resources = await Resource.find(filter)
    .sort(query ? { score: { $meta: "textScore" } } : { views: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Resource.countDocuments(filter);

  return {
    resources,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Core matching logic for AI Roadmaps.
 * Maps AI generated tags to curated MongoDB resources, taking user preferences into account.
 */
export const getRecommendedResources = async (technology, tags = [], difficulty = "all", learningStyle = "") => {
  if (!technology) return [];

  const filter = {
    technology: { $regex: new RegExp(`^${technology}$`, "i") },
  };

  if (tags && tags.length > 0) {
    filter.tags = { $in: tags.map((t) => new RegExp(t, "i")) };
  }

  if (difficulty && difficulty !== "all") {
    filter.difficulty = { $in: [difficulty, "all"] };
  }

  // Find matches
  let resources = await Resource.find(filter).limit(10); // Fetch a pool of matches

  // Custom sorting to prioritize user's learning style
  if (learningStyle) {
    resources.sort((a, b) => {
      let scoreA = a.views;
      let scoreB = b.views;

      // Boost score if type matches learning style
      if (learningStyle === "visual" && a.type === "video") scoreA += 10000;
      if (learningStyle === "reading" && (a.type === "article" || a.type === "documentation" || a.type === "book")) scoreA += 10000;
      if (learningStyle === "hands-on" && (a.type === "practice" || a.type === "github")) scoreA += 10000;

      if (learningStyle === "visual" && b.type === "video") scoreB += 10000;
      if (learningStyle === "reading" && (b.type === "article" || b.type === "documentation" || b.type === "book")) scoreB += 10000;
      if (learningStyle === "hands-on" && (b.type === "practice" || b.type === "github")) scoreB += 10000;

      return scoreB - scoreA;
    });
  } else {
    // Default to views
    resources.sort((a, b) => b.views - a.views);
  }

  return resources.slice(0, 3); // Return top 3
};

/**
 * Get a single resource by ID.
 */
export const getResourceById = async (id) => {
  const resource = await Resource.findById(id);
  if (!resource) {
    const error = new Error("Resource not found");
    error.statusCode = 404;
    throw error;
  }
  return resource;
};

/**
 * Increment view count for analytics.
 */
export const incrementViews = async (id) => {
  const resource = await Resource.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  );
  if (!resource) {
    const error = new Error("Resource not found");
    error.statusCode = 404;
    throw error;
  }
  return resource;
};

/**
 * Delete a resource (Admin).
 */
export const deleteResource = async (id) => {
  const resource = await Resource.findByIdAndDelete(id);
  if (!resource) {
    const error = new Error("Resource not found");
    error.statusCode = 404;
    throw error;
  }
  return { id, message: "Resource deleted successfully" };
};
