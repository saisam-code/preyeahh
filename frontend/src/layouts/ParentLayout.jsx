import { FaHouse } from "react-icons/fa6";
import WorkspaceLayout from "./WorkspaceLayout.jsx";

const PARENT_NAV_ITEMS = [
  { to: "/parent-portal", label: "Parent Dashboard", icon: FaHouse, end: true },
];

export default function ParentLayout() {
  return (
    <WorkspaceLayout
      roleLabel="PARENT"
      homePath="/parent-portal"
      navItems={PARENT_NAV_ITEMS}
    />
  );
}
