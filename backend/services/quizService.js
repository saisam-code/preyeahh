import Quiz from "../models/Quiz.js";
import ApiError from "../utils/ApiError.js";
import { jsonCompletion } from "./groqService.js";
import { getRoleContext } from "./roleContextService.js";
import { buildQuizPrompt } from "../utils/aiPrompts.js";

const LEVELS = ["beginner", "intermediate", "advanced"];
const QUESTION_COUNT = 5;

/** Drops malformed questions and guarantees correctAnswer is one of the options. */
function sanitizeQuestions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((q) => {
      const options = Array.isArray(q?.options) ? [...new Set(q.options.map((o) => String(o).trim()).filter(Boolean))] : [];
      const correctAnswer = typeof q?.correctAnswer === "string" ? q.correctAnswer.trim() : "";
      return {
        questionText: typeof q?.questionText === "string" ? q.questionText.trim() : "",
        options,
        correctAnswer,
        explanation: typeof q?.explanation === "string" ? q.explanation : "",
      };
    })
    .filter((q) => q.questionText && q.options.length >= 2 && q.options.includes(q.correctAnswer));
}

/** In-progress quizzes never expose correct answers or explanations. */
function toDto(quiz) {
  const base = {
    id: quiz._id.toString(),
    title: quiz.title,
    topic: quiz.topic,
    branch: quiz.branch,
    roleTitle: quiz.roleTitle,
    difficulty: quiz.difficulty,
    isCompleted: quiz.isCompleted,
    score: quiz.score,
    createdAt: quiz.createdAt,
  };

  if (quiz.isCompleted) {
    return {
      ...base,
      userAnswers: quiz.userAnswers,
      questions: quiz.questions.map((q) => ({
        id: q._id.toString(),
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    };
  }

  return {
    ...base,
    questions: quiz.questions.map((q) => ({ id: q._id.toString(), questionText: q.questionText, options: q.options })),
  };
}

async function findOwnedQuiz(id, studentId) {
  const quiz = await Quiz.findOne({ _id: id, studentId });
  if (!quiz) throw ApiError.notFound("Quiz not found");
  return quiz;
}

export async function generateQuiz(student, { topic, difficulty = "beginner", roleId }) {
  const role = await getRoleContext(roleId);
  const subject = topic?.trim() || role?.title;
  if (!subject) throw ApiError.badRequest("Provide a topic or a roleId");
  const level = LEVELS.includes(difficulty) ? difficulty : "beginner";
  const branch = role?.branch || student.branch || "";

  const data = await jsonCompletion(
    buildQuizPrompt({ topic: subject, difficulty: level, count: QUESTION_COUNT, branch, roleContext: role }),
    { temperature: 0.3, maxTokens: 2500 }
  );

  const questions = sanitizeQuestions(data.questions);
  if (!questions.length) throw ApiError.internal("AI returned an unusable quiz. Please try again.");

  const quiz = await Quiz.create({
    studentId: student.id,
    branch,
    roleTitle: role?.title || "",
    title: typeof data.title === "string" && data.title ? data.title : `Quiz: ${subject}`,
    topic: subject,
    difficulty: level,
    questions,
  });
  return toDto(quiz);
}

export async function listQuizzes(studentId, { page = 1, limit = 20 } = {}) {
  const filter = { studentId };
  const [quizzes, total] = await Promise.all([
    Quiz.find(filter)
      .select("title topic branch roleTitle difficulty isCompleted score createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Quiz.countDocuments(filter),
  ]);
  return {
    items: quizzes.map((q) => ({
      id: q._id.toString(),
      title: q.title,
      topic: q.topic,
      branch: q.branch,
      roleTitle: q.roleTitle,
      difficulty: q.difficulty,
      isCompleted: q.isCompleted,
      score: q.score,
      createdAt: q.createdAt,
    })),
    meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
}

export async function getQuiz(id, studentId) {
  return toDto(await findOwnedQuiz(id, studentId));
}

export async function submitQuiz(id, studentId, answers) {
  const quiz = await findOwnedQuiz(id, studentId);
  if (quiz.isCompleted) throw ApiError.badRequest("Quiz is already completed");
  if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
    throw ApiError.badRequest(`You must provide exactly ${quiz.questions.length} answers`);
  }

  const correct = quiz.questions.reduce((n, q, i) => n + (q.correctAnswer === answers[i] ? 1 : 0), 0);
  quiz.score = Math.round((correct / quiz.questions.length) * 100);
  quiz.userAnswers = answers.map(String);
  quiz.isCompleted = true;
  await quiz.save();
  return toDto(quiz);
}

export async function deleteQuiz(id, studentId) {
  const quiz = await Quiz.findOneAndDelete({ _id: id, studentId });
  if (!quiz) throw ApiError.notFound("Quiz not found");
}
