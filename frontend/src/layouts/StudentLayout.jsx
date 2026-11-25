import {
  FaBookmark,
  FaBullseye,
  FaBuildingColumns,
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
  { to: "/discovery", label: "Career Discovery", icon: FaCompass },
  { to: "/planner", label: "Career Planner", icon: FaCalendarCheck },
  { to: "/roadmaps", label: "Roadmaps", icon: FaMap },
  { to: "/quiz", label: "Quiz & Learn", icon: FaGraduationCap },
  { to: "/resources", label: "Resources", icon: FaBookmark },
  { to: "/chat", label: "Mentorship Chat", icon: FaCommentDots },
  { to: "/roles", label: "Roles Catalog", icon: FaCompass },
  { to: "/beyond", label: "Beyond Degree", icon: FaBullseye },
  { to: "/government-careers", label: "Government Careers", icon: FaBuildingColumns },
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
