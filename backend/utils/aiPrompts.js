/**
 * Prompt builders for AI Roadmap and Career Guidance.
 */

export const buildAIRoadmapPrompt = (
  roleTitle,
  branch = "",
  roleGuidance = {},
  preferences = {}
) => {
  const level = preferences.experienceLevel || "beginner";
  const learningStyle = preferences.learningStyle || "hands-on";
  const knownSkills = Array.isArray(preferences.skills) ? preferences.skills.join(", ") : "";
  const guidanceSteps = Array.isArray(roleGuidance?.steps) ? roleGuidance.steps.join("; ") : "";
  const requiredSkills = Array.isArray(roleGuidance?.skills) ? roleGuidance.skills.join(", ") : "";

  return `You are an expert engineering career advisor and technical curriculum planner.
Generate a comprehensive, actionable learning roadmap for the career role "${roleTitle}"${branch ? ` in the ${branch} branch` : ""}.

Context:
- Academic Branch: ${branch || "Engineering"}
- Learner Level: ${level}
- Learning Style: ${learningStyle}
- Current Skills: ${knownSkills || "None specified"}
- Suggested Career Path Steps: ${guidanceSteps || "Standard industry path"}
- Target Skills Needed: ${requiredSkills || "Standard role skills"}

Generate a valid JSON object matching EXACTLY this structure:
{
  "title": "Learning Path for ${roleTitle}",
  "description": "Comprehensive step-by-step roadmap to become a ${roleTitle}",
  "level": "${level}",
  "estimatedWeeks": 6,
  "sections": [
    {
      "title": "1. Foundational Concepts",
      "description": "Core concepts and prerequisites required for this role",
      "topics": [
        {
          "title": "Topic Name",
          "description": "Specific concept, skill or tool to master",
          "resources": [
            {
              "title": "Learn Topic Name",
              "type": "video",
              "searchQuery": {
                "technology": "${roleTitle.toLowerCase()}",
                "tags": ["fundamentals", "basics"]
              }
            }
          ]
        }
      ]
    }
  ]
}

Ensure the response contains ONLY pure JSON with no markdown syntax.`;
};
