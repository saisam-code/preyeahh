import "dotenv/config";
import mongoose from "mongoose";
import "../models/index.js";
import CareerDomain from "../models/CareerDomain.js";
import CareerSubdomain from "../models/CareerSubdomain.js";
import Branch from "../models/Branch.js";
import Role from "../models/Role.js";
import Resource from "../models/Resource.js";
import SourceInventory from "../models/SourceInventory.js";
import Beyond from "../models/Beyond.js";
import { CAREER_DOMAIN_CATALOG } from "../../shared/careerDomainCatalog.js";

const LEGACY_SLUG = "law-public";
const LEGACY_NAME = "Law & Public Services";
const TARGET_SLUG = "government-careers";
const TARGET_NAME = "Government Careers";
const apply = process.argv.includes("--apply");
const target = CAREER_DOMAIN_CATALOG.find(({ slug }) => slug === TARGET_SLUG);

if (!target) throw new Error(`Missing ${TARGET_SLUG} in the career-domain catalog`);

async function getCounts() {
  const legacyDomain = await CareerDomain.findOne({
    $or: [{ slug: LEGACY_SLUG }, { name: LEGACY_NAME }],
  }).select("_id");
  const legacyId = legacyDomain?._id;
  const legacyRoleFilter = legacyId
    ? { $or: [{ domainId: legacyId }, { domain: LEGACY_NAME }] }
    : { domain: LEGACY_NAME };
  const [roles, subdomains, branches, resources, inventoryEntries, collegeEntries, examEntries, otherEntries] = await Promise.all([
    Role.countDocuments(legacyRoleFilter),
    legacyId ? CareerSubdomain.countDocuments({ domainId: legacyId }) : 0,
    legacyId ? Branch.countDocuments({ domainIds: legacyId }) : 0,
    Resource.countDocuments({ relatedDomains: LEGACY_SLUG }),
    SourceInventory.countDocuments({ relatedDomains: LEGACY_SLUG }),
    Beyond.countDocuments({ category: "college" }),
    Beyond.countDocuments({ category: "gate" }),
    Beyond.countDocuments({ category: { $in: ["startup", "national", "international"] } }),
  ]);
  return { legacyId, roles, subdomains, branches, resources, inventoryEntries, collegeEntries, examEntries, otherEntries };
}

async function migrate(counts) {
  const currentDomain = await CareerDomain.findOneAndUpdate(
    { slug: TARGET_SLUG },
    {
      $set: {
        name: target.name,
        slug: target.slug,
        description: target.description,
        color: target.color,
        displayOrder: target.displayOrder,
      },
      $setOnInsert: { icon: "" },
    },
    { upsert: true, new: true, runValidators: true }
  );
  const legacyId = counts.legacyId;
  const currentId = currentDomain._id;

  if (legacyId && String(legacyId) !== String(currentId)) {
    const oldSubdomains = await CareerSubdomain.find({ domainId: legacyId });
    for (const oldSubdomain of oldSubdomains) {
      const duplicate = await CareerSubdomain.findOne({
        domainId: currentId,
        branchId: oldSubdomain.branchId,
        slug: oldSubdomain.slug,
      });
      if (duplicate) {
        await Role.updateMany(
          { subdomainId: oldSubdomain._id },
          { $set: { subdomainId: duplicate._id } }
        );
        await oldSubdomain.deleteOne();
      } else {
        oldSubdomain.domainId = currentId;
        await oldSubdomain.save();
      }
    }

  }

  const legacyRoleFilter = legacyId
    ? { $or: [{ domainId: legacyId }, { domain: LEGACY_NAME }] }
    : { domain: LEGACY_NAME };
  await Role.updateMany(legacyRoleFilter, { $set: { domainId: currentId, domain: TARGET_NAME } });
  if (legacyId && String(legacyId) !== String(currentId)) {
    await Branch.updateMany({ domainIds: legacyId }, { $addToSet: { domainIds: currentId } });
    await Branch.updateMany({ domainIds: legacyId }, { $pull: { domainIds: legacyId } });
  }

  for (const Model of [Resource, SourceInventory]) {
    const records = await Model.find({ relatedDomains: LEGACY_SLUG }).select("_id relatedDomains");
    for (const record of records) {
      const remainingDomains = record.relatedDomains.filter((domain) => domain !== LEGACY_SLUG);
      if (remainingDomains.length === 0) {
        await record.deleteOne();
      } else {
        record.relatedDomains = remainingDomains;
        await record.save();
      }
    }
  }

  await Beyond.deleteMany({ category: "college" });
  await Beyond.updateMany({ category: "gate" }, { $set: { category: "exam" } });
  await Beyond.updateMany(
    { category: { $in: ["startup", "national", "international"] } },
    { $set: { category: "opportunity" } }
  );

  if (legacyId && String(legacyId) !== String(currentId)) {
    await CareerDomain.deleteOne({ _id: legacyId });
  }
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/preyeah");
  try {
    const counts = await getCounts();
    const { legacyId, ...summary } = counts;
    console.log(`${apply ? "Applying" : "Dry run"} government-careers migration: ${JSON.stringify(summary)}`);
    if (!apply) {
      console.log("No data changed. Re-run with --apply after reviewing the counts.");
      return;
    }
    await migrate(counts);
    console.log("Government-careers migration complete.");
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(`Government-careers migration failed: ${error.message}`);
  process.exitCode = 1;
});
