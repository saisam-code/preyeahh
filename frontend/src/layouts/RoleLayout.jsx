import { useAuth } from "../context/AuthContext.jsx";
import StudentLayout from "./StudentLayout.jsx";
import GuideLayout from "./GuideLayout.jsx";

/**
 * RoleLayout dynamically renders GuideLayout or StudentLayout based on user.role
 * for shared authenticated routes (/chat, /resources, /roles, /beyond)
 * eliminating route collisions.
 */
export default function RoleLayout() {
  const { user } = useAuth();
  if (user?.role === "guide") {
    return <GuideLayout />;
  }
  return <StudentLayout />;
}
