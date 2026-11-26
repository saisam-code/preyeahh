import "dotenv/config";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import mongoose from "mongoose";
import Resource from "../models/Resource.js";
import SourceInventory from "../models/SourceInventory.js";
import logger from "../utils/logger.js";
import { parseAwesomeMarkdown, parseBuildYourOwnX } from "../services/sourceImportParser.js";
import { CAREER_DOMAIN_CATALOG } from "../../shared/careerDomainCatalog.js";

const REPOSITORIES = [
  { slug: "sindresorhus/awesome", url: "https://github.com/sindresorhus/awesome.git", folder: "awesome" },
  { slug: "codecrafters-io/build-your-own-x", url: "https://github.com/codecrafters-io/build-your-own-x.git", folder: "build-your-own-x" },
];
const REQUEST_TIMEOUT_MS = 10000;
const MAX_README_BYTES = 2_000_000;

function optionsFromArgs(args) {
  const options = { dryRun: false, crawlAwesome: true, allowProduction: false, reportPath: "" };
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--dry-run") options.dryRun = true;
    else if (args[index] === "--skip-awesome-crawl") options.crawlAwesome = false;
    else if (args[index] === "--allow-production") options.allowProduction = true;
    else if (args[index] === "--report") {
      options.reportPath = args[index + 1];
      index += 1;
    } else if (args[index] === "--help") {
      console.log("Usage: node scripts/importSourceResources.js [--dry-run] [--skip-awesome-crawl] [--allow-production] [--report <path>]");
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${args[index]}`);
    }
  }
  return options;
}

function cloneRepository(repository, destination) {
  execFileSync("git", ["clone", "--depth", "1", repository.url, destination], { stdio: "inherit" });
  return execFileSync("git", ["-C", destination, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

function githubCoordinates(value) {
  try {
    const url = new URL(value);
    if (url.hostname.toLowerCase() !== "github.com") return null;
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    return owner && repo ? { owner, repo } : null;
  } catch {
    return null;
  }
}

async function fetchReadme(owner, repo) {
  const attempts = [
    ["main", "README.md"], ["main", "readme.md"],
    ["master", "README.md"], ["master", "readme.md"],
  ];
  let lastError = "README not found on main or master";
  for (const [branch, file] of attempts) {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "preyeahh-source-importer/1.0" } });
      if (!response.ok) {
        lastError = `HTTP ${response.status} for ${url}`;
        continue;
      }
      const body = await response.text();
      if (Buffer.byteLength(body, "utf8") > MAX_README_BYTES) {
        lastError = `README exceeds ${MAX_README_BYTES} bytes`;
        continue;
      }
      return {
        markdown: body,
        baseUrl: `https://github.com/${owner}/${repo}/blob/${branch}/${file}`,
      };
    } catch (error) {
      lastError = error.name === "AbortError" ? `Timed out fetching ${url}` : error.message;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(lastError);
}

async function mapConcurrent(items, concurrency, callback) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await callback(items[index]);
    }
  }));
  return results;
}

