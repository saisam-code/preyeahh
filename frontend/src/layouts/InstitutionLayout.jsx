import { FaBuildingColumns } from "react-icons/fa6";
import WorkspaceLayout from "./WorkspaceLayout.jsx";

const INSTITUTION_NAV_ITEMS = [
  { to: "/institution-portal", label: "Command Center", icon: FaBuildingColumns, end: true },
];

export default function InstitutionLayout() {
  return (
    <WorkspaceLayout
      roleLabel="INSTITUTION"
      homePath="/institution-portal"
      navItems={INSTITUTION_NAV_ITEMS}
    />
  );
}
