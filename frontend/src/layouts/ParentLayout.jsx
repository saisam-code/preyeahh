import WorkspaceLayout from "./WorkspaceLayout.jsx";

export default function ParentLayout() {
  return (
    <WorkspaceLayout
      roleLabel="PARENT"
      homePath="/parent-portal"
      navItems={[]}
      hideSidebar
    />
  );
}
