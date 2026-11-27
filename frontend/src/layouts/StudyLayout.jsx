import { NavLink, Outlet } from "react-router-dom";

const STUDY_TABS = [
  { to: "/study/planner", label: "Planner", end: true },
  { to: "/study/roadmaps", label: "Roadmaps" },
  { to: "/study/quiz", label: "Quiz & Learn" },
  { to: "/study/chat", label: "Chat" },
  { to: "/study/tools", label: "Tools", end: true },
];

export default function StudyLayout() {
  return (
    <main className="study-page">
      <nav className="type-tabs study-tabs" aria-label="Study area">
        {STUDY_TABS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `tab${isActive ? " active" : ""}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </main>
  );
}
