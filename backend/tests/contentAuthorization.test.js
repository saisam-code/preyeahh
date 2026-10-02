import test from "node:test";
import assert from "node:assert/strict";
import { assertGuideOwnsContent, contributorSnapshot, recordContentEdit } from "../utils/contentAuthorization.js";

const guide = { id: "guide-1", role: "guide", doc: { name: "A. Guide" } };
const ownedEntry = { createdBy: { userId: "guide-1", name: "A. Guide", role: "guide" } };

test("guides can manage content they originally contributed", () => {
  assert.doesNotThrow(() => assertGuideOwnsContent(ownedEntry, guide));
});

test("guides cannot edit legacy or other-contributor content", () => {
  for (const entry of [{ createdBy: null }, { createdBy: { userId: "guide-2" } }]) {
    assert.throws(() => assertGuideOwnsContent(entry, guide), (error) => error.statusCode === 403);
  }
});

test("admin edits are permitted and attributed to the editor", () => {
  const admin = { id: "admin-1", role: "admin", doc: { name: "Admin User" } };
  assert.doesNotThrow(() => assertGuideOwnsContent(ownedEntry, admin));

  const entry = { editHistory: [] };
  recordContentEdit(entry, admin);
  assert.deepEqual(contributorSnapshot(admin), { userId: "admin-1", name: "Admin User", role: "admin" });
  assert.equal(entry.editHistory[0].name, "Admin User");
  assert.ok(entry.editHistory[0].editedAt instanceof Date);
});
