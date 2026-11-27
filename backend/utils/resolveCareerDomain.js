import ApiError from "./ApiError.js";

export async function resolveCareerDomain(CareerDomain, { domainId, domain }) {
  if (domainId) {
    const record = await CareerDomain.findById(domainId);
    if (!record) throw ApiError.notFound("Career domain not found");
    return record;
  }

  const value = typeof domain === "string" ? domain.trim() : "";
  if (!value) return null;
  const isLegacyGovernmentDomain = value.toLowerCase() === "law-public"
    || value.toLowerCase() === "law & public services";
  const normalizedValue = isLegacyGovernmentDomain ? "government-careers" : value;
  const normalizedName = isLegacyGovernmentDomain ? "Government Careers" : value;

  return CareerDomain.findOne({
    $or: [{ name: normalizedName }, { slug: normalizedValue.toLowerCase() }],
  });
}
