/**
 * Escapes a user-supplied string so it is safe to embed in a RegExp.
 * Without this, strings like "(admin)" or ".*" can be used as regex injection.
 *
 * Usage:
 *   import escapeRegex from "../utils/escapeRegex.js";
 *   const filter = { name: { $regex: escapeRegex(req.query.q), $options: "i" } };
 */
export default function escapeRegex(str) {
  if (typeof str !== "string") return "";
  // Escape all regex special characters
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
