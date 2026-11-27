import { createHash } from "node:crypto";
import { calculateSourceRelevance, createKnownSkillSet } from "./sourceRelevance.js";

const DOMAIN_RULES = [
  ["med-health", /\b(medical|medicine|health|clinical|nursing|pharma|patient|biomedical|mental health|bioinformatics|parasite)\b/i],
  ["arts-media", /\b(art|design|creative|film|cinema|animation|music|audio|media|photograph|typography|illustration|radio|visualization|colorful|framer|translat\w*|i18n|l10n)\b/i],
  ["business-ent", /\b(business|entrepreneur|startup|finance|marketing|sales|product management|accounting|economics|venture|analytics|trading|credit modeling|amazon[- ]sellers?|payment processors?|discount|commerce|advertis|adtech|ads?|fintech|crypto currency|coinmarketcap)\b/i],
  ["science-res", /\b(science|research|physics|chemistry|biology|astronomy|mathematics|quantum|genetics|geology|statistics|scientific|computational geometry|hpc|astrophotography|connectivity data|cytodata|biological image|biological[- ]visualiz\w*|markov|urban planning|regional planning|transportation|transit|gtfs|geospatial|gis|mobility|cheminformatics)\b/i],
  ["government-careers", /\b(government (?:career|jobs?|exam|service|services)|civil services?|civil servant|public administration|public sector|upsc|ssc|state psc|public service commission|government recruitment)\b/i],
  ["edu-psych", /\b(education|teaching|learning|psychology|cognitive|pedagogy|curriculum|student|instructional design|educational research|school psychology|behavioral science|career counselling)\b/i],
  ["sports-fit", /\b(sport|fitness|athletic|coaching|exercise|biomechanics)\b/i],
  ["agri-env", /\b(agri\w*|environmental science|climate|ecolog\w*|conservation|sustainab\w*|wildlife|forestry|renewable energy|vegan\w*|food|earth)\b/i],
  ["trades-voc", /\b(trade|vocational|manufactur|mechanical|automotive|construction|welding|carpentry|cad|industrial)\b/i],
  ["aviation-def", /\b(aviation|aerospace|aircraft|flight|defen[cs]e|military|drone|uav)\b/i],
  ["emerging-unconv", /\b(gaming|game development|esports|blockchain|cryptocurrency|crypto currency|web3|virtual reality|augmented reality|metaverse|pok[eé]mon|geocaching|steam|webxr)\b/i],
  ["tech-eng", /\b(software|programming|developer|computer|technology|engineering|code|database|cloud|network|security|hardware|robotics|internet of things|iot|python|javascript|typescript|rust|golang|java|kotlin|swift|react|node\.js|linux|android|ios|web|api|json|geojson|csv|rest|graphql|microservices|ci\/cd|continuous integration|markdown|latex|tikz|dtrace|userscripts|regex|wp-cli|magento|prometheus|open source|self hosted|container|developer tool|cms|content management|decentralized|ethereum|cosmos|openstreetmap|gulp|unicode|bots?|homematic|calculators?|captcha|stacks|chatgpt|whisper|gemini|permacomputing|boilerplate|production app|framer|foss|vulkan|directx|opengl|graphics|rendering|shader|mqtt|ansible|chatops|quarto|jupyter|sap commerce|prisma|irc|standards|cheminformatics|katas?|algorithms?|coding challenge|webxr|scriptable|vorpal|event[- ]driven|orchestration|choreography|inspectit|opentracing|observability|ledger|bitcoin payment processors?|awesome-naming)\b/i],
];

const DIRECTORY_DOMAINS = [
  ["tech-eng", /^(platforms|programming languages|front-end development|back-end development|computer science|big data|theory|editors|development environment|databases|networking|testing|hardware|security|content management systems|decentralized systems|related)$/i],
  ["arts-media", /^(entertainment|media)$/i],
  ["edu-psych", /^(learn|books)$/i],
  ["business-ent", /^(business|work|events)$/i],
  ["med-health", /^(health and social science)$/i],
  ["emerging-unconv", /^(gaming)$/i],
];