function duplicateAndCoverage(items, failedRepositories, sourceVersions) {
  const seenIds = new Set();
  const inventory = items.map((item) => {
    const output = { ...item };
    if (output.importStatus === "excluded") return output;
    const priorId = seenIds.has(output.sourceId);
    if (priorId) {
      output.importStatus = "duplicate";
      output.exclusionReason = "Duplicate source item identifier";
      output.duplicateOf = output.sourceId;
      return output;
    }
    seenIds.add(output.sourceId);
    return output;
  });

  const byRepository = {};
  const byCategory = {};
  for (const item of inventory) {
    byRepository[item.sourceRepository] ||= { discovered: 0, mapped: 0, duplicate: 0, excluded: 0, failed: 0, imported: 0, added: 0, updated: 0 };
    const repo = byRepository[item.sourceRepository];
    repo.discovered += 1;
    repo[item.importStatus] = (repo[item.importStatus] || 0) + 1;
    const categoryKey = `${item.sourceRepository} / ${item.sourceCategory}${item.sourceSubcategory ? ` / ${item.sourceSubcategory}` : ""}`;
    byCategory[categoryKey] ||= { discovered: 0, mapped: 0, duplicate: 0, excluded: 0, failed: 0 };
    byCategory[categoryKey].discovered += 1;
    byCategory[categoryKey][item.importStatus] = (byCategory[categoryKey][item.importStatus] || 0) + 1;
  }
  for (const failure of failedRepositories) {
    const repo = byRepository["sindresorhus/awesome"];
    if (repo) repo.failed += 1;
    else byRepository["sindresorhus/awesome"] = { discovered: 0, mapped: 0, duplicate: 0, excluded: 0, failed: 1, imported: 0, added: 0, updated: 0 };
  }

  const totals = inventory.reduce((result, item) => {
    result.discovered += 1;
    result[item.importStatus] += 1;
    return result;
  }, { discovered: 0, mapped: 0, duplicate: 0, excluded: 0, failed: failedRepositories.length, imported: 0, added: 0, updated: 0 });

  return {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    sourceVersions,
    licenses: {
      "sindresorhus/awesome": "CC0 1.0 Universal (repository license)",
      "codecrafters-io/build-your-own-x": "CC0 1.0 Universal (Origins & License section)",
    },
    totals,
    repositories: byRepository,
    categories: byCategory,
    failedRepositories,
    incompleteCategories: Object.entries(byCategory)
      .filter(([, values]) => values.excluded > 0 || values.failed > 0)
      .map(([category, counts]) => ({ category, ...counts })),
    domainCoverage: Object.fromEntries([...new Set(inventory.flatMap((item) => item.relatedDomains))].map((domain) => [
      domain,
      inventory.filter((item) => item.relatedDomains.includes(domain) && item.importStatus === "mapped").length,
    ])),
    roleCoverage: Object.fromEntries([...new Set(inventory.flatMap((item) => item.relatedRoles))].map((role) => [
      role,
      inventory.filter((item) => item.relatedRoles.includes(role) && item.importStatus === "mapped").length,
    ])),
    inventory,
  };
}

async function loadSourceItems(tempDirectory, versions, { crawlAwesome }) {
  const awesomeDirectory = path.join(tempDirectory, "awesome");
  const byoxDirectory = path.join(tempDirectory, "build-your-own-x");
  const awesomeMarkdown = await readFile(path.join(awesomeDirectory, "readme.md"), "utf8");
  const byoxMarkdown = await readFile(path.join(byoxDirectory, "README.md"), "utf8");
  const awesomeBranch = execFileSync("git", ["-C", awesomeDirectory, "branch", "--show-current"], { encoding: "utf8" }).trim();
  const awesomeItems = parseAwesomeMarkdown(awesomeMarkdown, {
    repository: "sindresorhus/awesome",
    filePath: "readme.md",
    baseUrl: `https://github.com/sindresorhus/awesome/blob/${awesomeBranch}/readme.md`,
    license: "CC0 1.0 Universal",
  });
  const byoxItems = parseBuildYourOwnX(byoxMarkdown, { repository: "codecrafters-io/build-your-own-x" });
  const items = [...awesomeItems, ...byoxItems];
  const failedRepositories = [];

  if (crawlAwesome) {
    const candidates = [...new Map(awesomeItems
      .filter((item) => item.url.includes("#readme"))
      .map((item) => {
        const coordinates = githubCoordinates(item.url);
        return coordinates ? [`${coordinates.owner}/${coordinates.repo}`, { ...coordinates, item }] : null;
      })
      .filter(Boolean)).values()];
    const seenRepositories = new Set(["sindresorhus/awesome"]);
    let pending = candidates.filter((candidate) => {
      const key = `${candidate.owner}/${candidate.repo}`.toLowerCase();
      if (seenRepositories.has(key)) return false;
      seenRepositories.add(key);
      return true;
    });

    while (pending.length) {
      console.log(`Reading ${pending.length} linked lists (${seenRepositories.size} repositories discovered; ${items.length} items inventoried)`);
      const fetched = await mapConcurrent(pending, 6, async (candidate) => {
        const listRepository = `${candidate.owner}/${candidate.repo}`;
        try {
          const { markdown, baseUrl } = await fetchReadme(candidate.owner, candidate.repo);
          const parsed = parseAwesomeMarkdown(markdown, {
            repository: "sindresorhus/awesome",
            listRepository,
            parentCategory: candidate.item.sourceCategory,
            parentTitle: [candidate.item.sourceSubcategory, candidate.item.title].filter(Boolean).join(" / "),
            filePath: "README.md",
            baseUrl,
          });
          return { candidate, listRepository, parsed };
        } catch (error) {
          candidate.item.importStatus = "failed";
          candidate.item.exclusionReason = `Could not read nested Awesome list: ${error.message}`;
          failedRepositories.push({ repository: listRepository, reason: error.message, sourceItem: candidate.item.sourceId });
          return { candidate, listRepository, parsed: [] };
        }
      });

      const next = new Map();
      for (const result of fetched) {
        for (const item of result.parsed) items.push(item);
        for (const item of result.parsed) {
          if (!item.url.includes("#readme")) continue;
          const coordinates = githubCoordinates(item.url);
          if (!coordinates || (!/awesome/i.test(item.title) && !/awesome/i.test(coordinates.repo))) continue;
          const key = `${coordinates.owner}/${coordinates.repo}`.toLowerCase();
          if (seenRepositories.has(key)) continue;
          seenRepositories.add(key);
          next.set(key, { ...coordinates, item });
        }
      }
      pending = [...next.values()];
    }
  }

  return { items, failedRepositories };
}

