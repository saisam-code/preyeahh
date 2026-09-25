const {
  generateAIRoadmap,
  getStudentRoadmaps,
  getRoadmapById,
  updateTopicProgress,
  deleteRoadmap,
} = require("../services/aiRoadmapService");

exports.generateRoadmapController = async (req, res, next) => {
  try {
    const { topic, roleId } = req.body;
    const roadmap = await generateAIRoadmap(req.user.id, { topic, roleId });
    return res.status(201).json({
      success: true,
      message: "Roadmap generated successfully",
      roadmap,
    });
  } catch (err) {
    if (
      err.status === 429 ||
      err.statusCode === 429 ||
      err.message?.includes("429") ||
      err.message?.includes("rate_limit") ||
      err.message?.includes("Too Many Requests")
    ) {
      return res.status(429).json({
        success: false,
        message: "AI service is temporarily unavailable. Please try again shortly.",
      });
    }
    next(err);
  }
};

exports.getStudentRoadmapsController = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await getStudentRoadmaps(req.user.id, page, limit);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getRoadmapByIdController = async (req, res, next) => {
  try {
    const roadmap = await getRoadmapById(req.params.id, req.user.id);
    return res.status(200).json({ success: true, roadmap });
  } catch (err) {
    next(err);
  }
};

exports.updateTopicProgressController = async (req, res, next) => {
  try {
    const { topicId, isCompleted } = req.body;

    if (!topicId || typeof isCompleted !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "topicId and isCompleted (boolean) are required",
      });
    }

    const roadmap = await updateTopicProgress(
      req.params.id,
      topicId,
      isCompleted,
      req.user.id
    );
    return res.status(200).json({
      success: true,
      message: "Progress updated successfully",
      roadmap,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteRoadmapController = async (req, res, next) => {
  try {
    const result = await deleteRoadmap(req.params.id, req.user.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};