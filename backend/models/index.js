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
import "./CareerDomain.js";
import "./CareerSubdomain.js";
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
import "./SourceInventory.js";
import "./AIRoadmap.js";
import "./Quiz.js";
import "./QuizResult.js";
import "./MentorshipConversation.js";
import "./CareerIntelligence.js";
import "./PersonalCareerPlan.js";
import "./StudentDevelopment.js";
import "./StudentGoal.js";
import "./Institution.js";
import "./Parent.js";
import "./ParentLink.js";
import "./AuditLog.js";
import "./SafetyAndOutcomes.js";
import "./GovernmentCareer.js";
