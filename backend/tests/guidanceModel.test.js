import test from "node:test";
import assert from "node:assert/strict";
import Guidance from "../models/Guidance.js";

test("Guidance branch setter preserves 'All' sentinel without uppercasing it to 'ALL'", () => {
  const g1 = new Guidance({
    title: "Global Engineering Roadmap",
    branch: "all",
    points: ["Master algorithms"],
  });
  assert.equal(g1.branch, "All", "Branch 'all' must be normalized to 'All'");

  const g2 = new Guidance({
    title: "Global Engineering Roadmap 2",
    branch: "ALL",
    points: ["Master system design"],
  });
  assert.equal(g2.branch, "All", "Branch 'ALL' must be normalized to 'All'");

  const g3 = new Guidance({
    title: "CSE Department Roadmap",
    branch: "cse",
    points: ["Data structures"],
  });
  assert.equal(g3.branch, "CSE", "Specific department branch must be uppercased");
});
