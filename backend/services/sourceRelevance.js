import { CAREER_CATALOG } from "../../shared/careerCatalog.js";
import { CAREER_DOMAIN_CATALOG } from "../../shared/careerDomainCatalog.js";

export const WHEEL_DOMAIN_SLUGS = new Set(CAREER_DOMAIN_CATALOG.map(({ slug }) => slug));
export const WHEEL_CAREER_NAMES = new Set(
  CAREER_CATALOG.flatMap(({ careers }) => careers.map(({ name }) => normalizeMatchValue(name)))
);

export function normalizeMatchValue(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function createKnownSkillSet(roleSkills = []) {
  return new Set([...roleSkills, ...WHEEL_CAREER_NAMES].map(normalizeMatchValue).filter(Boolean));
}

function offWheelTopic(item) {
  const context = [
    item.sourceCategory,
    item.sourceSubcategory,
    item.title,
    item.description,
    item.sourceListRepository,
    item.sourceListId,
  ].join(" ").toLowerCase();
  if (/\b(humou?r|jokes?|comedy|memes?)\b/.test(context)) return true;
  if (/\bmusic theory\b/.test(context)) return true;
  if (/\bpersonal[- ]wiki\b/.test(context)) return true;
  if (/\bawesome[- ]awesome\b|\bawesome meta[- ]lists?\b|\bawesome\b.{0,60}\bawesome\b/.test(context)) return true;
  if (/\b(games?|gaming)\b/.test(context)) {
    const mappedRoles = new Set((item.relatedRoles || []).map(normalizeMatchValue));
    if (!mappedRoles.has("game developer") && !mappedRoles.has("esports coach")) return true;
  }
  return false;
}

export function calculateSourceRelevance(item, skillSet = createKnownSkillSet()) {
  const domains = [...new Set((item.relatedDomains || []).filter((domain) => WHEEL_DOMAIN_SLUGS.has(domain)))];
  if (!domains.length) return { score: 0, relatedDomains: domains, reason: "NO_DOMAIN" };
  if (offWheelTopic(item)) return { score: 0, relatedDomains: domains, reason: "LOW_SCORE" };

  let score = (item.relatedRoles || []).some((role) => WHEEL_CAREER_NAMES.has(normalizeMatchValue(role))) ? 2 : 0;
  const matchedSkills = new Set(
    [...(item.relatedSkills || []), ...(item.relatedTechnologies || [])]
      .map(normalizeMatchValue)
      .filter((skill) => skillSet.has(skill))
  );
  score += Math.min(matchedSkills.size, 2);
  if (["tutorial", "documentation", "course"].includes(item.resourceType)) score += 1;
  if (item.sourceRepository === "codecrafters-io/build-your-own-x" && domains.includes("tech-eng")) score += 1;
  return { score, relatedDomains: domains, matchedSkills: [...matchedSkills], reason: "" };
}
