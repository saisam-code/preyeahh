import { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaBars, FaXmark, FaHouse, FaBriefcase, FaCompass, FaCircleInfo,
  FaCircleUser, FaChevronDown, FaGauge, FaRightFromBracket,
  FaCommentDots, FaMap, FaGraduationCap, FaBookmark, FaUser,
} from "react-icons/fa6";
import ThemeToggle from "./ThemeToggle.jsx";
import LoginModal from "./LoginModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useBranch } from "../context/BranchContext.jsx";
import { setAccessToken } from "../services/api.js";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: FaHouse, exact: true },
  { to: "/dashboard", label: "Dashboard", icon: FaGauge, requiresRole: ["student", "guide"] },
  { to: "/roles", label: "Roles", icon: FaBriefcase, branchGated: true },
  { to: "/beyond", label: "Beyond", icon: FaCompass, branchGated: true },
  { to: "/resources", label: "Resources", icon: FaBookmark, mobile: false },
  { to: "/chat", label: "Chat", icon: FaCommentDots, studentOnly: true },
  { to: "/roadmaps", label: "Roadmaps", icon: FaMap, studentOnly: true },
  { to: "/quiz", label: "Quiz", icon: FaGraduationCap, studentOnly: true, mobile: false },
  { to: "/about", label: "About", icon: FaCircleInfo, mobile: false },
];

function readAdminUser() {
  try {
    const raw = localStorage.getItem("pp_admin_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { user, logout } = useAuth();
  const { branch } = useBranch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // "/?login=1" (used by post-verify / post-reset redirects) opens the login modal
  useEffect(() => {
    if (searchParams.get("login") === "1") {
      setLoginOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("login");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [adminUser, setAdminUser] = useState(readAdminUser);

  useEffect(() => {
    const sync = () => setAdminUser(readAdminUser());
    window.addEventListener("admin-auth-changed", sync);
    return () => window.removeEventListener("admin-auth-changed", sync);
  }, []);

  const effectiveUser = user || adminUser;

  const isStudent = user?.role === "student";
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.studentOnly && !isStudent) return false;
    if (item.requiresRole && !item.requiresRole.includes(effectiveUser?.role)) return false;
    return true;
  });
  const mobileItems = visibleItems.filter((item) => item.mobile !== false);

  const linkTo = (item) => (item.branchGated && branch ? `${item.to}?branch=${branch}` : item.to);

  const handleSignOut = async () => {
    setMenuOpen(false);
    if (adminUser) {
      setAccessToken(null);
      localStorage.removeItem("pp_admin_user");
      setAdminUser(null);
      window.dispatchEvent(new Event("admin-auth-changed"));
    } else {
      await logout();
    }
    toast.success("Signed out");
    navigate("/");
  };

  const rawDashboardHref =
    effectiveUser?.role === "admin"
      ? "/admin"
      : effectiveUser?.role === "student" || effectiveUser?.role === "guide"
        ? "/dashboard"
        : null;
  const dashboardHref = rawDashboardHref && location.pathname !== rawDashboardHref ? rawDashboardHref : null;
  return (
    <>
      <nav>
        <NavLink to="/" className="nav-logo">Pre<span>yeahh</span></NavLink>

        <div className="nav-links">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={linkTo(item)}
              end={item.exact}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-right">
          <ThemeToggle />

          {effectiveUser ? (
            <div className={`user-dropdown-wrap visible ${menuOpen ? "open" : ""}`}>
              <button className="user-chip-btn" onClick={() => setMenuOpen((o) => !o)}>
                <FaCircleUser />
                <span>
                  {effectiveUser.name?.split(" ")[0] || effectiveUser.email} ·{" "}
                  {effectiveUser.role[0].toUpperCase() + effectiveUser.role.slice(1)}
                </span>
                <FaChevronDown className="chip-caret" />
              </button>
              <div className={`user-dropdown-menu ${menuOpen ? "open" : ""}`}>
                {dashboardHref && (
                  <>
                    <NavLink to={dashboardHref} className="udm-item" onClick={() => setMenuOpen(false)}>
                      <FaGauge /> Dashboard
                    </NavLink>
                    <hr className="udm-divider" />
                  </>
                )}
                {isStudent && (
                  <NavLink to="/profile" className="udm-item" onClick={() => setMenuOpen(false)}>
                    <FaUser /> My Profile
                  </NavLink>
                )}
                <button className="udm-item udm-danger" onClick={handleSignOut}>
                  <FaRightFromBracket /> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => setLoginOpen(true)}>Login</button>
          )}

          <button className="nav-hamburger" onClick={() => setDrawerOpen(true)}><FaBars /></button>
        </div>
      </nav>

      <div className={`nav-drawer ${drawerOpen ? "open" : ""}`}>
        <div className="nav-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
        <div className="nav-drawer-panel">
          <button className="nav-drawer-close" onClick={() => setDrawerOpen(false)}><FaXmark /></button>
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={linkTo(item)}
              end={item.exact}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <item.icon /> {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <nav className="bottom-nav">
        <div className="bottom-nav-items">
          {mobileItems.map((item) => (
            <NavLink
              key={item.to}
              to={linkTo(item)}
              end={item.exact}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
            >
              <item.icon />{item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
