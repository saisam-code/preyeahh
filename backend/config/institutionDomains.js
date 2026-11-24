const configuredDomain = (process.env.INSTITUTION_GUIDE_EMAIL_DOMAIN || "").trim();

export const INSTITUTION_GUIDE_EMAIL_DOMAIN = (configuredDomain || "nbkrist.org")
  .toLowerCase()
  .replace(/^@/, "");

export function isInstitutionGuideEmail(email) {
  return typeof email === "string"
    && email.toLowerCase().endsWith(`@${INSTITUTION_GUIDE_EMAIL_DOMAIN}`);
}