async function ensureResourceIndexes() {
  let indexes = [];
  try {
    indexes = await Resource.collection.indexes();
  } catch (error) {
    if (error.code !== 26 && error.codeName !== "NamespaceNotFound") throw error;
  }
  const parallelArrayIndex = indexes.find(({ key }) => key.relatedDomains && key.relatedRoles);
  if (parallelArrayIndex) await Resource.collection.dropIndex(parallelArrayIndex.name);
  await Resource.collection.createIndex({ relatedDomains: 1 });
  await Resource.collection.createIndex({ relatedRoles: 1 });
}

async function writeBulkBatches(model, operations, label) {
  const batchSize = 1000;
  const concurrency = 3;
  const batches = [];
  for (let offset = 0; offset < operations.length; offset += batchSize) {
    batches.push(operations.slice(offset, offset + batchSize));
  }
  if (!batches.length) return;

  console.log(`Writing ${operations.length} ${label} in ${batches.length} batches`);
  let nextBatch = 0;
  let completedBatches = 0;
  const workers = Array.from({ length: Math.min(concurrency, batches.length) }, async () => {
    while (nextBatch < batches.length) {
      const batch = batches[nextBatch];
      nextBatch += 1;
      await model.bulkWrite(batch, { ordered: false });
      completedBatches += 1;
      if (completedBatches % 25 === 0 || completedBatches === batches.length) {
        console.log(`${label}: ${completedBatches}/${batches.length} batches written`);
      }
    }
  });
  const results = await Promise.allSettled(workers);
  const failure = results.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
}

async function checkDatabaseStatus(inventory, { dryRun }) {
  if (!process.env.MONGO_URI) return { available: false, error: "MONGO_URI is not configured" };
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  if (!dryRun) await ensureResourceIndexes();
  const eligible = inventory.filter((item) => item.importStatus === "mapped");
  const urls = [...new Set(eligible.map((item) => item.url))];
  const sourceIds = [...new Set(eligible.map((item) => item.sourceId))];
  const known = new Map();
  const lookupBatches = [];
  for (let offset = 0; offset < Math.max(urls.length, sourceIds.length); offset += 500) {
    lookupBatches.push({
      $or: [
        { url: { $in: urls.slice(offset, offset + 500) } },
        { sourceId: { $in: sourceIds.slice(offset, offset + 500) } },
      ],
    });
  }
  const resourcesByBatch = await mapConcurrent(lookupBatches, 6, (filter) => (
    Resource.find(filter).select("url sourceId").lean()
  ));
  for (const resources of resourcesByBatch) {
    resources.forEach((resource) => {
      known.set(`url:${resource.url}`, resource);
      if (resource.sourceId) known.set(`sourceId:${resource.sourceId}`, resource);
    });
  }
  const actions = new Map();
  for (const item of eligible) {
    const existingById = known.get(`sourceId:${item.sourceId}`);
    const existingByUrl = known.get(`url:${item.url}`);
    if (existingById) actions.set(item.sourceId, "updated");
    else if (!existingByUrl) actions.set(item.sourceId, "added");
    else {
      actions.set(item.sourceId, "duplicate");
      item.importStatus = "duplicate";
      item.exclusionReason = "URL already exists as a curated resource with a different source identifier";
    }
  }
  return { available: true, actions };
}

