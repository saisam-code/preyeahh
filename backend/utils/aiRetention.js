export const RETENTION_DAYS = 7;

export function getRetentionExpiryDate(anchor = new Date()) {
  const baseDate = anchor instanceof Date ? new Date(anchor.getTime()) : new Date(anchor);
  baseDate.setDate(baseDate.getDate() + RETENTION_DAYS);
  return baseDate;
}

export function isExpiredAt(expiryDate, now = new Date()) {
  const expiry = expiryDate instanceof Date ? expiryDate : new Date(expiryDate);
  if (!Number.isFinite(expiry.getTime())) return false;
  return expiry.getTime() <= new Date(now).getTime();
}
