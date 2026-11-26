import test from "node:test";
import assert from "node:assert/strict";
import { assignUniqueInventoryIds } from "../services/sourceImportInventory.js";

test("keeps every repeated source item as a uniquely identified inventory entry", () => {
  const items = [
    { sourceId: "source:abc", importStatus: "mapped" },
    { sourceId: "source:abc", importStatus: "mapped" },
    { sourceId: "source:abc", importStatus: "excluded", exclusionReason: "No mapping" },
  ];

  const inventory = assignUniqueInventoryIds(items);

  assert.deepEqual(inventory.map((item) => item.sourceId), [
    "source:abc",
    "source:abc:occurrence-2",
    "source:abc:occurrence-3",
  ]);
  assert.equal(inventory[1].importStatus, "duplicate");
  assert.equal(inventory[1].duplicateOf, "source:abc");
  assert.equal(inventory[2].importStatus, "excluded");
  assert.equal(inventory[2].exclusionReason, "No mapping");
});
