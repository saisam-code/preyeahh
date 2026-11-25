import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaCircleUser, FaChevronDown, FaRightFromBracket } from "react-icons/fa6";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import preyeahhLogo from "../assets/preyeahh-logo.png";

export default function GuideLayout() {
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
      <header
        className="role-header-tint guide-header"
        style={{ minHeight: 70, background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 1.5rem" }}
      >
        <div style={{ maxWidth: 1300, width: "100%", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <Link to="/guide-panel" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
            <img src={preyeahhLogo} alt="PREYEAHH Logo" style={{ width: 34, height: 34, objectFit: "contain" }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--font-size-lg)", fontWeight: 800, color: "var(--text)" }}>
              Pre<span style={{ color: "var(--primary)" }}>yeahh</span>
              <span style={{ fontSize: "var(--font-size-xs)", marginLeft: "0.4rem", background: "color-mix(in srgb, var(--info) 10%, transparent)", color: "var(--info-text)", padding: "0.15rem 0.45rem", borderRadius: "var(--radius)", fontWeight: 700, verticalAlign: "middle" }}>
                GUIDE
              </span>
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <ThemeToggle />
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--surface-mid)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.35rem 0.8rem", cursor: "pointer", color: "var(--text)", fontSize: "var(--font-size-sm)", fontWeight: 600 }}
              >
                <FaCircleUser style={{ fontSize: "var(--font-size-md)", color: "var(--info-text)" }} />
                <span className="role-user-name">{user?.name?.split(" ")[0] || "Guide"}</span>
                <FaChevronDown className="role-user-chevron" style={{ fontSize: "var(--font-size-xs)", opacity: 0.7 }} />
              </button>
              {menuOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 170, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "0 10px 30px color-mix(in srgb, var(--ink-900) 10%, transparent)", padding: "0.5rem", zIndex: 200 }}>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.8rem", borderRadius: "var(--radius)", fontSize: "var(--font-size-sm)", color: "var(--error, var(--danger))", background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left", fontWeight: 600 }}
                  >
                    <FaRightFromBracket /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
