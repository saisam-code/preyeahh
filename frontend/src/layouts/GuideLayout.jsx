import {
  FaBookmark,
  FaBullseye,
  FaCommentDots,
  FaCompass,
  FaPeopleGroup,
  FaHouse,
} from "react-icons/fa6";
import WorkspaceLayout from "./WorkspaceLayout.jsx";

const GUIDE_NAV_ITEMS = [
  { to: "/guide-panel", label: "Overview", icon: FaHouse, end: true },
  { to: "/study/chat", label: "Mentor chat", icon: FaCommentDots },
  { groupLabel: "CONTENT" },
  { to: "/roles", label: "Roles", icon: FaCompass },
  { to: "/resources", label: "Resources", icon: FaBookmark },
  { to: "/beyond", label: "Exams & Opportunities", icon: FaBullseye },
  { to: "/guide-panel#guidance", label: "Guidance plans", icon: FaBullseye },
  { to: "/guide-panel#subdomains", label: "Subdomains", icon: FaCompass },
  { to: "/guide-panel#students", label: "Students", icon: FaPeopleGroup },
  { to: "/guide-panel#requests", label: "Requests", icon: FaBookmark },
];

export default function GuideLayout() {
  return (
    <WorkspaceLayout
      roleLabel="GUIDE"
      homePath="/guide-panel"
      navItems={GUIDE_NAV_ITEMS}
    />
  );
}
