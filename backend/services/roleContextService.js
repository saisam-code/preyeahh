import Role from "../models/Role.js";
import ApiError from "../utils/ApiError.js";

/**
 * Loads a Role and returns the slice of its human-curated guidance the AI
 * modules use as context. Returns null when no roleId is given.
 */
export async function getRoleContext(roleId) {
  if (!roleId) return null;
  const role = await Role.findById(roleId).lean();
  if (!role) throw ApiError.notFound("Role not found");
  return {
    id: role._id,
    title: role.title,
    branch: role.branch,
    type: role.type,
    overview: role.guidance?.overview || role.description || "",
    steps: role.guidance?.steps || [],
    skills: role.guidance?.skills || [],
  };
}
