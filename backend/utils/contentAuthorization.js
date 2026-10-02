import ApiError from "../utils/ApiError.js";

export function contributorSnapshot(user) {
  return {
    userId: user.id,
    name: user.doc?.name || user.name || (user.role === "admin" ? "Preyeahh Admin" : "Guide"),
    role: user.role,
  };
}

export function assertGuideOwnsContent(entry, user) {
  if (user.role === "guide" && String(entry.createdBy?.userId || "") !== user.id) {
    throw ApiError.forbidden("Only the original contributor can edit or delete this entry. Please ask them or an admin.");
  }
}

export function recordContentEdit(entry, user) {
  entry.editHistory.push({ ...contributorSnapshot(user), editedAt: new Date() });
}