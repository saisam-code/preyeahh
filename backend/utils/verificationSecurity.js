function toPlainObject(value) {
  if (value && typeof value.toObject === "function") return value.toObject();
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function sanitizeContributorReality(reality) {
  const sanitized = { ...toPlainObject(reality), verification: { status: "UNVERIFIED" } };

  if (sanitized.salaryRange !== undefined) {
    const salaryRange = { ...toPlainObject(sanitized.salaryRange) };
    for (const field of ["starting", "mid", "experienced"]) {
      const fact = salaryRange[field];
      if (fact && typeof fact === "object" && fact.kind === "VERIFIED") {
        salaryRange[field] = { ...fact, kind: "UNVERIFIED" };
      }
    }
    sanitized.salaryRange = salaryRange;
  }

  for (const field of ["demandLevel", "competitionLevel"]) {
    const fact = sanitized[field];
    if (fact && typeof fact === "object" && fact.kind === "VERIFIED") {
      sanitized[field] = { ...fact, kind: "UNVERIFIED" };
    }
  }

  return sanitized;
}

export function applyTrustedVerification(requested, userId, current = {}) {
  const metadata = { ...toPlainObject(current), ...toPlainObject(requested) };
  metadata.verifiedBy = metadata.status === "VERIFIED" ? userId : null;
  metadata.verifiedAt = metadata.status === "VERIFIED" ? new Date() : null;
  return metadata;
}
