import {
  FaCompass,
  FaBookOpen,
  FaHouse,
  FaUser,
} from "react-icons/fa6";
import WorkspaceLayout from "./WorkspaceLayout.jsx";

const STUDENT_NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: FaHouse, end: true },
  { to: "/explore", label: "Explore", icon: FaCompass, groupLabel: "DISCOVER" },
  { to: "/study", label: "Study", icon: FaBookOpen, groupLabel: "LEARN" },
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
