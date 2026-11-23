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
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, color: "var(--text)" }}>
              Pre<span style={{ color: "var(--primary)" }}>yeahh</span>
              <span
                style={{
                  fontSize: "0.7rem",
                  marginLeft: "0.4rem",
                  background: "rgba(16,185,129,0.1)",
                  color: "#10b981",
                  padding: "0.15rem 0.45rem",
                  borderRadius: "1rem",
                  fontWeight: 700,
                  verticalAlign: "middle",
                }}
              >
                PARENT
              </span>
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <NavLink
              to="/parent-portal"
              className={({ isActive }) => (isActive ? "active" : "")}
              style={{
                fontSize: "0.9rem",
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
                  borderRadius: "2rem",
                  padding: "0.35rem 0.8rem",
                  cursor: "pointer",
                  color: "var(--text)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                <FaCircleUser style={{ fontSize: "1.1rem", color: "#10b981" }} />
                <span>{user?.name?.split(" ")[0] || "Parent"}</span>
                <FaChevronDown style={{ fontSize: "0.7rem", opacity: 0.7 }} />
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
                    borderRadius: "0.75rem",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
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
                      borderRadius: "0.4rem",
                      fontSize: "0.85rem",
                      color: "var(--error, #e11d48)",
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
