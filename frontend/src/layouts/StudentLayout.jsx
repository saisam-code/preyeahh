import {
  FaCalendarCheck,
  FaCommentDots,
  FaCompass,
  FaGraduationCap,
  FaHouse,
  FaMap,
  FaUser,
} from "react-icons/fa6";
import WorkspaceLayout from "./WorkspaceLayout.jsx";

const STUDENT_NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: FaHouse, end: true },
  { to: "/explore", label: "Explore", icon: FaCompass },
  { to: "/planner", label: "Career Planner", icon: FaCalendarCheck, groupLabel: "Study Area" },
  { to: "/roadmaps", label: "Roadmaps", icon: FaMap },
  { to: "/quiz", label: "Quiz & Learn", icon: FaGraduationCap },
  { to: "/chat", label: "Mentorship Chat", icon: FaCommentDots },
  { to: "/profile", label: "My Profile", icon: FaUser },
];

export default function StudentLayout() {
  return (
    <WorkspaceLayout
      roleLabel="STUDENT"
      homePath="/dashboard"
      navItems={STUDENT_NAV_ITEMS}
    />
  );
}
