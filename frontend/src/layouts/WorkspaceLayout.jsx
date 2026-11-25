import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaChevronLeft,
  FaChevronRight,
  FaBars,
  FaCircleUser,
  FaRightFromBracket,
  FaXmark,
} from "react-icons/fa6";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import preyeahhLogo from "../assets/preyeahh-logo.png";

export default function WorkspaceLayout({ roleLabel, homePath, navItems }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setAccountMenuOpen(false);
    await logout();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div className="workspace-shell">
      {mobileOpen && (
        <button
          type="button"
          className="workspace-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
        />
      )}
      <aside
        className={`workspace-sidebar${collapsed ? " workspace-sidebar--collapsed" : ""}${mobileOpen ? " workspace-sidebar--mobile-open" : ""}`}
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
          <button
            type="button"
            className="workspace-sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <FaXmark />
          </button>
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
                onClick={() => setMobileOpen(false)}
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
          <button
            type="button"
            className="workspace-sidebar-link workspace-sidebar-signout"
            onClick={handleSignOut}
            title="Sign out"
          >
            <FaRightFromBracket aria-hidden="true" />
            <span className="workspace-sidebar-label">Sign out</span>
          </button>
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
        </header>
        <div className="workspace-page-content">
          <Outlet />
        </div>
      </main>

      <nav className="workspace-mobile-dock" aria-label="Mobile quick actions">
        <div className="workspace-mobile-account">
          {accountMenuOpen && (
            <div className="workspace-mobile-account-menu">
              <strong>{user?.name || roleLabel}</strong>
              {user?.role === "student" && (
                <Link to="/profile" onClick={() => setAccountMenuOpen(false)}>
                  My Profile
                </Link>
              )}
              <button type="button" onClick={handleSignOut}>
                <FaRightFromBracket aria-hidden="true" /> Sign out
              </button>
            </div>
          )}
          <button
            type="button"
            className={`workspace-mobile-dock-button${accountMenuOpen ? " active" : ""}`}
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-label="Open profile and account options"
            aria-expanded={accountMenuOpen}
          >
            <FaCircleUser aria-hidden="true" />
            <span>{user?.role === "student" ? "Profile" : "Account"}</span>
          </button>
        </div>
        <button
          type="button"
          className={`workspace-mobile-dock-button${mobileOpen ? " active" : ""}`}
          onClick={() => {
            setAccountMenuOpen(false);
            setMobileOpen(true);
          }}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
        >
          <FaBars aria-hidden="true" />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}
