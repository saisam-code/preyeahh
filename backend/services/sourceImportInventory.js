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
