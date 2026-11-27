import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import "../models/index.js";

const apply = process.argv.includes("--apply");
const backupPaths = [
  path.resolve("backups/2026-11-27T10-53-10-373Z/Resource.json"),
  path.resolve("backups/pruned-resources-2026-11-26T14-27-43-979Z.ndjson"),
];

function canonicalUrl(raw) {
  if (!raw) return "";
  try {
    const url = new URL(String(raw).trim());
    if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com") return "";
    url.hash = "";
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"]) {
      url.searchParams.delete(key);
    }
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return "";
  }
}

async function run() {
  const rows = [];
  for (const backupPath of backupPaths) {
    if (backupPath.endsWith(".ndjson")) {
      for (const line of fs.readFileSync(backupPath, "utf8").split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          rows.push(JSON.parse(line));
        } catch {}
      }
    } else {
      rows.push(...JSON.parse(fs.readFileSync(backupPath, "utf8")));
    }
  }
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

  const CareerDomain = mongoose.model("CareerDomain");
  const Resource = mongoose.model("Resource");
  const domains = await CareerDomain.find({
    slug: { $nin: ["government-careers", "law-public"] },
  }).sort({ displayOrder: 1 }).lean();

  const resourcesByUrl = new Map();
  const plan = [];
  for (const domain of domains) {
    const selected = [];
    const seenInDomain = new Set();
    for (const row of rows) {
      if (!(row.relatedDomains || []).includes(domain.slug)) continue;
      const url = canonicalUrl(row.url || row.sourceUrl);
      if (!url || seenInDomain.has(url)) continue;
      seenInDomain.add(url);
      let resource = resourcesByUrl.get(url);
      if (!resource) {
        resource = {
          title: String(row.title || row.sourceId || "GitHub resource").trim().slice(0, 180),
          description: String(row.description || row.sourceSubcategory || "Community GitHub learning resource").trim().slice(0, 3000),
          type: "github",
          url,
          provider: "GitHub",
          domainIds: [],
          subdomainIds: [],
          roleIds: [],
          skills: Array.isArray(row.relatedSkills) ? row.relatedSkills.slice(0, 20) : [],
          tags: Array.isArray(row.tags) ? row.tags.slice(0, 30) : [],
          difficulty: ["beginner", "intermediate", "advanced"].includes(row.difficulty) ? row.difficulty : "all",
          educationStages: Array.isArray(row.educationStages) ? row.educationStages : [],
          isActive: true,
        };
        resourcesByUrl.set(url, resource);
      }
      if (!resource.domainIds.some((id) => String(id) === String(domain._id))) {
        resource.domainIds.push(domain._id);
      }
      selected.push(resource);
      if (selected.length === 30) break;
    }
    plan.push({ slug: domain.slug, name: domain.name, count: selected.length, resources: selected });
  }

  const report = {
    migration: "2026-restore-github-resources",
    mode: apply ? "apply" : "dry-run",
    startedAt: new Date().toISOString(),
    domains: plan.map(({ slug, name, count }) => ({ slug, name, count })),
    before: await Resource.countDocuments(),
    expectedAfter: resourcesByUrl.size,
  };

  if (apply) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.resolve("backups", stamp);
    fs.mkdirSync(backupDir, { recursive: true });
    fs.writeFileSync(path.join(backupDir, "Resource-before.json"), JSON.stringify(await Resource.find().lean(), null, 2));
    await Resource.deleteMany({});
    const resources = Array.from(resourcesByUrl.values());
    if (resources.length) await Resource.insertMany(resources, { ordered: false });
  }

  report.after = apply ? await Resource.countDocuments() : report.before;
  report.finishedAt = new Date().toISOString();
  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
