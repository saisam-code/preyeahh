import { useState } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import { FaBars, FaXmark, FaHouse, FaCircleInfo, FaArrowRight } from "react-icons/fa6";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import preyeahhLogo from "../assets/preyeahh-logo.png";

export default function PublicLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const workspacePath =
    user?.role === "guide" ? "/guide-panel" :
    user?.role === "parent" ? "/parent-portal" :
    user?.role === "institution" ? "/institution-portal" :
    "/dashboard";

  return (
    <div className="public-layout-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── PUBLIC HEADER: ONLY HOME, ABOUT, LOGIN, GET STARTED ── */}
      <header
        className="public-header"
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
        <div style={{ maxWidth: 1240, width: "100%", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
            <img src={preyeahhLogo} alt="PREYEAHH Logo" style={{ width: 34, height: 34, objectFit: "contain" }} />
            <span style={{ fontSize: "var(--font-size-lg)", fontWeight: 800, color: "var(--text)" }}>
              Pre<span style={{ color: "var(--primary)" }}>yeahh</span>
            </span>
          </Link>

          {/* Public Navigation */}
          <nav className="desktop-public-nav" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              style={({ isActive }) => ({
                textDecoration: "none",
                fontSize: "var(--font-size-md)",
                fontWeight: 600,
                color: isActive ? "var(--primary)" : "var(--text)",
                padding: "0.35rem 0.6rem",
                borderRadius: "var(--radius)",
              })}
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              style={({ isActive }) => ({
                textDecoration: "none",
                fontSize: "var(--font-size-md)",
                fontWeight: 600,
                color: isActive ? "var(--primary)" : "var(--text)",
                padding: "0.35rem 0.6rem",
                borderRadius: "var(--radius)",
              })}
            >
              About
            </NavLink>
            <NavLink
              to="/explore-careers"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              style={({ isActive }) => ({
                textDecoration: "none",
                fontSize: "var(--font-size-md)",
                fontWeight: 600,
                color: isActive ? "var(--primary)" : "var(--text)",
                padding: "0.35rem 0.6rem",
                borderRadius: "var(--radius)",
              })}
            >
              Explore Careers
            </NavLink>
          </nav>

          {/* Right Actions: Login & Get Started OR Open Workspace */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ThemeToggle />

            <div className="public-header-auth-actions" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {isAuthenticated ? (
              <Link
                to={workspacePath}
                className="btn btn-primary btn-sm"
                style={{
                  padding: "0.45rem 1.15rem",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                Open Workspace <FaArrowRight style={{ fontSize: "var(--font-size-xs)" }} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-outline btn-sm"
                  style={{ padding: "0.45rem 1rem", fontSize: "var(--font-size-sm)", fontWeight: 600, textDecoration: "none" }}
                >
                  Login
                </Link>

                <Link
                  to="/get-started"
                  className="btn btn-primary btn-sm"
                  style={{
                    padding: "0.45rem 1.15rem",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  Get Started <FaArrowRight style={{ fontSize: "var(--font-size-xs)" }} />
                </Link>
              </>
            )}
            </div>

            {/* Mobile Hamburger */}
            <button
              className="nav-hamburger"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open mobile menu"
              style={{
                background: "transparent",
                border: "none",
                fontSize: "var(--font-size-lg)",
                color: "var(--text)",
                cursor: "pointer",
                padding: "0.4rem",
              }}
            >
              <FaBars />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER: HOME, ABOUT, LOGIN, GET STARTED ── */}
      {drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex" }}>
          <div
            style={{ position: "absolute", inset: 0, background: "color-mix(in srgb, var(--ink-900) 50%, transparent)" }}
            onClick={() => setDrawerOpen(false)}
          />
          <div
            style={{
              position: "relative",
              marginLeft: "auto",
              width: "min(280px, 100vw)",
              height: "100%",
              background: "var(--surface)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              boxShadow: "-4px 0 24px color-mix(in srgb, var(--ink-900) 15%, transparent)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <strong style={{ fontSize: "var(--font-size-md)" }}>Menu</strong>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: "var(--font-size-lg)", cursor: "pointer" }}
              >
                <FaXmark />
              </button>
            </div>

            <NavLink
              to="/"
              end
              onClick={() => setDrawerOpen(false)}
              style={{ textDecoration: "none", color: "var(--text)", fontSize: "var(--font-size-md)", fontWeight: 600, padding: "0.5rem 0" }}
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              onClick={() => setDrawerOpen(false)}
              style={{ textDecoration: "none", color: "var(--text)", fontSize: "var(--font-size-md)", fontWeight: 600, padding: "0.5rem 0" }}
            >
              About
            </NavLink>
            <NavLink
              to="/explore-careers"
              onClick={() => setDrawerOpen(false)}
              style={{ textDecoration: "none", color: "var(--text)", fontSize: "var(--font-size-md)", fontWeight: 600, padding: "0.5rem 0" }}
            >
              Explore Careers
            </NavLink>
            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "0.5rem 0" }} />

            {isAuthenticated ? (
              <Link
                to={workspacePath}
                onClick={() => setDrawerOpen(false)}
                className="btn btn-primary"
                style={{ textDecoration: "none", textAlign: "center" }}
              >
                Open Workspace
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setDrawerOpen(false)}
                  className="btn btn-outline"
                  style={{ textDecoration: "none", textAlign: "center" }}
                >
                  Login
                </Link>

                <Link
                  to="/get-started"
                  onClick={() => setDrawerOpen(false)}
                  className="btn btn-primary"
                  style={{ textDecoration: "none", textAlign: "center" }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Public Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* ── CLEAN PUBLIC FOOTER ── */}
      <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "2.5rem 1.5rem", marginTop: "auto" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <img src={preyeahhLogo} alt="PREYEAHH Logo" style={{ width: 28, height: 28, objectFit: "contain" }} />
            <span style={{ fontWeight: 700, fontSize: "var(--font-size-md)" }}>
              PREYEAHH · Career Intelligence &amp; Development Platform
            </span>
          </div>

          <div className="public-footer-links" style={{ display: "flex", alignItems: "center", gap: "1.5rem", fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>
            <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>Home</Link>
            <Link to="/about" style={{ textDecoration: "none", color: "inherit" }}>About</Link>
            <Link to="/get-started" style={{ textDecoration: "none", color: "inherit" }}>Get Started</Link>
            <Link to="/login" style={{ textDecoration: "none", color: "inherit" }}>Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
