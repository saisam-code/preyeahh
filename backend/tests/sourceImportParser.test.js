import test from "node:test";
import assert from "node:assert/strict";
import { parseAwesomeMarkdown, parseBuildYourOwnX } from "../services/sourceImportParser.js";

test("parses Awesome list links with category hierarchy and skips the contents index", () => {
  const markdown = [
    "## Contents",
    "- [Tools](#tools)",
    "## Platforms",
    "- [Node.js](https://github.com/sindresorhus/awesome-nodejs#readme) - Runtime resources",
    "### Backend",
    "- [PostgreSQL](https://www.postgresql.org/docs/) - Database documentation",
  ].join("\n");
  const items = parseAwesomeMarkdown(markdown, {
    repository: "sindresorhus/awesome",
    listRepository: "example/awesome-topic",
    parentCategory: "Programming Languages",
    parentTitle: "Python",
  });

  assert.equal(items.length, 2);
  assert.equal(items[0].sourceRepository, "sindresorhus/awesome");
  assert.equal(items[0].sourceListRepository, "example/awesome-topic");
  assert.equal(items[0].sourceCategory, "Programming Languages");
  assert.equal(items[0].title, "Node.js");
  assert.match(items[0].description, /Runtime resources/);
  assert.equal(items[1].sourceSubcategory, "Python / Platforms / Backend");
  assert.equal(items[1].resourceType, "documentation");
  assert.equal(items[1].importStatus, "mapped");
});

test("captures every Build Your Own X tutorial with its topic, language, title, and URL", () => {
  const markdown = [
    "## Tutorials",
    "#### Build your own `Database`",
    "* [**Rust**: _Mini-LSM: Build a Database Storage Engine in Rust_](https://example.com/database)",
    "#### Build your own `AI Model`",
    "* [**Python**: _A Large Language Model (LLM)_](https://example.com/llm)",
    "## Origins & License",
    "* [**Go**: _Not a tutorial entry_](https://example.com/outside)",
  ].join("\n");
  const items = parseBuildYourOwnX(markdown, { repository: "codecrafters-io/build-your-own-x" });

  assert.equal(items.length, 2);
  assert.equal(items[0].sourceSubcategory, "Database");
  assert.equal(items[0].title, "Mini-LSM: Build a Database Storage Engine in Rust");
  assert.deepEqual(items[0].relatedTechnologies, ["rust"]);
  assert.equal(items[0].resourceType, "tutorial");
  assert.equal(items[0].description, "");
  assert.equal(items[1].sourceSubcategory, "AI Model");
  assert.equal(items[1].url, "https://example.com/llm");
});

test("uses nested-list context for domain mapping and preserves non-HTTP source links", () => {
  const items = parseAwesomeMarkdown([
    "## Resources",
    "- [Vulkan guide](https://example.com/vulkan)",
    "- [Local guide](./guide.md)",
  ].join("\n"), {
    repository: "sindresorhus/awesome",
    listRepository: "vinjn/awesome-vulkan",
    parentCategory: "Miscellaneous",
    parentTitle: "Awesome Vulkan",
  });

  assert.ok(items[0].relatedDomains.includes("tech-eng"));
  assert.equal(items[1].url, "./guide.md");
  assert.equal(items[1].importStatus, "excluded");
});

test("resolves relative documentation against its source repository and skips image assets", () => {
  const items = parseAwesomeMarkdown([
    "## Resources",
    "- [Guide](topics/guides.md)",
    "- [Logo](fig/logo.svg)",
    "- [Issue](<https://github.com/example/project/issues/1>)",
  ].join("\n"), {
    repository: "sindresorhus/awesome",
    listRepository: "example/awesome-topic",
    parentCategory: "Programming Languages",
    baseUrl: "https://github.com/example/awesome-topic/blob/main/README.md",
  });

  assert.equal(items.length, 2);
  assert.equal(items[0].url, "https://github.com/example/awesome-topic/blob/main/topics/guides.md");
  assert.equal(items[0].sourceReference, "topics/guides.md");
  assert.equal(items[0].resourceType, "documentation");
  assert.equal(items[1].url, "https://github.com/example/project/issues/1");
});

test("normalizes bare web hosts and maps interdisciplinary nested-list topics", () => {
  const items = parseAwesomeMarkdown([
    "## Tools",
    "- [Cancer browser](github.com/example/cancer-browser)",
  ].join("\n"), {
    repository: "sindresorhus/awesome",
    listRepository: "keller-mark/awesome-biological-visualizations",
    parentCategory: "Miscellaneous",
  });

  assert.equal(items[0].url, "https://github.com/example/cancer-browser");
  assert.ok(items[0].relatedDomains.includes("science-res"));
});

test("marks source entries without a defensible career-domain match as excluded", () => {
  const items = parseAwesomeMarkdown(
    "## Miscellaneous\n- [Unknown topic](https://example.com/unknown)",
    { repository: "sindresorhus/awesome" }
  );
  assert.equal(items[0].importStatus, "excluded");
  assert.match(items[0].exclusionReason, /No reliable career-domain mapping/);
});
