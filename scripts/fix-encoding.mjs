import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const textFilePattern = /\.(?:[cm]?js|jsx|ts|tsx|css|scss|html|json|md|mdx|txt|ya?ml|toml|xml|svg|sh|ps1|py|sql|env|example)$/i;
const startsOfMojibakeRuns = /[\u00c3\u00c2\u00e2][\u0080-\u00ff\u201a-\u203a\u20ac]{1,16}/gu;
const legacySalaryMigration = "backend/scripts/migrateCareerReality.js";
const legacySalaryMojibake = "\u00e2\u201a\u00b9";
const cp1252SpecialBytes = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
  [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
  [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
  [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
  [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
  [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
]);
const cp1252UndefinedBytes = new Set([0x81, 0x8d, 0x8f, 0x90, 0x9d]);

function encodeLegacyRun(value, encoding) {
  const bytes = [];
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (encoding === "latin1" && codePoint <= 0xff) {
      bytes.push(codePoint);
    } else if (encoding === "windows-1252" && codePoint <= 0xff && !cp1252UndefinedBytes.has(codePoint)) {
      bytes.push(codePoint);
    } else if (encoding === "windows-1252" && cp1252SpecialBytes.has(codePoint)) {
      bytes.push(cp1252SpecialBytes.get(codePoint));
    } else {
      return null;
    }
  }
  return Buffer.from(bytes);
}

function decodeUtf8(bytes) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function roundTrips(value, original, encoding) {
  const originalBytes = encodeLegacyRun(original, encoding);
  return originalBytes !== null && Buffer.from(value, "utf8").equals(originalBytes);
}

function repairRun(value) {
  for (const encoding of ["windows-1252", "latin1"]) {
    const legacyBytes = encodeLegacyRun(value, encoding);
    if (!legacyBytes) continue;
    const repaired = decodeUtf8(legacyBytes);
    if (repaired && repaired !== value && roundTrips(repaired, value, encoding)) {
      return repaired;
    }
  }
  return value;
}

function isPreservedLegacySalary(pathname, value) {
  return pathname === legacySalaryMigration && value === legacySalaryMojibake;
}

function repairText(source, pathname) {
  let text = source;
  let repairs = 0;
  const originals = [];

  for (let pass = 0; pass < 3; pass += 1) {
    startsOfMojibakeRuns.lastIndex = 0;
    let passRepairs = 0;
    text = text.replace(startsOfMojibakeRuns, (match) => {
      if (isPreservedLegacySalary(pathname, match)) return match;
      const repaired = repairRun(match);
      if (repaired === match) return match;
      passRepairs += 1;
      originals.push({ before: match, after: repaired });
      return repaired;
    });
    repairs += passRepairs;
    if (passRepairs === 0) break;
  }

  return { text, repairs, originals };
}

function signaturesIn(value) {
  startsOfMojibakeRuns.lastIndex = 0;
  return [...value.matchAll(startsOfMojibakeRuns)].map(([match]) => match);
}

function selfTest() {
  assert.equal(repairRun(legacySalaryMojibake), "\u20b9");
  assert.equal(repairRun("\u00c3\u00a2"), "\u00e2");
  assert.equal(repairRun("plain text"), "plain text");
  assert.equal(isPreservedLegacySalary(legacySalaryMigration, legacySalaryMojibake), true);
  assert.equal(isPreservedLegacySalary("README.md", legacySalaryMojibake), false);
  console.log("Encoding repair self-test passed.");
}

function parseArgs(args) {
  const modes = args.filter((arg) => ["--apply", "--dry-run", "--check"].includes(arg));
  if (modes.length > 1) throw new Error("Choose only one of --apply, --dry-run, or --check.");
  for (const arg of args) {
    if (!["--apply", "--dry-run", "--check", "--self-test"].includes(arg)) {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return modes[0] || "--dry-run";
}

function invalidUtf8Offset(buffer) {
  for (let index = 0; index < buffer.length;) {
    const first = buffer[index];
    if (first <= 0x7f) {
      index += 1;
      continue;
    }

    let length;
    if (first >= 0xc2 && first <= 0xdf) length = 2;
    else if (first >= 0xe0 && first <= 0xef) length = 3;
    else if (first >= 0xf0 && first <= 0xf4) length = 4;
    else return index;
    if (index + length > buffer.length) return index;

    const second = buffer[index + 1];
    if (second < 0x80 || second > 0xbf) return index + 1;
    if (first === 0xe0 && second < 0xa0) return index;
    if (first === 0xed && second > 0x9f) return index;
    if (first === 0xf0 && second < 0x90) return index;
    if (first === 0xf4 && second > 0x8f) return index;
    for (let offset = 2; offset < length; offset += 1) {
      if (buffer[index + offset] < 0x80 || buffer[index + offset] > 0xbf) return index + offset;
    }
    index += length;
  }
  return -1;
}

async function main() {
  if (process.argv.includes("--self-test")) selfTest();
  const mode = parseArgs(process.argv.slice(2));
  const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).split("\0").filter((filename) => textFilePattern.test(filename));
  let changedFiles = 0;
  let invalidFiles = 0;
  let remainingMojibake = 0;

  for (const filename of trackedFiles) {
    const filePath = path.join(repoRoot, filename);
    try {
      await stat(filePath);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    const buffer = await readFile(filePath);
    if (buffer.includes(0)) continue;

    const hasBom = buffer.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]));
    const content = hasBom ? buffer.subarray(3) : buffer;
    const invalidOffset = invalidUtf8Offset(content);
    if (invalidOffset >= 0) {
      invalidFiles += 1;
      console.error(`INVALID UTF-8 ${filename}: byte offset ${invalidOffset + (hasBom ? 3 : 0)}`);
      continue;
    }

    const original = content.toString("utf8");
    const { text: repaired, repairs, originals } = repairText(original, filename);
    const hasChanges = hasBom || repairs > 0;
    if (hasChanges) {
      changedFiles += 1;
      const action = mode === "--apply" ? "REWRITING" : mode === "--check" ? "NEEDS REPAIR" : "WOULD REWRITE";
      console.log(`${action} ${filename}: ${repairs} repaired run(s)${hasBom ? ", UTF-8 BOM removed" : ""}`);
      for (const item of originals) console.log(`  ${JSON.stringify(item.before)} -> ${JSON.stringify(item.after)}`);
      if (mode === "--apply") await writeFile(filePath, repaired, "utf8");
    }

    const signatures = signaturesIn(repaired).filter(
      (signature) => !isPreservedLegacySalary(filename, signature)
    );
    if (signatures.length > 0) {
      remainingMojibake += signatures.length;
      if (mode === "--check") {
        console.error(`MOJIBAKE ${filename}: ${signatures.join(", ")}`);
      }
    }
  }

  console.log(
    `Encoding scan complete (${mode}): ${trackedFiles.length} tracked text files, ${changedFiles} needing changes, ${invalidFiles} invalid UTF-8 file(s), ${remainingMojibake} unhandled mojibake run(s).`
  );
  if (mode === "--check" && (changedFiles > 0 || invalidFiles > 0 || remainingMojibake > 0)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Encoding scan failed: ${error.message}`);
  process.exitCode = 1;
});
