import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaChevronLeft,
  FaChevronRight,
  FaRightFromBracket,
} from "react-icons/fa6";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import preyeahhLogo from "../assets/preyeahh-logo.png";

export default function WorkspaceLayout({ roleLabel, homePath, navItems }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await logout();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div className="workspace-shell">
      <aside
        className={`workspace-sidebar${collapsed ? " workspace-sidebar--collapsed" : ""}`}
        aria-label={`${roleLabel} navigation`}
      >
        <div className="workspace-sidebar-brand">
          <Link to={homePath} className="workspace-brand-link" aria-label="Preyeahh home">
            <img src={preyeahhLogo} alt="" />
            <span className="workspace-sidebar-label">
              <strong>Preyeahh</strong>
              <small>{roleLabel}</small>
            </span>
          </Link>
        </div>

        <nav className="workspace-sidebar-nav" aria-label="Workspace pages">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                aria-label={item.label}
                className={({ isActive }) => `workspace-sidebar-link${isActive ? " active" : ""}`}
              >
                <Icon aria-hidden="true" />
                <span className="workspace-sidebar-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="workspace-sidebar-footer">
          <span className="workspace-sidebar-user" title={user?.name || roleLabel}>
            <span className="workspace-sidebar-avatar" aria-hidden="true">
              {(user?.name || roleLabel).slice(0, 1).toUpperCase()}
            </span>
            <span className="workspace-sidebar-label">{user?.name || roleLabel}</span>
          </span>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-topbar">
          <button
            type="button"
            className="workspace-menu-toggle workspace-menu-toggle--desktop"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
          <div className="workspace-topbar-spacer" />
          <ThemeToggle />
          <button
            type="button"
            className="workspace-topbar-signout"
            onClick={handleSignOut}
          >
            <FaRightFromBracket aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </header>
        <div className="workspace-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
