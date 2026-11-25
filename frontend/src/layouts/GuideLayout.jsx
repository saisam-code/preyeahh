import { useState, useEffect } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaCompass,
  FaCommentDots,
  FaBookmark,
  FaCircleUser,
  FaChevronDown,
  FaRightFromBracket,
  FaBars,
  FaXmark,
  FaBullseye,
} from "react-icons/fa6";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { listMentorshipConversations } from "../services/mentorshipService.js";
import preyeahhLogo from "../assets/preyeahh-logo.png";

export default function GuideLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchUnread = async () => {
      try {
        const convos = await listMentorshipConversations("guide");
        if (active) setUnreadCount(convos.filter((c) => c.hasUnreadForGuide).length);
      } catch (err) {
        void err;
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await logout();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav
        className="role-header-tint guide-header"
        style={{
          height: 70,
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          padding: "0 1.5rem",
        }}
      >
        <div style={{ maxWidth: 1300, width: "100%", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/guide-panel" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
            <img src={preyeahhLogo} alt="PREYEAHH Logo" style={{ width: 34, height: 34, objectFit: "contain" }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--font-size-lg)", fontWeight: 800, color: "var(--text)" }}>
              Pre<span style={{ color: "var(--primary)" }}>yeahh</span>
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  marginLeft: "0.4rem",
                  background: "color-mix(in srgb, var(--info) 10%, transparent)",
                  color: "var(--info-text)",
                  padding: "0.15rem 0.45rem",
                  borderRadius: "var(--radius)",
                  fontWeight: 700,
                  verticalAlign: "middle",
                }}
              >
                GUIDE
              </span>
            </span>
          </Link>

          <div className="guide-desktop-nav" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <NavLink
              to="/guide-panel"
              className={({ isActive }) => (isActive ? "active" : "")}
              style={({ isActive }) => ({
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.8rem",
                borderRadius: "var(--radius)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                textDecoration: "none",
                color: isActive ? "var(--on-primary)" : "var(--text)",
                background: isActive ? "var(--primary)" : "transparent",
              })}
            >
              <FaCompass /> Branch Guidance
            </NavLink>

            <NavLink
              to="/chat"
              className={({ isActive }) => (isActive ? "active" : "")}
              style={({ isActive }) => ({
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.8rem",
                borderRadius: "var(--radius)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                textDecoration: "none",
                color: isActive ? "var(--on-primary)" : "var(--text)",
                background: isActive ? "var(--primary)" : "transparent",
              })}
            >
              <FaCommentDots /> Mentorship Inbox
              {unreadCount > 0 && (
                <span style={{ background: "var(--danger)", color: "var(--on-danger)", borderRadius: "var(--radius)", padding: "0.1rem 0.4rem", fontSize: "var(--font-size-xs)" }}>
                  {unreadCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/roles"
              className={({ isActive }) => (isActive ? "active" : "")}
              style={({ isActive }) => ({
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.8rem",
                borderRadius: "var(--radius)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                textDecoration: "none",
                color: isActive ? "var(--on-primary)" : "var(--text)",
                background: isActive ? "var(--primary)" : "transparent",
              })}
            >
              <FaCompass /> Roles Catalog
            </NavLink>

            <NavLink
              to="/resources"
              className={({ isActive }) => (isActive ? "active" : "")}
              style={({ isActive }) => ({
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.8rem",
                borderRadius: "var(--radius)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                textDecoration: "none",
                color: isActive ? "var(--on-primary)" : "var(--text)",
                background: isActive ? "var(--primary)" : "transparent",
              })}
            >
              <FaBookmark /> Resources
            </NavLink>

            <NavLink
              to="/beyond"
              className={({ isActive }) => (isActive ? "active" : "")}
              style={({ isActive }) => ({
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.8rem",
                borderRadius: "var(--radius)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                textDecoration: "none",
                color: isActive ? "var(--on-primary)" : "var(--text)",
                background: isActive ? "var(--primary)" : "transparent",
              })}
            >
              <FaBullseye /> Beyond Degree
            </NavLink>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <ThemeToggle />

            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--surface-mid)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "0.35rem 0.8rem",
                  cursor: "pointer",
                  color: "var(--text)",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: 600,
                }}
              >
                <FaCircleUser style={{ fontSize: "var(--font-size-md)", color: "var(--info-text)" }} />
                <span className="role-user-name">{user?.name?.split(" ")[0] || "Guide"}</span>
                <FaChevronDown className="role-user-chevron" style={{ fontSize: "var(--font-size-xs)", opacity: 0.7 }} />
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: 170,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    boxShadow: "0 10px 30px color-mix(in srgb, var(--ink-900) 10%, transparent)",
                    padding: "0.5rem",
                    zIndex: 200,
                  }}
                >
                  <button
                    onClick={handleSignOut}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "var(--radius)",
                      fontSize: "var(--font-size-sm)",
                      color: "var(--error, var(--danger))",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "left",
                      fontWeight: 600,
                    }}
                  >
                    <FaRightFromBracket /> Sign Out
                  </button>
                </div>
              )}
            </div>

            <button
              className="nav-hamburger guide-menu-toggle"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open guide navigation"
            >
              <FaBars />
            </button>
          </div>
        </div>
      </nav>

      {drawerOpen && (
        <div className="role-mobile-drawer">
          <button
            className="role-mobile-drawer-backdrop"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close guide navigation"
          />
          <aside className="role-mobile-drawer-panel" aria-label="Guide navigation">
            <div className="role-mobile-drawer-heading">
              <strong>Guide Navigation</strong>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close guide navigation">
                <FaXmark />
              </button>
            </div>
            <NavLink to="/guide-panel" onClick={() => setDrawerOpen(false)}><FaCompass /> Branch Guidance</NavLink>
            <NavLink to="/chat" onClick={() => setDrawerOpen(false)}>
              <FaCommentDots /> Mentorship Inbox{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </NavLink>
            <NavLink to="/roles" onClick={() => setDrawerOpen(false)}><FaCompass /> Roles Catalog</NavLink>
            <NavLink to="/resources" onClick={() => setDrawerOpen(false)}><FaBookmark /> Resources</NavLink>
            <NavLink to="/beyond" onClick={() => setDrawerOpen(false)}><FaBullseye /> Beyond Degree</NavLink>
            <button className="role-mobile-signout" onClick={handleSignOut}>
              <FaRightFromBracket /> Sign Out
            </button>
          </aside>
        </div>
      )}

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
