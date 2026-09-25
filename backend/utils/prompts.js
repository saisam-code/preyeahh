/**
 * Prompt generation utilities for AI features.
 */

export const buildRoadmapGenerationPrompt = (topic, preferences = {}) => {
  const level = preferences.experienceLevel || "beginner";
  const learningStyle = preferences.learningStyle || "hands-on";
  const skills = Array.isArray(preferences.skills) ? preferences.skills.join(", ") : "";

  return `You are an expert technical curriculum designer and career mentor.
Create a comprehensive, structured step-by-step learning roadmap for the following topic: "${topic}".

User Profile Context:
- Target Skill Level: ${level}
- Preferred Learning Style: ${learningStyle}
- Existing Skills: ${skills || "None specified"}

Generate a valid JSON object matching EXACTLY this structure:
{
  "title": "Clear roadmap title",
  "topic": "${topic}",
  "description": "2-3 sentence overview of this learning path",
  "level": "${level}",
  "estimatedWeeks": 4,
  "sections": [
    {
      "title": "Section Title (e.g. Fundamentals & Setup)",
      "description": "Brief description of what this section covers",
      "topics": [
        {
          "title": "Topic Title",
          "description": "What the student needs to learn and practice",
          "resources": [
            {
              "title": "Resource title",
              "type": "video",
              "searchQuery": {
                "technology": "${topic.toLowerCase()}",
                "tags": ["basics", "tutorial"]
              }
            }
          ]
        }
      ]
    }
  ]
}

Ensure the response contains ONLY pure JSON with no markdown formatting or markdown code blocks.`;
};

export const buildQuizGenerationPrompt = (topic, difficulty = "beginner", count = 5) => {
  return `You are an expert technical educator creating an assessment quiz.
Create a high-quality ${count}-question multiple choice quiz on "${topic}" at "${difficulty}" difficulty level.

Generate a valid JSON object matching EXACTLY this structure:
{
  "title": "Quiz on ${topic}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "questionText": "Clear question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation of why Option A is correct and why other options are wrong."
    }
  ]
}

Ensure the response contains ONLY pure JSON with no markdown formatting or markdown code blocks.`;
};

export const buildProfileExtractionPrompt = (text) => {
  return `Extract structured career and technical learning profile information from the user's input.

User description:
"${text}"

Return a valid JSON object with the following schema:
{
  "currentRole": "Student / Software Engineer / etc.",
  "targetRole": "Fullstack Developer / Data Scientist / etc.",
  "experienceLevel": "beginner",
  "goals": ["Goal 1", "Goal 2"],
  "skills": [{"name": "JavaScript", "level": "intermediate"}],
  "interests": ["Web Development", "AI"],
  "learningStyle": "hands-on",
  "weeklyHoursAvailable": 10,
  "preferredLanguage": "English",
  "aiProfileSummary": "A concise 2-sentence summary of this learner's profile and ambitions."
}

Ensure the response contains ONLY pure JSON.`;
};

export const buildPassiveExtractionPrompt = (messages, currentPreferences = {}) => {
  const messageHistory = messages
    .slice(-10)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  return `Analyze this recent chat conversation to detect any updated student learning preferences, target roles, or skills mentioned.

Current Preferences:
${JSON.stringify(currentPreferences, null, 2)}

Recent Conversation:
${messageHistory}

Return a valid JSON object containing any updated fields (or empty object {} if nothing changed):
{
  "targetRole": "string or null",
  "experienceLevel": "beginner | intermediate | advanced or null",
  "learningStyle": "visual | hands-on | reading or null",
  "goals": ["extracted new goals"],
  "skills": [{"name": "string", "level": "string"}],
  "interests": ["string"]
}

Ensure the response contains ONLY pure JSON.`;
};

export const buildChatContextPrompt = (topic = "", preferences = {}) => {
  const exp = preferences?.experienceLevel || "student";
  const style = preferences?.learningStyle || "practical";
  const target = preferences?.targetRole || "software engineer";

  return `You are Pre-Yeah AI, an intelligent, supportive, and highly knowledgeable career and engineering learning mentor.
Your goal is to guide students in mastering technical concepts, answering programming questions, preparing for placements, and building engineering skills.

Context:
- Current Topic: ${topic || "General Engineering & Career Guidance"}
- Student Target Role: ${target}
- Experience Level: ${exp}
- Learning Preference: ${style}

Guidelines:
1. Provide concise, clear, and actionable explanations with code snippets where helpful.
2. Adapt tone and complexity to the student's experience level.
3. Be encouraging, constructive, and accurate.`;
};

export const buildGroqMessages = (messages = [], systemPrompt = "") => {
  const groqMessages = [];
  if (systemPrompt) {
    groqMessages.push({ role: "system", content: systemPrompt });
  }

  const recent = messages.slice(-10);
  for (const m of recent) {
    groqMessages.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content || "",
    });
  }

  return groqMessages;
};