async function writeResources(inventory, dryRun, sourceVersions) {
  const eligible = inventory.filter((item) => item.importStatus === "mapped");
  const firstByUrl = new Map();
  for (const item of eligible) {
    if (!firstByUrl.has(item.url)) {
      firstByUrl.set(item.url, {
        ...item,
        tags: [...item.tags],
        relatedDomains: [...item.relatedDomains],
        relatedRoles: [...item.relatedRoles],
        relatedSkills: [...item.relatedSkills],
        relatedTechnologies: [...item.relatedTechnologies],
        sourceItem: item,
      });
    }
    else {
      const first = firstByUrl.get(item.url);
      for (const field of ["tags", "relatedDomains", "relatedRoles", "relatedSkills", "relatedTechnologies"]) {
        first[field] = [...new Set([...(first[field] || []), ...(item[field] || [])])];
      }
      first.attribution = `${first.attribution}; also listed in ${item.sourceListRepository} (${item.sourceCategory}${item.sourceSubcategory ? ` / ${item.sourceSubcategory}` : ""})`;
      if (item.resourceType === "tutorial" && first.resourceType !== "tutorial") {
        Object.assign(first, {
          title: item.title,
          description: item.description,
          type: item.type,
          resourceType: item.resourceType,
          technology: item.technology,
          category: item.category,
          sourceCategory: item.sourceCategory,
          sourceSubcategory: item.sourceSubcategory,
        });
      }
      item.importStatus = "duplicate";
      item.exclusionReason = `Duplicate URL; imported record ${first.sourceId} represents this link`;
    }
  }
  const records = [...firstByUrl.values()];
  const dbStatus = await checkDatabaseStatus(records, { dryRun });
  if (!dryRun && !dbStatus.available) {
    throw new Error("MONGO_URI is required to import source resources; use --dry-run to inspect without a database");
  }
  if (dbStatus.available) {
    for (const item of records) {
      const action = dbStatus.actions.get(item.sourceId);
      if (action === "duplicate") {
        item.sourceItem.importStatus = "duplicate";
        item.sourceItem.exclusionReason = item.exclusionReason;
        continue;
      }
      item.importAction = action;
      item.sourceItem.importAction = action;
    }
  }

  const totals = { added: 0, updated: 0, duplicate: 0, excluded: inventory.filter((item) => item.importStatus === "excluded").length, failed: inventory.filter((item) => item.importStatus === "failed").length };
  for (const item of inventory) {
    if (item.importStatus === "duplicate") totals.duplicate += 1;
    if (item.importAction) totals[item.importAction] += 1;
  }
  if (dbStatus.available && !dryRun) {
    const fields = [
      "title", "description", "type", "url", "sourceRepository", "sourceListRepository", "sourceCategory", "sourceSubcategory", "sourceId",
      "sourceReference", "sourceUrl", "sourceLicense", "resourceType", "relatedDomains", "relatedRoles", "relatedSkills",
      "relatedTechnologies", "attribution", "importStatus", "technology", "category", "tags", "difficulty", "provider",
    ];
    const operations = records
      .filter((item) => item.importStatus !== "duplicate")
      .map((item) => {
        const data = Object.fromEntries(fields.map((field) => [field, item[field]]));
        if (!data.description) {
          data.description = item.resourceType === "tutorial"
            ? `Practical build for ${item.sourceSubcategory} using ${item.technology}; the source does not provide a separate description.`
            : "The source does not provide a separate description.";
        }
        data.provider = item.sourceRepository;
        return {
          updateOne: {
            filter: { sourceId: item.sourceId },
            update: { $set: data, $setOnInsert: { isCurated: true, branches: [] } },
            upsert: true,
          },
        };
      });
    await writeBulkBatches(Resource, operations, "resources");
    const inventoryById = new Map();
    for (const item of inventory) inventoryById.set(item.sourceId, item);
    const inventoryOperations = [...inventoryById.values()].map((item) => ({
      updateOne: {
        filter: { sourceId: item.sourceId },
        update: {
          $set: {
            ...Object.fromEntries([
              "sourceRepository", "sourceListRepository", "sourceCategory", "sourceSubcategory", "title", "description", "url",
              "sourceReference", "sourceUrl", "sourceLicense", "type", "resourceType", "technology", "relatedDomains",
              "relatedRoles", "relatedSkills", "relatedTechnologies", "importStatus", "exclusionReason", "sourceLine",
            ].map((field) => [field, item[field]])),
            sourceVersion: sourceVersions[item.sourceRepository] || "",
            lastSeenAt: new Date(),
          },
          $setOnInsert: { sourceId: item.sourceId },
        },
        upsert: true,
      },
    }));
    await writeBulkBatches(SourceInventory, inventoryOperations, "inventory records");
    totals.imported = totals.added + totals.updated;
  } else {
    totals.imported = 0;
  }
  return { totals, database: dbStatus.available ? "connected" : "not configured" };
}

