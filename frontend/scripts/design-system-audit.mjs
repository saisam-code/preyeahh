import { readFile } from "node:fs/promises";
import { CAREER_DOMAINS, WHEEL_DOMAIN_COLORS } from "../src/data/careerWheelData.js";
import { getEducationMaturityStage, STUDENT_EDUCATION_STAGES } from "../../shared/educationStages.js";
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

const light = block(":root {");
const dark = block('[data-theme="dark"] {');
const checks = [
  ["light primary on white", variable(light, "primary"), "#FFFFFF"],
  ["light primary-hover on white", variable(light, "primary-hover"), "#FFFFFF"],
  ["light ink-900 on white", variable(light, "ink-900"), "#FFFFFF"],
  ["light ink-600 on white", variable(light, "ink-600"), "#FFFFFF"],
  ["light ink-900 on paper", variable(light, "ink-900"), variable(light, "paper")],
  ["light accent with ink-900", variable(light, "ink-900"), variable(light, "accent")],
  ["dark text on surface", variable(dark, "ink-900"), variable(dark, "surface")],
  ["dark muted text on surface", variable(dark, "ink-600"), variable(dark, "surface")],
  ["dark primary with button foreground", variable(dark, "primary"), variable(dark, "on-primary")],
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

for (const stage of STUDENT_EDUCATION_STAGES) {
  const expected = stage.startsWith("Class ")
    ? Number(stage.slice(6)) <= 7 ? "junior" : Number(stage.slice(6)) <= 10 ? "teen" : "senior"
    : stage === "Intermediate"
      ? "senior"
      : ["Diploma", "Undergraduate", "Postgraduate"].includes(stage)
        ? "pro"
        : "research";
  if (getEducationMaturityStage(stage) !== expected) {
    failures.push(`education stage mapping for ${stage}`);
  }
}

if (failures.length) {
  console.error(`Contrast audit failed: ${failures.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("Contrast audit passed: all checked pairs meet WCAG AA text contrast.");
}
