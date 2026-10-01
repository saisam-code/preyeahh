/**
 * Prompt builders for every AI feature: chat, roadmap, quiz and profile extraction.
 * All builders are pure functions (no DB / network access).
 */

const list = (arr, fallback) => (Array.isArray(arr) && arr.length ? arr.join(", ") : fallback);
const skillNames = (skills) =>
  Array.isArray(skills) ? skills.map((s) => (typeof s === "string" ? s : s?.name)).filter(Boolean) : [];

// ── Chat ─────────────────────────────────────────────────────────

export function buildChatContextPrompt({ topic = "", branch = "", roleContext = null, preferences = {} } = {}) {
  const level = preferences.experienceLevel || "beginner";
  const style = preferences.learningStyle || "practical";
  const target = preferences.targetRole || roleContext?.title || "not specified";
  const known = list(skillNames(preferences.skills), "none listed");

  const roleBlock = roleContext
    ? `\n- Role Being Explored: ${roleContext.title}${roleContext.overview ? ` — ${roleContext.overview}` : ""}` +
      `\n- Key Skills For That Role: ${list(roleContext.skills, "not listed")}`
    : "";

  return `You are Pre-Yeah AI, a supportive and knowledgeable career and engineering learning mentor for college students.
Guide students in mastering technical concepts, answering programming questions, preparing for placements and building engineering skills.

Student context:
- Academic Branch: ${branch || "not specified"}
- Current Topic: ${topic || "General engineering & career guidance"}
- Target Role: ${target}
- Experience Level: ${level}
- Learning Preference: ${style}
- Known Skills: ${known}${roleBlock}

Guidelines:
1. Keep answers concise, clear and actionable; include code snippets when they help.
2. Adapt depth and tone to the student's experience level.
3. Relate advice to their branch (${branch || "engineering"}) and target role when relevant.
4. Be encouraging and accurate. If unsure, say so instead of guessing.`;
}

/** [system, ...last N history messages] in the shape the Groq SDK expects. */
export function buildGroqMessages(history = [], systemPrompt = "", limit = 10) {
  const out = systemPrompt ? [{ role: "system", content: systemPrompt }] : [];
  for (const m of history.slice(-limit)) {
    out.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content || "" });
  }
  return out;
}

// ── AI Roadmap ───────────────────────────────────────────────────

export function buildRoadmapPrompt({
  roleTitle,
  branch = "",
  roleGuidance = {},
  preferences = {},
  knownTechnologies = [],
}) {
  const level = preferences.experienceLevel || "beginner";
  const style = preferences.learningStyle || "hands-on";
  const known = list(skillNames(preferences.skills), "None specified");
  const steps = list(roleGuidance.steps, "Standard industry path");
  const required = list(roleGuidance.skills, "Standard role skills");
  const weekly = preferences.weeklyHoursAvailable > 0 ? `${preferences.weeklyHoursAvailable} hours/week` : "not specified";
  const techHint = knownTechnologies.length
    ? `\nFor each resource "searchQuery.technology", choose ONE value from this list when a match exists: ${knownTechnologies.join(", ")}.`
    : "";

  return `You are an expert engineering career advisor and curriculum planner.
Create an actionable learning roadmap for the role "${roleTitle}"${branch ? ` for a ${branch} student` : ""}.

Context:
- Academic Branch: ${branch || "Engineering"}
- Learner Level: ${level}
- Learning Style: ${style}
- Weekly Time Available: ${weekly}
- Current Skills: ${known}
- Suggested Path Steps (curated by mentors): ${steps}
- Skills This Role Needs: ${required}

Return ONLY a JSON object with exactly this shape (3-5 sections, 2-4 topics each):
{
  "title": "Learning Path for ${roleTitle}",
  "description": "2-3 sentence overview",
  "level": "beginner | intermediate | advanced",
  "estimatedWeeks": 8,
  "sections": [
    {
      "title": "1. Foundations",
      "description": "What this section covers",
      "topics": [
        {
          "title": "Topic name",
          "description": "What to learn and practise",
          "resources": [
            {
              "title": "Resource title",
              "type": "video | article | documentation | course | book | practice | github",
              "searchQuery": { "technology": "lowercase technology name", "tags": ["tag1", "tag2"] }
            }
          ]
        }
      ]
    }
  ]
}${techHint}
Do not include markdown or any text outside the JSON.`;
}

// ── Quiz ─────────────────────────────────────────────────────────

export function buildQuizPrompt({ topic, difficulty = "beginner", count = 5, branch = "", roleContext = null }) {
  const ctx = [
    branch && `The learner studies ${branch} engineering.`,
    roleContext?.title && `They are exploring the role "${roleContext.title}".`,
    roleContext?.skills?.length && `Relevant skills: ${roleContext.skills.join(", ")}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return `You are an expert technical educator writing an assessment.
Write a ${count}-question multiple-choice quiz on "${topic}" at ${difficulty} difficulty. ${ctx}

Rules:
- Exactly 4 options per question; exactly one is correct.
- "correctAnswer" must be copied verbatim from "options".
- "explanation" says why the answer is right and briefly why the others are wrong.

Return ONLY this JSON:
{
  "title": "Quiz on ${topic}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    { "questionText": "…?", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "…" }
  ]
}`;
}

// ── Profile extraction ───────────────────────────────────────────

const PROFILE_SCHEMA = `{
  "currentRole": "e.g. Student",
  "targetRole": "e.g. Data Scientist",
  "experienceLevel": "beginner | intermediate | advanced",
  "goals": ["goal"],
  "skills": [{ "name": "JavaScript", "level": "beginner | intermediate | advanced" }],
  "interests": ["interest"],
  "learningStyle": "visual | hands-on | reading",
  "weeklyHoursAvailable": 10,
  "preferredLanguage": "English",
  "aiProfileSummary": "2-sentence summary of the learner and their ambitions"
}`;

/** Free-text description -> structured profile (POST /students/profile/extract). */
export function buildProfileExtractionPrompt(text, branch = "") {
  return `Extract a structured career/learning profile from the student's own description.
${branch ? `The student's academic branch is ${branch}.\n` : ""}
Description:
"""
${text}
"""

Return ONLY a JSON object shaped like the one below. Omit any key you cannot infer — do not invent values.
${PROFILE_SCHEMA}`;
}

/** Recent chat -> only the fields that changed (fire-and-forget after every N messages). */
export function buildPassiveExtractionPrompt(messages = [], currentPreferences = {}) {
  const transcript = messages
    .slice(-10)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  return `Read this recent conversation and detect NEW or UPDATED facts about the student's learning profile.

Current profile:
${JSON.stringify(currentPreferences, null, 2)}

Conversation:
${transcript}

Return ONLY a JSON object containing the fields that changed or were newly learned (empty object {} if nothing).
Allowed keys and shapes:
${PROFILE_SCHEMA}`;
}
