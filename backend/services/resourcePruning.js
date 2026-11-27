import { calculateSourceRelevance, createKnownSkillSet, WHEEL_DOMAIN_SLUGS } from "./sourceRelevance.js";

export const PRUNE_REASONS = Object.freeze([
  "NOT_MAPPED",
  "NO_DOMAIN",
  "LOW_SCORE",
  "BAD_URL",
  "SPARSE_LIST",
  "DUPLICATE",
]);

export function stableSourceListMappedCount(persistedCount, observedCount) {
  return Math.max(Number(persistedCount) || 0, Number(observedCount) || 0);
}

export function repositoryMetadataIsComplete(status) {
  return /^checked \d+ repositories$/.test(String(status || ""));
}

export function canonicalResourceUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (/\.(?:avif|gif|jpe?g|png|svg|webp|ico|bmp|tiff?)(?:$)/i.test(url.pathname)) return null;
    if (url.hostname.toLowerCase() === "github.com" && /^\/sindresorhus\/awesome(?:\/|$)/i.test(url.pathname)) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function uniqueStrings(values) {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).reduce((result, value) => {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
    return result;
  }, []);
}

export function normalizeKeptResource(resource, score, url) {
  return {
    relatedDomains: [...new Set((resource.relatedDomains || []).filter((domain) => WHEEL_DOMAIN_SLUGS.has(domain)))],
    relatedRoles: uniqueStrings(resource.relatedRoles),
    relatedSkills: uniqueStrings(resource.relatedSkills),
    relatedTechnologies: uniqueStrings(resource.relatedTechnologies),
    tags: uniqueStrings(resource.tags),
    score,
    url,
  };
}

export function classifyImportedResource(resource, { skillSet = createKnownSkillSet(), minScore = 2 } = {}) {
  if (resource.importStatus !== "mapped") return { keep: false, reason: "NOT_MAPPED" };
  const relevance = calculateSourceRelevance(resource, skillSet);
  if (!relevance.relatedDomains.length) return { keep: false, reason: "NO_DOMAIN", score: relevance.score };
  if (relevance.score < minScore) return { keep: false, reason: "LOW_SCORE", score: relevance.score };
  const url = canonicalResourceUrl(resource.url);
  if (!url) return { keep: false, reason: "BAD_URL", score: relevance.score };
  return {
    keep: true,
    score: relevance.score,
    url,
    normalized: normalizeKeptResource(resource, relevance.score, url),
  };
}