const ROLE_RULES = [
  ["ai / ml specialist", /\b(ai|artificial intelligence|machine learning|deep learning|llm|neural network)\b/i],
  ["cybersecurity analyst", /\b(security|cybersecurity|cryptography|penetration test)\b/i],
  ["data scientist", /\b(data science|statistics|analytics|visualization)\b/i],
  ["data engineer", /\b(data engineer|big data|data pipeline|etl)\b/i],
  ["cloud architect", /\b(cloud|aws|azure|gcp|kubernetes|devops)\b/i],
  ["software engineer", /\b(programming|software|database|backend|frontend|web development|api|framework|language|algorithm|graphics|vulkan|opengl|shader|mqtt|ansible|chatops|quarto|jupyter|prisma|scriptable|vorpal|event[- ]driven|inspectit|opentracing|observability|dev[- ]fun|awesome4girls|awesome-naming)\b/i],
  ["robotics engineer", /\b(robot|embedded|microcontroller|iot|hardware)\b/i],
  ["game developer", /\b(game|gaming|graphics|renderer|physics engine)\b/i],
  ["ui/ux designer", /\b(ui|ux|design system|user experience|interface design)\b/i],
  ["graphic designer", /\b(graphic design|illustration|typography|visual design)\b/i],
  ["business analyst", /\b(business|economics|market research|process|amazon seller|payment processor|finance|advertising|commerce)\b/i],
  ["product manager", /\b(product management|product design|startup|product strategy)\b/i],
  ["environmental scientist", /\b(climate|ecolog\w*|conservation|sustainab\w*|wildlife|forestry|renewable energy|habitat|ecosystem)\b/i],
  ["aerospace systems engineer", /\b(aviation|aerospace|aircraft|flight|drone|uav)\b/i],
  ["instructional designer", /\b(education|teaching|learning|curriculum|pedagogy)\b/i],
];

