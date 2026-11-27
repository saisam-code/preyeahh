import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import "../models/index.js";
import { CAREER_DOMAIN_CATALOG } from "../../shared/careerDomainCatalog.js";
import { CAREER_CATALOG } from "../../shared/careerCatalog.js";

const apply = process.argv.includes("--apply");
const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g,"-");
const touched = ["CareerDomain","CareerSubdomain","Role","Guidance","Resource","Opportunity","GovernmentJob","GovernmentNotification","Branch","Parent","ParentLink"];

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}

async function backupCollection(modelName) {
  const backupDir = path.resolve("backups", stamp);
  fs.mkdirSync(backupDir, { recursive: true });
  const Model = mongoose.model(modelName);
  const docs = await Model.find().lean();
  fs.writeFileSync(path.join(backupDir, `${modelName}.json`), JSON.stringify(docs, null, 2));
  return docs.length;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const report = {
    migration: "2026-xx-explore-restructure",
    mode: apply ? "apply" : "dry-run",
    startedAt: now.toISOString(),
    steps: {},
  };

  const CareerDomain = mongoose.model("CareerDomain");
  const CareerSubdomain = mongoose.model("CareerSubdomain");
  const Role = mongoose.model("Role");
  const Guidance = mongoose.model("Guidance");
  const Resource = mongoose.model("Resource");
  const Opportunity = mongoose.model("Opportunity");
  const GovernmentJob = mongoose.model("GovernmentJob");
  const Branch = mongoose.model("Branch");

  const before = {};
  for (const [name, Model] of Object.entries({
    CareerDomain, CareerSubdomain, Role, Guidance, Resource, Opportunity, GovernmentJob, Branch,
  })) before[name] = await Model.countDocuments();

  report.steps.before = before;

  if (apply) {
    for (const name of touched) {
      if (mongoose.models[name]) await backupCollection(name);
    }
  }

  const domainIdBySlug = new Map();
  const legacyDomain = await CareerDomain.findOne({ $or: [{ slug: "law-public" }, { name: "Law & Public Services" }] });
  if (apply && legacyDomain) {
    await CareerDomain.updateOne(
      { _id: legacyDomain._id },
      { $set: { name: "Government Careers", slug: "government-careers" } }
    );
  }

  if (apply) {
    for (const domain of CAREER_DOMAIN_CATALOG) {
      const existing = await CareerDomain.findOne({ $or: [{ slug: domain.slug }, { name: domain.name }] });
      if (existing) {
        await CareerDomain.updateOne({ _id: existing._id }, { $set: domain });
      } else {
        await CareerDomain.create(domain);
      }
    }
  }

  const allDomains = await CareerDomain.find().lean();
  allDomains.forEach((domain) => domainIdBySlug.set(domain.slug, domain._id));
  report.steps.domainRename = {
    legacyFound: Boolean(legacyDomain),
    target: "government-careers",
    targetId: legacyDomain?._id?.toString() || null,
  };

  const subdomainCounts = { created: 0, general: 0, needsReview: 0 };
  const subdomainIdByKey = new Map();
  if (apply) {
    for (const domain of CAREER_DOMAIN_CATALOG) {
      const domainId = domainIdBySlug.get(domain.slug) || (await CareerDomain.findOne({ slug: domain.slug }))?._id;
      if (!domainId) continue;
      const catalog = CAREER_CATALOG.find((entry) => entry.domainSlug === domain.slug);
      const subdomainNames = domain.slug === "government-careers"
        ? ["Civil Services","Defence","Railways","Banking","SSC","Police","Teaching","PSU","Judiciary","State PSC"]
        : ["General", "Needs review"];
      for (let i = 0; i < subdomainNames.length; i++) {
        const name = subdomainNames[i];
        const subSlug = slugify(name);
        let subdomain = await CareerSubdomain.findOne({ domainId, slug: subSlug });
        if (!subdomain) {
          subdomain = await CareerSubdomain.create({ name, slug: subSlug, domainId, displayOrder: i });
          subdomainCounts.created++;
        }
        subdomainIdByKey.set(`${domain.slug}:${subSlug}`, subdomain._id);
      }
      if (catalog) subdomainCounts.general++;
    }
  }
  report.steps.subdomains = subdomainCounts;

  const branches = await Branch.find().lean();
  const branchIdByName = new Map(branches.map((branch) => [branch.name.toUpperCase(), branch._id]));
  const roleDuplicates = await Role.aggregate([
    { $match: { title: { $exists: true } } },
    { $set: { norm: { $toLower: "$title" } } },
    { $group: { _id: "$norm", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  const mergeReport = [];

  if (apply) {
    for (const role of await Role.find().lean()) {
      const slug = slugify(role.slug || role.title);
      let domain = role.domainId ? await CareerDomain.findById(role.domainId) : null;
      if (!domain && role.domain) {
        domain = await CareerDomain.findOne({ name: role.domain }) ||
          await CareerDomain.findOne({ slug: "tech-eng" });
      }
      if (!domain) domain = await CareerDomain.findOne({ slug: "tech-eng" });
      if (!domain) continue;

      let subdomain = role.subdomainId ? await CareerSubdomain.findById(role.subdomainId) : null;
      if (!subdomain) {
        const subSlug = domain.slug === "government-careers" ? "civil-services" : "general";
        subdomain = await CareerSubdomain.findOne({ domainId: domain._id, slug: subSlug }) ||
          await CareerSubdomain.create({ name: domain.slug === "government-careers" ? "Civil Services" : "General", slug: subSlug, domainId: domain._id, displayOrder: 0 });
      }

      const branchIds = [];
      if (role.branch && branchIdByName.has(String(role.branch).toUpperCase())) {
        branchIds.push(branchIdByName.get(String(role.branch).toUpperCase()));
      }
      await Role.updateOne({ _id: role._id }, { $set: { slug, domainId: domain._id, subdomainId: subdomain._id, branchIds }, $unset: { domain: "" } });
    }

    for (const group of roleDuplicates) {
      const roles = await Role.find({ _id: { $in: group.ids } }).sort({ createdAt: 1 }).lean();
      if (roles.length < 2) continue;
      const canonical = roles[0];
      const mergedIds = roles.slice(1).map((role) => role._id);
      const branchIds = [...new Set(roles.flatMap((role) => (role.branchIds || []).map(String)))];
      await Role.updateOne({ _id: canonical._id }, { $set: { branchIds: branchIds.map((id) => new mongoose.Types.ObjectId(id)) } });

      const remapCollections = [
        [mongoose.model("Guidance"), ["role","roleId"]],
        [mongoose.model("RoleInterest"), ["role"]],
        [mongoose.model("StudentGoal"), ["role"]],
        [mongoose.model("PersonalCareerPlan"), ["role"]],
        [mongoose.model("Chat"), ["roleId"]],
        [mongoose.model("AIRoadmap"), ["roleId"]],
        [mongoose.model("MentorshipConversation"), ["roleId"]],
        [mongoose.model("RoleRequest"), ["role"]],
      ];
      for (const [Model, fields] of remapCollections) {
        for (const field of fields) {
          try {
            await Model.updateMany({ [field]: { $in: mergedIds } }, { $set: { [field]: canonical._id } });
          } catch {}
        }
      }
      await Role.deleteMany({ _id: { $in: mergedIds } });
      mergeReport.push({ keep: canonical._id.toString(), merge: mergedIds.map((id) => id.toString()) });
    }
  }
  report.steps.roleDuplicates = {
    found: roleDuplicates.length,
    rows: roleDuplicates.reduce((sum, group) => sum + group.count, 0),
    merges: mergeReport,
  };

  const importerResourceFilter = {
    $or: [
      { relatedDomains: "law-public" },
      { sourceRepository: { $exists: true, $nin: [null, ""] } },
      { importStatus: { $exists: true, $nin: [null, ""] } },
    ],
  };
  const deleteResourceCount = await Resource.countDocuments(importerResourceFilter);
  if (apply) await Resource.deleteMany(importerResourceFilter);
  report.steps.resources = { before: before.Resource, importerOrLawRows: deleteResourceCount, afterTarget: before.Resource - deleteResourceCount };

  const guidanceRows = await Guidance.find().lean();
  if (apply) {
    for (const row of guidanceRows) {
      if (!Array.isArray(row.phases) || row.phases.length === 0) {
        await Guidance.updateOne(
          { _id: row._id },
          { $set: {
            roleId: row.role || null,
            targetEducationStages: [],
            summary: row.overview || "",
            prerequisites: [],
            phases: [{ title: "Overview", durationWeeks: row.durationWeeks || 4, objectives: row.points || [], skills: [], resourceIds: [], milestone: "", tips: [] }],
            exams: [],
            commonMistakes: [],
            status: "published",
            version: 1,
          } }
        );
      }
    }
  }
  report.steps.guidance = { before: guidanceRows.length, migratedOverviewPhases: guidanceRows.filter((row) => !row.phases || row.phases.length === 0).length };

  if (apply) {
    await mongoose.model("CareerSubdomain").updateMany({}, { $unset: { branchId: "" } });
  }

  const after = {};
  for (const [name, Model] of Object.entries({
    CareerDomain, CareerSubdomain, Role, Guidance, Resource, Opportunity, GovernmentJob, Branch,
  })) after[name] = await Model.countDocuments();
  report.steps.after = after;
  report.finishedAt = new Date().toISOString();

  const reportDir = path.resolve("backups", stamp);
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, "migration-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log(`Migration report: ${reportPath}`);

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
