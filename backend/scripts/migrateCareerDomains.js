import "dotenv/config";
import mongoose from "mongoose";
import "../models/index.js";
import { CAREER_DOMAIN_CATALOG } from "../../shared/careerDomainCatalog.js";
import CareerDomain from "../models/CareerDomain.js";
import CareerSubdomain from "../models/CareerSubdomain.js";
import Branch from "../models/Branch.js";
import Role from "../models/Role.js";

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/preyeah";
  await mongoose.connect(mongoUri);

  try {
    await CareerDomain.collection.createIndex({ name: 1 }, { unique: true, name: "name_1" });
    await CareerDomain.collection.createIndex({ slug: 1 }, { unique: true, name: "slug_1" });
    await Branch.collection.createIndex({ domainIds: 1 }, { name: "domainIds_1" });
    await Role.collection.createIndex({ domainId: 1 }, { name: "domainId_1" });
    await Role.collection.createIndex({ subdomainId: 1 }, { name: "subdomainId_1" });
    await CareerSubdomain.collection.createIndex({ domainId: 1 }, { name: "domainId_1" });
    await CareerSubdomain.collection.createIndex({ branchId: 1 }, { name: "branchId_1" });
    await CareerSubdomain.collection.createIndex(
      { domainId: 1, branchId: 1, slug: 1 },
      { unique: true, name: "domain_branch_slug_unique" }
    );
    await CareerSubdomain.collection.createIndex(
      { domainId: 1, branchId: 1, displayOrder: 1 },
      { name: "domain_branch_order" }
    );

    let domainsUpserted = 0;
    let rolesLinked = 0;
    let branchesLinked = 0;

    for (const domain of CAREER_DOMAIN_CATALOG) {
      const record = await CareerDomain.findOneAndUpdate(
        { slug: domain.slug },
        {
          $set: {
            name: domain.name,
            slug: domain.slug,
            description: domain.description,
            color: domain.color,
            displayOrder: domain.displayOrder,
          },
          $setOnInsert: { icon: "" },
        },
        { upsert: true, new: true, runValidators: true }
      );
      domainsUpserted += 1;

      const result = await Role.updateMany(
        {
          domain: domain.name,
          $or: [{ domainId: null }, { domainId: { $exists: false } }],
        },
        { $set: { domainId: record._id } }
      );
      rolesLinked += result.modifiedCount || result.nModified || 0;
    }

    const branches = await Branch.find({}).select("_id name").lean();
    for (const branch of branches) {
      const domainIds = await Role.distinct("domainId", {
        branch: branch.name,
        domainId: { $ne: null },
      });
      if (domainIds.length === 0) continue;

      const result = await Branch.updateOne(
        { _id: branch._id },
        { $addToSet: { domainIds: { $each: domainIds } } }
      );
      branchesLinked += result.modifiedCount || result.nModified || 0;
    }

    console.log(
      `Career domain migration complete: ${domainsUpserted} domains synchronized, ${rolesLinked} roles linked, ${branchesLinked} branches associated.`
    );
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(`Career domain migration failed: ${error.message}`);
  process.exitCode = 1;
});
