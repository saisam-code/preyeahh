/**
 * Central model registry. Imported once from server.js (and scripts) so every
 * schema is registered with Mongoose before any request is handled.
 *
 * Why this exists: Role's and Branch's pre("findOneAndDelete") cascade hooks
 * call mongoose.model("Guidance") directly (to avoid a circular import).
 * If Guidance.js was never imported in the process, deleting a role would
 * throw MissingSchemaError.
 */
import "./Branch.js";
import "./Role.js";
import "./Guidance.js";
import "./Beyond.js";
import "./Student.js";
import "./Guide.js";
import "./Admin.js";
import "./RoleInterest.js";
import "./RoleRequest.js";
import "./Chat.js";
import "./Resource.js";
import "./AIRoadmap.js";
import "./Quiz.js";
import "./MentorshipConversation.js";