async function main() {
  const options = optionsFromArgs(process.argv.slice(2));
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "preyeah-source-import-"));
  let connected = false;
  try {
    if (!options.dryRun && process.env.NODE_ENV === "production" && !options.allowProduction) {
      throw new Error("Production imports require the explicit --allow-production option");
    }
    const sourceVersions = {};
    for (const repository of REPOSITORIES) {
      sourceVersions[repository.slug] = cloneRepository(repository, path.join(tempDirectory, repository.folder));
    }
    const { items, failedRepositories } = await loadSourceItems(tempDirectory, sourceVersions, options);
    const report = duplicateAndCoverage(items, failedRepositories, sourceVersions);
    report.dryRun = options.dryRun;
    const result = await writeResources(report.inventory, options.dryRun, sourceVersions);
    report.database = result.database;
    report.totals = report.inventory.reduce((counts, item) => {
      counts.discovered += 1;
      counts[item.importStatus] += 1;
      return counts;
    }, { discovered: 0, mapped: 0, duplicate: 0, excluded: 0, failed: 0, imported: result.totals.imported, added: result.totals.added, updated: result.totals.updated });
    report.categories = {};
    report.repositories = {};
    report.domainCoverage = Object.fromEntries(CAREER_DOMAIN_CATALOG.map((domain) => [domain.slug, 0]));
    report.roleCoverage = {};
    for (const item of report.inventory) {
      const categoryKey = `${item.sourceRepository} / ${item.sourceCategory}${item.sourceSubcategory ? ` / ${item.sourceSubcategory}` : ""}`;
      report.categories[categoryKey] ||= { discovered: 0, mapped: 0, duplicate: 0, excluded: 0, failed: 0 };
      report.categories[categoryKey].discovered += 1;
      report.categories[categoryKey][item.importStatus] += 1;
      report.repositories[item.sourceRepository] ||= { discovered: 0, mapped: 0, duplicate: 0, excluded: 0, failed: 0, imported: 0, added: 0, updated: 0 };
      const repo = report.repositories[item.sourceRepository];
      repo.discovered += 1;
      repo[item.importStatus] += 1;
      if (item.importAction) {
        repo[item.importAction] += 1;
        if (!options.dryRun && (item.importAction === "added" || item.importAction === "updated")) repo.imported += 1;
      }
      if (item.importStatus === "mapped") {
        for (const domain of item.relatedDomains) report.domainCoverage[domain] = (report.domainCoverage[domain] || 0) + 1;
        for (const role of item.relatedRoles) report.roleCoverage[role] = (report.roleCoverage[role] || 0) + 1;
      }
    }
    report.incompleteCategories = Object.entries(report.categories)
      .filter(([, values]) => values.excluded > 0 || values.failed > 0)
      .map(([category, counts]) => ({ category, ...counts }));

    if (options.reportPath) {
      const reportPath = path.resolve(options.reportPath);
      await mkdir(path.dirname(reportPath), { recursive: true });
      await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
      logger.info(`Coverage report written to ${reportPath}`);
    }
    console.log(JSON.stringify({
      dryRun: options.dryRun,
      sourceVersions,
      database: report.database,
      totals: report.totals,
      repositories: report.repositories,
      incompleteCategories: report.incompleteCategories.length,
      failedRepositories: failedRepositories.length,
      coverageReport: options.reportPath ? path.resolve(options.reportPath) : "not written (pass --report <path>)",
    }, null, 2));
  } catch (error) {
    logger.error("Source import failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState) connected = true;
    if (connected) await mongoose.disconnect();
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

main();
