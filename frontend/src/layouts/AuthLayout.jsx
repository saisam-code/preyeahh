import { Link, Outlet } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";
import ThemeToggle from "../components/ThemeToggle.jsx";
import preyeahhLogo from "../assets/preyeahh-logo.png";

export default function AuthLayout() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* ── MINIMAL AUTH HEADER ── */}
      <header
        className="auth-layout-header"
        style={{
          height: 64,
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
          <img src={preyeahhLogo} alt="PREYEAHH Logo" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--font-size-lg)", fontWeight: 800, color: "var(--text)" }}>
            Pre<span style={{ color: "var(--primary)" }}>yeahh</span>
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <ThemeToggle />
          <Link
            to="/"
            className="auth-back-home"
            style={{
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: "var(--font-size-sm)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontWeight: 600,
            }}
          >
            <FaArrowLeft style={{ fontSize: "var(--font-size-xs)" }} /> <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Auth Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
