import {
  FaBookmark,
  FaBullseye,
  FaCommentDots,
  FaCompass,
  FaHouse,
} from "react-icons/fa6";
import WorkspaceLayout from "./WorkspaceLayout.jsx";

const GUIDE_NAV_ITEMS = [
  { to: "/guide-panel", label: "Branch Guidance", icon: FaHouse, end: true },
  { to: "/chat", label: "Mentorship Inbox", icon: FaCommentDots },
  { to: "/roles", label: "Roles Catalog", icon: FaCompass },
  { to: "/resources", label: "Resources", icon: FaBookmark },
  { to: "/beyond", label: "Beyond Degree", icon: FaBullseye },
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
