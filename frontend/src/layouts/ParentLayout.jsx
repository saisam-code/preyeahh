import { useState } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaCalendarCheck,
  FaCircleUser,
  FaChevronDown,
  FaRightFromBracket,
  FaShieldHalved,
} from "react-icons/fa6";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import preyeahhLogo from "../assets/preyeahh-logo.png";

export default function ParentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await logout();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
        <div style={{ maxWidth: 1200, width: "100%", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/parent-portal" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
            <img src={preyeahhLogo} alt="PREYEAHH Logo" style={{ width: 34, height: 34, objectFit: "contain" }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--font-size-lg)", fontWeight: 800, color: "var(--text)" }}>
              Pre<span style={{ color: "var(--primary)" }}>yeahh</span>
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  marginLeft: "0.4rem",
                  background: "color-mix(in srgb, var(--success) 10%, transparent)",
                  color: "var(--success)",
                  padding: "0.15rem 0.45rem",
                  borderRadius: "var(--radius)",
                  fontWeight: 700,
                  verticalAlign: "middle",
                }}
              >
                PARENT
              </span>
            </span>
          </Link>

          <div className="parent-desktop-nav" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <NavLink
              to="/parent-portal"
              className={({ isActive }) => (isActive ? "active" : "")}
              style={{
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                color: "var(--text)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <FaCalendarCheck /> Student Milestones &amp; Planning
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
                <FaCircleUser style={{ fontSize: "var(--font-size-md)", color: "var(--success)" }} />
                <span className="role-user-name">{user?.name?.split(" ")[0] || "Parent"}</span>
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
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
