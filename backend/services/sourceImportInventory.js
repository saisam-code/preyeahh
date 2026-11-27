export function assignUniqueInventoryIds(items) {
  const occurrences = new Map();
  return items.map((item) => {
    const output = { ...item };
    const sourceId = output.sourceId;
    const occurrence = (occurrences.get(sourceId) || 0) + 1;
    occurrences.set(sourceId, occurrence);
    if (occurrence === 1) return output;

    output.sourceId = `${sourceId}:occurrence-${occurrence}`;
    output.duplicateOf = sourceId;
    if (output.importStatus !== "excluded") {
      output.importStatus = "duplicate";
      output.exclusionReason = "Duplicate source item identifier";
    }
    return output;
  });
}

export function markSparseLists(items) {
  const mappedByList = new Map();
  for (const item of items) {
    if (item.importStatus !== "mapped" || !item.sourceListRepository || item.sourceListRepository === item.sourceRepository) continue;
    mappedByList.set(item.sourceListRepository, (mappedByList.get(item.sourceListRepository) || 0) + 1);
  }

  return items.map((item) => {
    if (item.importStatus !== "mapped" || !item.sourceListRepository || item.sourceListRepository === item.sourceRepository) {
      return item;
    }
    const sourceListMappedCount = mappedByList.get(item.sourceListRepository) || 0;
    return sourceListMappedCount < 3
      ? { ...item, sourceListMappedCount, importStatus: "excluded", exclusionReason: "SPARSE_LIST" }
      : { ...item, sourceListMappedCount };
  });
}
