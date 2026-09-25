import {
  generateQuiz,
  getUserQuizzes,
  getQuizById,
  submitQuiz,
  deleteQuiz,
} from "../services/quiz.service.js";

/**
 * POST /api/quizzes/generate
 */
export const generateQuizController = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    const quiz = await generateQuiz(req.user.userId, topic, difficulty);

    return res.status(201).json({
      success: true,
      message: "Quiz generated successfully",
      quiz,
    });
  } catch (error) {
    console.error("Error in generateQuizController:", error);

    // Handle AI quota / rate-limit errors cleanly
    if (
      error.status === 429 ||
      error.statusCode === 429 ||
      error.message?.includes("429") ||
      error.message?.includes("Too Many Requests") ||
      error.message?.includes("rate_limit")
    ) {
      return res.status(429).json({
        success: false,
        message: "AI service is temporarily unavailable due to rate limits. Please try again.",
      });
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * GET /api/quizzes
 */
export const getUserQuizzesController = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await getUserQuizzes(req.user.userId, page, limit);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in getUserQuizzesController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * GET /api/quizzes/:id
 */
export const getQuizByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await getQuizById(id, req.user.userId);
    return res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error) {
    console.error("Error in getQuizByIdController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * POST /api/quizzes/:id/submit
 */
export const submitQuizController = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "answers array is required",
      });
    }

    const quiz = await submitQuiz(id, req.user.userId, answers);

    return res.status(200).json({
      success: true,
      message: "Quiz submitted successfully",
      quiz,
    });
  } catch (error) {
    console.error("Error in submitQuizController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * DELETE /api/quizzes/:id
 */
export const deleteQuizController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteQuiz(id, req.user.userId);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in deleteQuizController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
