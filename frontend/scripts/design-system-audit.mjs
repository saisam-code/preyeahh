import { readdir, readFile } from "node:fs/promises";
import { CAREER_DOMAINS, WHEEL_DOMAIN_COLORS } from "../src/data/careerWheelData.js";
import { EDUCATION_STAGES, getEducationMaturityStage, STUDENT_EDUCATION_STAGES } from "../../shared/educationStages.js";
import { contrastRatio, wheelLabelPresentation } from "../src/utils/contrast.js";

const tokensPath = new URL("../src/styles/tokens.css", import.meta.url);
const css = await readFile(tokensPath, "utf8");

function block(selector) {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`Missing token selector: ${selector}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

function variable(source, name) {
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(source);
  if (!match) throw new Error(`Missing token --${name}`);
  return match[1].trim();
}

const light = block(":root,");
const dark = block('[data-theme="dark"] {');
const checks = [
  ["light primary on white", variable(light, "primary"), "#FFFFFF"],
  ["light primary-hover on white", variable(light, "primary-hover"), "#FFFFFF"],
  ["light ink-900 on white", variable(light, "ink-900"), "#FFFFFF"],
  ["light ink-600 on white", variable(light, "ink-600"), "#FFFFFF"],
  ["light success text", variable(light, "success"), "#FFFFFF"],
  ["light warning text", variable(light, "warning-text"), "#FFFFFF"],
  ["light danger text", variable(light, "danger-text"), "#FFFFFF"],
  ["light info text", variable(light, "info-text"), "#FFFFFF"],
  ["light text on success fill", variable(light, "on-success"), variable(light, "success")],
  ["light text on warning fill", variable(light, "on-warning"), variable(light, "warning")],
  ["light text on danger fill", variable(light, "on-danger"), variable(light, "danger")],
  ["light ink-900 on paper", variable(light, "ink-900"), variable(light, "paper")],
  ["light accent with ink-900", variable(light, "ink-900"), variable(light, "accent")],
  ["dark text on surface", variable(dark, "ink-900"), variable(dark, "surface")],
  ["dark muted text on surface", variable(dark, "ink-600"), variable(dark, "surface")],
  ["dark primary with button foreground", variable(dark, "primary"), variable(dark, "on-primary")],
  ["dark success text", variable(dark, "success"), variable(dark, "surface")],
  ["dark warning text", variable(dark, "warning-text"), variable(dark, "surface")],
  ["dark danger text", variable(dark, "danger-text"), variable(dark, "surface")],
  ["dark info text", variable(dark, "info-text"), variable(dark, "surface")],
];
const wheelInk = variable(light, "wheel-label-dark");
const wheelLight = variable(light, "wheel-label-light");
const failures = [];

for (const [label, foreground, background] of checks) {
  const ratio = contrastRatio(foreground, background);
  console.log(`${ratio >= 4.5 ? "PASS" : "FAIL"} ${label}: ${ratio.toFixed(2)}:1`);
  if (ratio < 4.5) failures.push(label);
}

for (const [id, color] of Object.entries(WHEEL_DOMAIN_COLORS)) {
  const label = wheelLabelPresentation(color, wheelInk, wheelLight);
  const backing = label.background === "transparent" ? color : label.background;
  const ratio = contrastRatio(label.foreground, backing);
  console.log(`${ratio >= 4.5 ? "PASS" : "FAIL"} wheel ${id}: ${ratio.toFixed(2)}:1${label.background === "transparent" ? "" : " (contrast plate)"}`);
  if (ratio < 4.5) failures.push(`wheel ${id}`);
}

const domainIds = new Set(CAREER_DOMAINS.map(({ id }) => id));
if (Object.keys(WHEEL_DOMAIN_COLORS).length !== 12 || domainIds.size !== 12
  || [...domainIds].some((id) => !WHEEL_DOMAIN_COLORS[id])) {
  failures.push("wheel palette must map all 12 unique domain IDs");
}

for (const stage of EDUCATION_STAGES) {
  const classNumber = /^Class (\d+)$/.exec(stage)?.[1];
  const expected = stage === "Class 6-8"
    ? "junior"
    : stage === "Class 9-10"
      ? "teen"
      : stage === "Intermediate" || stage.includes("Class 11-12")
        ? "senior"
        : classNumber
          ? Number(classNumber) <= 7 ? "junior" : Number(classNumber) <= 10 ? "teen" : "senior"
          : ["Diploma", "Undergraduate", "Postgraduate"].includes(stage)
            ? "pro"
            : "research";
  if (getEducationMaturityStage(stage) !== expected) {
    failures.push(`education stage mapping for ${stage}`);
  }

  async function auditStyleSources(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
      if (entry.isDirectory()) {
        await auditStyleSources(file);
        continue;
      }
      if (!/\.(jsx?|css)$/.test(entry.name) || entry.name === "tokens.css" || entry.name === "careerWheelData.js") continue;
      const source = await readFile(file, "utf8");
      const violations = [
        /#[\da-f]{3,8}\b|rgba?\s*\(/i.test(source) && "raw color literal",
        /(?:fontSize\s*:\s*["']?\d|font-size\s*:\s*\d)/i.test(source) && "raw font-size",
        /(?:borderRadius\s*:\s*["']?\d|border-radius\s*:\s*[1-9])/i.test(source) && "raw border-radius",
      ].filter(Boolean);
      if (violations.length) failures.push(`${file.pathname}: ${violations.join(", ")}`);
    }
  }

  await auditStyleSources(new URL("../src/", import.meta.url));
}

if (failures.length) {
  console.error(`Contrast audit failed: ${failures.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("Contrast audit passed: all checked pairs meet WCAG AA text contrast.");
}
