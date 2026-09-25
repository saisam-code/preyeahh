import Quiz from "../models/Quiz.js";
import User from "../models/User.js";
import { getGroqClient, GROQ_MODEL } from "../config/groq.js";
import { buildQuizGenerationPrompt } from "../utils/prompts.js";

/**
 * Generate a new AI quiz for a specific topic.
 */
export const generateQuiz = async (userId, topic, difficulty = "beginner") => {
  if (!topic || topic.trim().length === 0) {
    const error = new Error("Topic is required to generate a quiz");
    error.statusCode = 400;
    throw error;
  }

  // 1. Call AI to generate quiz JSON
  const groq = getGroqClient();
  const prompt = buildQuizGenerationPrompt(topic, difficulty, 5); // 5 questions by default

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 1500,
  });

  let quizData;
  try {
    quizData = JSON.parse(completion.choices[0]?.message?.content || "{}");
  } catch (err) {
    const error = new Error("AI failed to generate a valid quiz. Please try again.");
    error.statusCode = 500;
    throw error;
  }

  // Validate AI output
  if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    const error = new Error("AI returned an empty quiz. Please try again.");
    error.statusCode = 500;
    throw error;
  }

  // 2. Save to database
  const quiz = await Quiz.create({
    userId,
    title: quizData.title || `Quiz: ${topic}`,
    topic: quizData.topic || topic,
    difficulty: quizData.difficulty || difficulty,
    questions: quizData.questions,
  });

  // 3. Return the quiz WITHOUT correct answers so the client can't cheat easily
  // We'll strip them out before sending to the client, or we can just send the whole thing
  // Since it's a hackathon and everything is frontend rendered, we can send it all for simplicity,
  // but standard practice is to hide correct answers until submitted.
  // We will hide them for a cleaner architecture.
  
  const sanitizedQuestions = quiz.questions.map(q => ({
    id: q._id.toString(),
    questionText: q.questionText,
    options: q.options
  }));

  return {
    id: quiz._id.toString(),
    title: quiz.title,
    topic: quiz.topic,
    difficulty: quiz.difficulty,
    questions: sanitizedQuestions
  };
};

/**
 * Get all quizzes for a user.
 */
export const getUserQuizzes = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const quizzes = await Quiz.find({ userId })
    .select("title topic difficulty isCompleted score createdAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
  const total = await Quiz.countDocuments({ userId });

  return {
    quizzes,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get a specific quiz by ID (without correct answers if not completed).
 */
export const getQuizById = async (quizId, userId) => {
  const quiz = await Quiz.findOne({ _id: quizId, userId });
  if (!quiz) {
    const error = new Error("Quiz not found");
    error.statusCode = 404;
    throw error;
  }

  // If the quiz is already completed, return full details including answers
  if (quiz.isCompleted) {
    return quiz;
  }

  // Otherwise, sanitize the questions
  const sanitizedQuestions = quiz.questions.map(q => ({
    id: q._id.toString(),
    questionText: q.questionText,
    options: q.options
  }));

  return {
    id: quiz._id.toString(),
    title: quiz.title,
    topic: quiz.topic,
    difficulty: quiz.difficulty,
    isCompleted: quiz.isCompleted,
    questions: sanitizedQuestions
  };
};

/**
 * Submit answers for a quiz, compute score, and return results.
 */
export const submitQuiz = async (quizId, userId, userAnswers) => {
  const quiz = await Quiz.findOne({ _id: quizId, userId });
  if (!quiz) {
    const error = new Error("Quiz not found");
    error.statusCode = 404;
    throw error;
  }

  if (quiz.isCompleted) {
    const error = new Error("Quiz is already completed");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(userAnswers) || userAnswers.length !== quiz.questions.length) {
    const error = new Error(`You must provide exactly ${quiz.questions.length} answers`);
    error.statusCode = 400;
    throw error;
  }

  // Compute Score
  let score = 0;
  quiz.questions.forEach((q, index) => {
    // Exact string match against the correct answer
    if (q.correctAnswer === userAnswers[index]) {
      score += 1;
    }
  });

  // Calculate percentage
  const finalScore = Math.round((score / quiz.questions.length) * 100);

  // Update Quiz
  quiz.isCompleted = true;
  quiz.score = finalScore;
  quiz.userAnswers = userAnswers;
  
  await quiz.save();

  // Return the full graded quiz so the UI can show correct answers and explanations
  return quiz;
};

/**
 * Delete a quiz.
 */
export const deleteQuiz = async (quizId, userId) => {
  const quiz = await Quiz.findOneAndDelete({ _id: quizId, userId });
  if (!quiz) {
    const error = new Error("Quiz not found");
    error.statusCode = 404;
    throw error;
  }
  return { id: quizId, message: "Quiz deleted successfully" };
};
