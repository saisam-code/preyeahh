import { useState } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaCompass,
  FaCalendarCheck,
  FaMap,
  FaGraduationCap,
  FaBookmark,
  FaCommentDots,
  FaCircleUser,
  FaChevronDown,
  FaUser,
  FaRightFromBracket,
  FaBars,
  FaXmark,
  FaBuildingColumns,
  FaHouse,
  FaBullseye,
} from "react-icons/fa6";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import preyeahhLogo from "../assets/preyeahh-logo.png";

const STUDENT_NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: FaHouse },
  { to: "/discovery", label: "Discovery", icon: FaCompass },
  { to: "/government-careers", label: "Govt Careers", icon: FaBuildingColumns },
  { to: "/planner", label: "Career Planner", icon: FaCalendarCheck },
  { to: "/roadmaps", label: "Roadmaps", icon: FaMap },
  { to: "/quiz", label: "Quiz & Learn", icon: FaGraduationCap },
  { to: "/resources", label: "Resources", icon: FaBookmark },
  { to: "/chat", label: "Mentorship Chat", icon: FaCommentDots },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <div className="student-layout-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── STUDENT APP NAVBAR ── */}
      <nav
        className="role-header-tint"
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
          {/* Logo */}
          <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
            <img src={preyeahhLogo} alt="PREYEAHH Logo" style={{ width: 34, height: 34, objectFit: "contain" }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--font-size-lg)", fontWeight: 800, color: "var(--text)" }}>
              Pre<span style={{ color: "var(--primary)" }}>yeahh</span>
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  marginLeft: "0.4rem",
                  background: "var(--primary-bg)",
                  color: "var(--primary)",
                  padding: "0.15rem 0.45rem",
                  borderRadius: "var(--radius)",
                  fontWeight: 700,
                  verticalAlign: "middle",
                }}
              >
                STUDENT
              </span>
            </span>
          </Link>

          {/* Student Nav Links */}
          <div className="desktop-student-nav" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {STUDENT_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
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
                  color: isActive ? "var(--white)" : "var(--text)",
                  background: isActive ? "var(--primary)" : "transparent",
                  transition: "all 0.15s ease",
                })}
              >
                <item.icon style={{ fontSize: "var(--font-size-sm)" }} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <ThemeToggle />

            {/* User Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                className="user-chip-btn"
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
                <FaCircleUser style={{ fontSize: "var(--font-size-md)", color: "var(--primary)" }} />
                <span className="role-user-name">{user?.name?.split(" ")[0] || "Student"}</span>
                <FaChevronDown className="role-user-chevron" style={{ fontSize: "var(--font-size-xs)", opacity: 0.7 }} />
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: 190,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    boxShadow: "0 10px 30px color-mix(in srgb, var(--ink-900) 10%, transparent)",
                    padding: "0.5rem",
                    zIndex: 200,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "var(--radius)",
                      fontSize: "var(--font-size-sm)",
                      color: "var(--text)",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    <FaUser /> My Profile
                  </Link>

                  <Link
                    to="/roles"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "var(--radius)",
                      fontSize: "var(--font-size-sm)",
                      color: "var(--text)",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    <FaCompass /> Branch Roles Catalog
                  </Link>

                  <Link
                    to="/beyond"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "var(--radius)",
                      fontSize: "var(--font-size-sm)",
                      color: "var(--text)",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    <FaBullseye /> Beyond Degree
                  </Link>

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

            {/* Mobile Menu Button */}
            <button
              className="nav-hamburger student-menu-toggle"
              onClick={() => setDrawerOpen(true)}
              style={{ background: "transparent", border: "none", fontSize: "var(--font-size-lg)", color: "var(--text)", cursor: "pointer" }}
            >
              <FaBars />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex" }}>
          <div style={{ position: "absolute", inset: 0, background: "color-mix(in srgb, var(--ink-900) 50%, transparent)" }} onClick={() => setDrawerOpen(false)} />
          <div
            style={{
              position: "relative",
              marginLeft: "auto",
              width: "280px",
              height: "100%",
              background: "var(--surface)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <strong style={{ fontSize: "var(--font-size-md)" }}>Student Navigation</strong>
              <button onClick={() => setDrawerOpen(false)} style={{ background: "transparent", border: "none", fontSize: "var(--font-size-lg)" }}>
                <FaXmark />
              </button>
            </div>

            {STUDENT_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setDrawerOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0", color: "var(--text)", textDecoration: "none", fontWeight: 600 }}
              >
                <item.icon /> {item.label}
              </NavLink>
            ))}

            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "0.5rem 0" }} />

            <Link to="/profile" onClick={() => setDrawerOpen(false)} style={{ textDecoration: "none", color: "var(--text)", padding: "0.4rem 0" }}>
              My Profile
            </Link>
            <button onClick={handleSignOut} className="btn btn-outline" style={{ marginTop: "1rem", color: "var(--error, var(--danger))" }}>
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Student Workspace Outlet */}
      <main className="student-workspace-main" style={{ flex: 1, paddingBottom: "3rem" }}>
        <Outlet />
      </main>

      {/* Mobile Bottom Bar for Quick Navigation */}
      <nav className="bottom-nav">
        <div className="bottom-nav-items">
          <NavLink to="/discovery" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
            <FaCompass />
            <span>Discover</span>
          </NavLink>
          <NavLink to="/planner" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
            <FaCalendarCheck />
            <span>Planner</span>
          </NavLink>
          <NavLink to="/roadmaps" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
            <FaMap />
            <span>Roadmaps</span>
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
            <FaCommentDots />
            <span>Chat</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
            <FaUser />
            <span>Profile</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
