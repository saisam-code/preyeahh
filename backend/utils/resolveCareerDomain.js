import ApiError from "./ApiError.js";

export async function resolveCareerDomain(CareerDomain, { domainId, domain }) {
  if (domainId) {
    const record = await CareerDomain.findById(domainId);
    if (!record) throw ApiError.notFound("Career domain not found");
    return record;
  }

  const value = typeof domain === "string" ? domain.trim() : "";
  if (!value) return null;

  return CareerDomain.findOne({
    $or: [{ name: value }, { slug: value.toLowerCase() }],
  });
}
