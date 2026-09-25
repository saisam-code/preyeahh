import {
  createResource,
  searchResources,
  getRecommendedResources,
  getResourceById,
  incrementViews,
  deleteResource,
} from "../services/resource.service.js";

export const createResourceController = async (req, res, next) => {
  try {
    const resource = await createResource(req.body);
    return res.status(201).json({ success: true, message: "Resource added successfully", resource });
  } catch (err) {
    next(err);
  }
};

export const searchResourcesController = async (req, res, next) => {
  try {
    const { q, technology, branch, difficulty, page, limit } = req.query;
    const result = await searchResources({ query: q, technology, branch, difficulty, page, limit });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const recommendResourcesController = async (req, res, next) => {
  try {
    const { technology, tags, difficulty, learningStyle, branch } = req.body;

    if (!technology) {
      return res.status(400).json({ success: false, message: "technology is required" });
    }

    const resources = await getRecommendedResources(technology, tags, difficulty, learningStyle, branch);
    return res.status(200).json({ success: true, resources });
  } catch (err) {
    next(err);
  }
};

export const getResourceByIdController = async (req, res, next) => {
  try {
    const resource = await getResourceById(req.params.id);
    return res.status(200).json({ success: true, resource });
  } catch (err) {
    next(err);
  }
};

export const incrementViewsController = async (req, res, next) => {
  try {
    const resource = await incrementViews(req.params.id);
    return res.status(200).json({ success: true, resource });
  } catch (err) {
    next(err);
  }
};

export const deleteResourceController = async (req, res, next) => {
  try {
    const result = await deleteResource(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export default {
  createResourceController,
  searchResourcesController,
  recommendResourcesController,
  getResourceByIdController,
  incrementViewsController,
  deleteResourceController,
};