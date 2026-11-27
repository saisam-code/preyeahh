import test from "node:test";
import assert from "node:assert/strict";
import { assignUniqueInventoryIds, markSparseLists } from "../services/sourceImportInventory.js";

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

test("records stable nested-list mapped counts and excludes sparse lists", () => {
  const items = [
    { sourceId: "a", sourceRepository: "sindresorhus/awesome", sourceListRepository: "owner/large-list", importStatus: "mapped" },
    { sourceId: "b", sourceRepository: "sindresorhus/awesome", sourceListRepository: "owner/large-list", importStatus: "mapped" },
    { sourceId: "c", sourceRepository: "sindresorhus/awesome", sourceListRepository: "owner/large-list", importStatus: "mapped" },
    { sourceId: "d", sourceRepository: "sindresorhus/awesome", sourceListRepository: "owner/sparse-list", importStatus: "mapped" },
    { sourceId: "root", sourceRepository: "sindresorhus/awesome", sourceListRepository: "sindresorhus/awesome", importStatus: "mapped" },
  ];

  const result = markSparseLists(items);

  assert.equal(result[0].sourceListMappedCount, 3);
  assert.equal(result[2].importStatus, "mapped");
  assert.equal(result[3].sourceListMappedCount, 1);
  assert.equal(result[3].importStatus, "excluded");
  assert.equal(result[3].exclusionReason, "SPARSE_LIST");
  assert.equal(result[4].sourceListMappedCount, undefined);
});