function cleanMarkdown(value = "") {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function canonicalHttpUrl(value) {
  try {
    const target = String(value || "").trim().replace(/^<|>$/g, "");
    const normalized = target.startsWith("//")
      ? `https:${target}`
      : /^(?:www\.)?[a-z\d][a-z\d.-]*\.[a-z]{2,}(?::\d+)?(?:[/?#]|$)/i.test(target)
        ? `https://${target}`
        : target;
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function resourceUrl(value, baseUrl) {
  const target = String(value || "").trim().replace(/^<|>$/g, "");
  const directUrl = canonicalHttpUrl(target);
  if (directUrl) return directUrl;
  if (!baseUrl || !/\.(?:md|pdf|html?|txt|csv|json|ya?ml)(?:[?#].*)?$/i.test(target)) return "";
  try {
    return canonicalHttpUrl(new URL(target, baseUrl).toString());
  } catch {
    return "";
  }
}

function sourceId(repository, url) {
  const digest = createHash("sha256").update(url).digest("hex").slice(0, 24);
  return `${repository}:${digest}`;
}

export function applySourceRelevance(items, { roleSkills = [], minScore = 2 } = {}) {
  const knownSkills = createKnownSkillSet(roleSkills);

  return items.map((item) => {
    const relevance = calculateSourceRelevance(item, knownSkills);
    const output = { ...item, relatedDomains: relevance.relatedDomains, score: relevance.score };
    if (item.importStatus !== "mapped") return output;
    if (relevance.reason) {
      output.importStatus = "excluded";
      output.exclusionReason = relevance.reason;
      return output;
    }
    if (relevance.score < minScore) {
      output.importStatus = "excluded";
      output.exclusionReason = "LOW_SCORE";
    }
    return output;
  });
}

function getDescription(line, markdownLink) {
  const afterLink = line.slice(markdownLink.index + markdownLink[0].length);
  const description = cleanMarkdown(afterLink.replace(/^\s*[-:–—]\s*/, "").replace(/\s+\[(video|course|book)\]\s*$/i, ""));
  return description.slice(0, 1000);
}

function sourceItem({
  repository, listRepository = repository, category, subcategory, title, description, url, sourceReference, line, technology,
  resourceType, type, license = "Not verified; see the linked source repository",
}) {
  const normalizedUrl = canonicalHttpUrl(url);
  const combined = `${listRepository} ${category} ${subcategory} ${title} ${description} ${technology || ""} ${url || ""}`;
  const relatedDomains = [...new Set([
    ...DOMAIN_RULES.filter(([, pattern]) => pattern.test(combined)).map(([domain]) => domain),
    ...DIRECTORY_DOMAINS.filter(([, pattern]) => pattern.test(category)).map(([domain]) => domain),
    ...(repository === "codecrafters-io/build-your-own-x" ? ["tech-eng"] : []),
  ])];
  const relatedRoles = ROLE_RULES.filter(([, pattern]) => pattern.test(combined)).map(([role]) => role);
  if (repository === "codecrafters-io/build-your-own-x" && !relatedRoles.includes("software engineer")) {
    relatedRoles.push("software engineer");
  }
  const titleTechnologies = String(title).match(/\b(?:JavaScript|TypeScript|Node\.js|Python|C\+\+|C#|Rust|Go|Java|Kotlin|Swift|Ruby|PHP|SQL|HTML|CSS|React|Docker|Kubernetes|AWS|Azure|Linux)\b/gi) || [];
  const relatedTechnologies = [...new Set([technology, ...titleTechnologies].filter(Boolean).map((value) => value.toLowerCase()))];
  const relatedSkills = [...new Set([category, subcategory, title, ...relatedTechnologies].filter(Boolean).map((value) => value.toLowerCase().trim()).filter(Boolean))].slice(0, 12);
  const isSelfReference = repository === "sindresorhus/awesome" && /github\.com\/sindresorhus\/awesome(?:#|$)/i.test(normalizedUrl || url);
  const exclusionReason = isSelfReference
    ? "Source entry points back to the source catalog itself"
    : !normalizedUrl
    ? "Source link is not a valid HTTP(S) URL"
    : !relatedDomains.length
      ? "No reliable career-domain mapping rule matched the source category or topic"
      : "";

  return {
    sourceRepository: repository,
    sourceCategory: category || "Uncategorized",
    sourceSubcategory: subcategory || "",
    title: cleanMarkdown(title).slice(0, 200) || "Untitled source item",
    description: (description || "").slice(0, 1000),
    url: normalizedUrl || String(url || ""),
    sourceUrl: normalizedUrl || String(url || ""),
    sourceId: sourceId(repository, `${listRepository}|${category}|${subcategory}|${cleanMarkdown(title).toLowerCase()}|${normalizedUrl || url}`),
    sourceListRepository: listRepository,
    sourceReference: String(sourceReference || url || ""),
    type,
    resourceType,
    technology: (technology || relatedTechnologies[0] || category || "uncategorized").toLowerCase().slice(0, 50),
    category: (subcategory || category || "career learning").toLowerCase().slice(0, 50),
    tags: relatedSkills.slice(0, 20),
    relatedDomains,
    relatedRoles,
    relatedSkills,
    relatedTechnologies,
    difficulty: "all",
    attribution: `${listRepository}; source URL: ${normalizedUrl || url}`,
    sourceLicense: license,
    importStatus: exclusionReason ? "excluded" : "mapped",
    exclusionReason,
    sourceLine: line,
  };
}

function headingsForLine(line, headingStack) {
  const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
  if (!heading) return;
  const depth = heading[1].length;
  headingStack.length = depth - 1;
  headingStack[depth - 1] = cleanMarkdown(heading[2]);
}

function parseAwesomeMarkdown(markdown, {
  repository, listRepository = repository, parentCategory = "", parentTitle = "", filePath = "README.md", license, baseUrl = "",
}) {
  const items = [];
  const headingStack = [];
  markdown.split(/\r?\n/).forEach((line, index) => {
    headingsForLine(line, headingStack);
    if (!/^\s*[-*+]\s+/.test(line)) return;
    const links = [...line.matchAll(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["'][^)]*["'])?\)/g)];
    for (const link of links) {
      const sourceReference = link[2].replace(/^<|>$/g, "");
      if (sourceReference.startsWith("#")) continue;
      if (line[link.index - 1] === "!" || link[1].startsWith("!")) continue;
      if (/\.(?:svg|png|jpe?g|gif|webp|ico)(?:[?#].*)?$/i.test(sourceReference)) continue;
      const url = resourceUrl(sourceReference, baseUrl);
      const path = headingStack.filter(Boolean);
      if (path[0]?.toLowerCase() === "contents") continue;
      const localPath = [...path];
      if (listRepository !== repository && /^awesome(?:\s|$)/i.test(localPath[0] || "")) localPath.shift();
      const category = parentCategory || path[0] || "Uncategorized";
      const nestedPath = parentTitle ? [parentTitle, ...localPath] : localPath;
      const subcategory = (parentCategory ? nestedPath : path.slice(1)).join(" / ");
      const isCuratedList = repository === "sindresorhus/awesome" && listRepository === repository;
      const isVideo = /(?:youtube\.com|youtu\.be)/i.test(url || link[2]);
      const isRepository = /github\.com/i.test(url || sourceReference) && !/\/blob\/|\/raw\//i.test(url);
      const isCourse = /\b(course|curriculum|mooc)\b/i.test(`${link[1]} ${url || link[2]}`);
      const isDocumentation = /\.md(?:[?#].*)?$/i.test(sourceReference) || /\b(documentation|docs|reference|api)\b/i.test(`${link[1]} ${url || link[2]}`);
      const type = isCuratedList || isRepository ? "github" : isVideo ? "video" : isCourse ? "course" : isDocumentation ? "documentation" : "article";
      const item = sourceItem({
        repository,
        listRepository,
        category,
        subcategory,
        title: link[1],
        description: getDescription(line, link),
        url: url || sourceReference,
        sourceReference,
        line: `${filePath}:${index + 1}`,
        technology: "",
        resourceType: isCuratedList ? "curated-list" : isRepository ? "repository" : isVideo ? "video" : isCourse ? "course" : isDocumentation ? "documentation" : "article",
        type,
        license,
      });
      items.push(item);
    }
  });
  return items;
}

function parseBuildYourOwnX(markdown, { repository, license = "CC0 1.0 Universal" }) {
  const items = [];
  let inTutorials = false;
  let topic = "";
  markdown.split(/\r?\n/).forEach((line, index) => {
    if (/^##\s+Tutorials\b/i.test(line)) {
      inTutorials = true;
      topic = "";
      return;
    }
    if (inTutorials && /^##\s+/.test(line)) inTutorials = false;
    if (!inTutorials) return;
    const heading = line.match(/^####\s+Build your own\s+`?(.+?)`?\s*$/i);
    if (heading) {
      topic = cleanMarkdown(heading[1]);
      return;
    }
    if (!topic || !/^\s*[*-]\s+/.test(line)) return;
    const match = line.match(/\[(?:\*\*)?(.+?)(?:\*\*)?\s*:\s*_(.+?)_\]\(([^)\s]+)\)/);
    if (!match) return;
    const technology = cleanMarkdown(match[1]);
    const title = cleanMarkdown(match[2]);
    const url = canonicalHttpUrl(match[3]);
    const item = sourceItem({
      repository,
      category: "Build your own",
      subcategory: topic,
      title,
      description: "",
      url: url || match[3],
      sourceReference: match[3],
      line: `README.md:${index + 1}`,
      technology,
      resourceType: "tutorial",
      type: "practice",
      license,
    });
    items.push(item);
  });
  return items;
}

export { parseAwesomeMarkdown, parseBuildYourOwnX, sourceId };
