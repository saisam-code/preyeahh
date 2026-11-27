import { Fragment, useEffect, useState } from "react";
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

export default function WorkspaceLayout({ roleLabel, homePath, navItems, hideSidebar = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    setQuickMenuOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setAccountMenuOpen(false);
    await logout();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div className={`workspace-shell${hideSidebar ? " workspace-shell--no-sidebar" : ""}`}>
      {!hideSidebar && (
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
            if (!item.to) return <div key={item.groupLabel} className="workspace-sidebar-group-label">{item.groupLabel}</div>;
            return (
              <Fragment key={item.to}>
                {item.groupLabel && <div className="workspace-sidebar-group-label">{item.groupLabel}</div>}
                <NavLink
                  to={item.to}
                  end={item.end}
                  title={item.label}
                  aria-label={item.label}
                  className={({ isActive }) => `workspace-sidebar-link${isActive ? " active" : ""}`}
                >
                  <Icon aria-hidden="true" />
                  <span className="workspace-sidebar-label">{item.label}</span>
                </NavLink>
              </Fragment>
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
      )}

      <main className="workspace-main">
        <header className="workspace-topbar">
          {!hideSidebar && (
            <button
              type="button"
              className="workspace-menu-toggle workspace-menu-toggle--desktop"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
          )}
          <div className="workspace-topbar-spacer" />
          <ThemeToggle />
        </header>
        <div className="workspace-page-content">
          <Outlet />
        </div>
      </main>

      {!hideSidebar && quickMenuOpen && (
        <>
          <button
            type="button"
            className="workspace-quick-panel-backdrop"
            onClick={() => setQuickMenuOpen(false)}
            aria-label="Close quick menu"
          />
          <section className="workspace-quick-panel" aria-label="Quick navigation">
            <div className="workspace-quick-panel-heading">
              <strong>Quick actions</strong>
              <button
                type="button"
                onClick={() => setQuickMenuOpen(false)}
                aria-label="Close quick menu"
              >
                <FaXmark aria-hidden="true" />
              </button>
            </div>
            <nav className="workspace-quick-grid" aria-label="Workspace pages">
              {navItems.map((item) => {
                const Icon = item.icon;
                if (!item.to) return null;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `workspace-quick-link${isActive ? " active" : ""}`}
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </section>
        </>
      )}

      <nav
        className={`workspace-mobile-dock${quickMenuOpen ? " workspace-mobile-dock--menu-open" : ""}`}
        aria-label="Mobile quick actions"
      >
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
            onClick={() => {
              setQuickMenuOpen(false);
              setAccountMenuOpen((open) => !open);
            }}
            aria-label="Open profile and account options"
            aria-expanded={accountMenuOpen}
          >
            <FaCircleUser aria-hidden="true" />
            <span>{user?.role === "student" ? "Profile" : "Account"}</span>
          </button>
        </div>
        {!hideSidebar && (
          <button
            type="button"
            className={`workspace-mobile-dock-button${quickMenuOpen ? " active" : ""}`}
            onClick={() => {
              setAccountMenuOpen(false);
              setQuickMenuOpen((open) => !open);
            }}
            aria-label="Open navigation menu"
            aria-expanded={quickMenuOpen}
          >
            <FaBars aria-hidden="true" />
            <span>Menu</span>
          </button>
        )}
      </nav>
    </div>
  );
}
