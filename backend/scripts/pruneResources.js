import "dotenv/config";
import { once } from "node:events";
import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { finished } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import mongoose from "mongoose";
import Resource from "../models/Resource.js";
import Role from "../models/Role.js";
import SourceInventory from "../models/SourceInventory.js";
import logger from "../utils/logger.js";
import { CAREER_CATALOG } from "../../shared/careerCatalog.js";
import {
  classifyImportedResource,
  normalizeKeptResource,
  PRUNE_REASONS,
  repositoryMetadataIsComplete,
  stableSourceListMappedCount,
} from "../services/resourcePruning.js";
import {
  createKnownSkillSet,
  normalizeMatchValue,
  WHEEL_CAREER_NAMES,
  WHEEL_DOMAIN_SLUGS,
} from "../services/sourceRelevance.js";

const BATCH_SIZE = 1000;
const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));

function parseOptions(args) {
  const options = { apply: false, allowProduction: false, report: "reports/prune.json", minScore: 2 };
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--apply") options.apply = true;
    else if (args[index] === "--allow-production") options.allowProduction = true;
    else if (args[index] === "--report") {
      options.report = args[index + 1];
      index += 1;
    } else if (args[index] === "--min-score") {
      options.minScore = Number(args[index + 1]);
      if (!Number.isInteger(options.minScore) || options.minScore < 0) {
        throw new Error("--min-score must be a non-negative integer");
      }
      index += 1;
    } else if (args[index] === "--help") {
      console.log("Usage: node scripts/pruneResources.js [--apply] [--report <path>] [--min-score 2] [--allow-production]");
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${args[index]}`);
    }
  }
  return options;
}

function chunks(items, size = BATCH_SIZE) {
  const result = [];
  for (let offset = 0; offset < items.length; offset += size) result.push(items.slice(offset, offset + size));
  return result;
}

async function writeBackupLine(stream, resource) {
  if (stream.write(`${JSON.stringify(resource)}\n`)) return;
  await once(stream, "drain");
}

function sourceListId(resource) {
  return String(resource.sourceListId || resource.sourceListRepository || "").trim();
}

async function getSourceListCounts() {
  const rows = await Resource.aggregate([
    { $match: { sourceId: { $exists: true, $ne: "" }, importStatus: "mapped" } },
    {
      $project: {
        sourceRepository: 1,
        listId: { $ifNull: ["$sourceListId", "$sourceListRepository"] },
        persistedMappedCount: { $ifNull: ["$sourceListMappedCount", 0] },
      },
    },
    { $match: { listId: { $type: "string", $ne: "" } } },
    {
      $group: {
        _id: "$listId",
        sourceRepository: { $first: "$sourceRepository" },
        observed: { $sum: 1 },
        persistedMappedCount: { $max: "$persistedMappedCount" },
      },
    },
  ]);
  return new Map(rows.map(({ _id, sourceRepository, observed, persistedMappedCount }) => [
    _id,
    { sourceRepository, mapped: stableSourceListMappedCount(persistedMappedCount, observed) },
  ]));
}

async function getRepositoryFacts(listIds) {
  if (!listIds.length) return { facts: new Map(), status: "no nested source lists to verify" };
  const facts = new Map();
  let unavailableReason = "";
  const pending = [...listIds];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, pending.length) }, async () => {
    while (next < pending.length && !unavailableReason) {
      const listId = pending[next];
      next += 1;
      const [owner, repo] = listId.split("/");
      if (!owner || !repo) {
        facts.set(listId, { invalid: true });
        continue;
      }
      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "preyeahh-resource-pruner/1.0",
          },
          signal: AbortSignal.timeout(10000),
        });
        if (response.status === 403 || response.status === 429) {
          unavailableReason = `rate-limited after ${facts.size} repositories`;
          continue;
        }
        if (!response.ok) {
          facts.set(listId, { unavailable: true, missing: response.status === 404, status: response.status });
          if (response.status !== 404) unavailableReason = `HTTP ${response.status} for ${listId}`;
          continue;
        }
        const data = await response.json();
        facts.set(listId, { archived: Boolean(data.archived), stars: Number(data.stargazers_count) || 0 });
      } catch (error) {
        unavailableReason = error.message;
      }
    }
  }));
  return {
    facts,
    status: unavailableReason
      ? `partial: ${unavailableReason}; remaining metadata checks skipped`
      : `checked ${facts.size} repositories`,
  };
}

function updateCoverage(report, resource) {
  for (const domain of resource.normalized.relatedDomains) {
    report.keptPerDomain[domain] = (report.keptPerDomain[domain] || 0) + 1;
  }
  const careers = new Set((resource.normalized.relatedRoles || []).map(normalizeMatchValue));
  for (const domain of CAREER_CATALOG) {
    for (const career of domain.careers) {
      if (careers.has(normalizeMatchValue(career.name))) {
        report.keptPerCareer[career.name] = (report.keptPerCareer[career.name] || 0) + 1;
      }
    }
  }
}

async function applyPrune({ droppedSourceIds, keptResources, backupPath }) {
  const droppedBatches = chunks(droppedSourceIds);
  for (const batch of droppedBatches) {
    await Resource.bulkWrite(
      [{ deleteMany: { filter: { sourceId: { $in: batch } } } }],
      { ordered: false }
    );
    await SourceInventory.deleteMany({ sourceId: { $in: batch } });
  }

  const updates = keptResources.map(({ _id, normalized }) => ({
    updateOne: {
      filter: { _id },
      update: {
        $set: normalized,
        $unset: {
          thumbnail: "",
          bookmarks: "",
          learningObjectives: "",
          sourceListRepository: "",
          sourceReference: "",
        },
      },
    },
  }));
  for (const batch of chunks(updates)) await Resource.bulkWrite(batch, { ordered: false });

  await SourceInventory.deleteMany({ importStatus: { $in: ["excluded", "failed", "duplicate"] } });
  return { backupPath, deletedResources: droppedSourceIds.length, normalizedResources: keptResources.length };
}

async function runPrune(options) {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required to inspect imported resources");
  if (options.apply && process.env.NODE_ENV === "production" && !options.allowProduction) {
    throw new Error("Production pruning requires the explicit --allow-production option");
  }
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });

  const roleSkills = await Role.distinct("guidance.skills").maxTimeMS(30000);
  const skillSet = createKnownSkillSet(roleSkills);
  const sourceLists = await getSourceListCounts();
  const nestedLists = [...sourceLists.entries()]
    .filter(([listId, counts]) => listId !== counts.sourceRepository && counts.mapped >= 3)
    .sort((left, right) => right[1].mapped - left[1].mapped)
    .map(([listId]) => listId);
  const repositoryMetadata = await getRepositoryFacts(nestedLists);
  const enforceRepositoryMetadata = repositoryMetadataIsComplete(repositoryMetadata.status);
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: !options.apply,
    minScore: options.minScore,
    sourceListMetadataCheck: repositoryMetadata.status,
    totals: { scanned: 0, kept: 0, dropped: 0 },
    countsByReason: Object.fromEntries(PRUNE_REASONS.map((reason) => [reason, 0])),
    keptPerDomain: Object.fromEntries([...WHEEL_DOMAIN_SLUGS].map((domain) => [domain, 0])),
    keptPerCareer: {},
    lowestScoringKept: [],
  };
  const droppedSourceIds = [];
  const keptResources = [];
  const seenUrls = new Set();
  const reportPath = path.resolve(options.report);
  const backupPath = options.apply
    ? path.join(SCRIPT_DIRECTORY, "..", "backups", `pruned-resources-${new Date().toISOString().replace(/[:.]/g, "-")}.ndjson`)
    : "";
  let backupStream;
  let backupFinished;
  if (options.apply) {
    await mkdir(path.dirname(backupPath), { recursive: true });
    backupStream = createWriteStream(backupPath, { flags: "wx" });
    backupFinished = finished(backupStream);
  }

  const cursor = Resource.find({ sourceId: { $exists: true, $ne: "" } })
    .sort({ _id: 1 })
    .lean()
    .cursor({ batchSize: BATCH_SIZE });
  try {
    for await (const resource of cursor) {
      report.totals.scanned += 1;
      let result = classifyImportedResource(resource, { skillSet, minScore: options.minScore });
      let reason = result.reason;
      const listId = sourceListId(resource);
      const listInfo = listId ? sourceLists.get(listId) : null;
      const isNestedList = Boolean(listId && listInfo && listId !== listInfo.sourceRepository);

      if (!reason && isNestedList) {
        const facts = repositoryMetadata.facts.get(listId);
        if (
          (listInfo.mapped || 0) < 3
          || facts?.invalid
          || (enforceRepositoryMetadata && (
            facts?.archived
            || facts?.missing
            || (facts && !facts.unavailable && facts.stars < 500)
          ))
        ) {
          reason = "SPARSE_LIST";
        }
      }
      if (!reason && seenUrls.has(result.url)) reason = "DUPLICATE";

      if (reason) {
        report.totals.dropped += 1;
        report.countsByReason[reason] += 1;
        droppedSourceIds.push(resource.sourceId);
        if (backupStream) await writeBackupLine(backupStream, resource);
        continue;
      }

      seenUrls.add(result.url);
      report.totals.kept += 1;
      result.normalized = normalizeKeptResource(resource, result.score, result.url);
      result.normalized.sourceListMappedCount = stableSourceListMappedCount(
        resource.sourceListMappedCount,
        listInfo?.mapped
      );
      const kept = { _id: resource._id, sourceId: resource.sourceId, normalized: result.normalized };
      keptResources.push(kept);
      updateCoverage(report, kept);
      report.lowestScoringKept.push({
        sourceId: resource.sourceId,
        title: resource.title,
        score: result.score,
        relatedDomains: result.normalized.relatedDomains,
        relatedRoles: result.normalized.relatedRoles,
        url: result.url,
      });
      report.lowestScoringKept.sort((left, right) => left.score - right.score);
      if (report.lowestScoringKept.length > 50) report.lowestScoringKept.length = 50;
    }
  } finally {
    await cursor.close();
  }

  if (backupStream) {
    backupStream.end();
    await backupFinished;
  }

  await mkdir(path.dirname(reportPath), { recursive: true });
  report.applyStatus = options.apply ? "pending" : "not applied";
  report.backupPath = backupPath;
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (options.apply) {
    report.applyResults = await applyPrune({ droppedSourceIds, keptResources, backupPath });
    report.applyStatus = "completed";
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  console.table([
    ...Object.entries(report.countsByReason).map(([reason, count]) => ({ type: reason, count })),
    { type: "KEPT", count: report.totals.kept },
    { type: "SCANNED", count: report.totals.scanned },
  ]);
  console.table(Object.entries(report.keptPerDomain).map(([domain, count]) => ({ domain, count })));
  logger.info(`Prune report written to ${reportPath}`);
  if (options.apply) logger.info(`Dropped-resource backup written to ${backupPath}`);

  const underMinimumDomains = Object.entries(report.keptPerDomain).filter(([, count]) => count < 10);
  if (underMinimumDomains.length) {
    logger.warn(`Fewer than 10 kept resources for wheel domains: ${underMinimumDomains.map(([domain]) => domain).join(", ")}`);
    process.exitCode = 1;
  }
  return report;
}

async function main() {
  let options;
  try {
    options = parseOptions(process.argv.slice(2));
    await runPrune(options);
  } catch (error) {
    logger.error(`Resource prune failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
