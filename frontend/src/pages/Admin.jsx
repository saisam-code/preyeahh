import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaChartBar, FaCrosshairs, FaSchool, FaMedal, FaMap, FaEnvelope,
  FaRightFromBracket, FaBars, FaXmark,
} from "react-icons/fa6";

import AdminLogin from "../components/admin/AdminLogin";
import AdminDashboard from "../components/admin/AdminDashboard";
import AdminRoles from "../components/admin/AdminRoles";
import AdminBranches from "../components/admin/AdminBranches";
import AdminBeyond from "../components/admin/AdminBeyond";
import AdminGuidance from "../components/admin/AdminGuidance";
import AdminRequests from "../components/admin/AdminRequests";
import AdminInterest from "../components/admin/AdminInterest";
import AdminGuides from "../components/admin/AdminGuides";

import { fetchAdminMe, refreshAdmin, logoutAdmin } from "../services/adminService";
import { setAccessToken, getAccessToken, setActiveRole } from "../services/api";

const SECTIONS = [
  { key: "dashboard", label: "Dashboard", icon: FaChartBar, Component: AdminDashboard },
  { key: "roles", label: "Manage Roles", icon: FaCrosshairs, Component: AdminRoles },
  { key: "branches", label: "Manage Branches", icon: FaSchool, Component: AdminBranches },
  { key: "beyond", label: "Beyond", icon: FaMedal, Component: AdminBeyond },
  { key: "guidance", label: "Guidance", icon: FaMap, Component: AdminGuidance },
  { key: "requests", label: "Role Requests", icon: FaEnvelope, Component: AdminRequests },
  { key: "interest", label: "Role Interest", icon: FaChartBar, Component: AdminInterest },
  { key: "guides", label: "Guide Requests", icon: FaCrosshairs, Component: AdminGuides },
];

export default function Admin() {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);
  const [section, setSection] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    (async () => {
      const cached = localStorage.getItem("pp_admin_user");
      if (!cached) {
        setChecking(false);
        return;
      }
      try {
        if (!getAccessToken()) {
          const { data } = await refreshAdmin();
          setAccessToken(data.accessToken);
        }
        const res = await fetchAdminMe();
        setAdmin(res.data);
      } catch {
        setAccessToken(null);
        setActiveRole(null);
        localStorage.removeItem("pp_admin_user");
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const handleLoginSuccess = (user) => {
    setAdmin(user);
    setSection("dashboard");
    setActiveRole("admin");
    window.dispatchEvent(new Event("admin-auth-changed"));
  };

  const handleLogout = () => {
    logoutAdmin().catch(() => {});
    setAccessToken(null);
    setActiveRole(null);
    localStorage.removeItem("pp_admin_user");
    setAdmin(null);
    window.dispatchEvent(new Event("admin-auth-changed"));
    toast.success("Signed out");
  };

  if (checking) {
    return (
      <div className="empty" style={{ padding: "4rem 0" }}>
        <div className="icon"><i className="fa fa-spinner fa-spin" /></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!admin) return <AdminLogin onSuccess={handleLoginSuccess} />;

  const ActiveComponent = SECTIONS.find((s) => s.key === section)?.Component || AdminDashboard;

  return (
    <div>
      <div className="mobile-section-nav">
        {SECTIONS.map((s) => (
          <button key={s.key} className={`msn-btn ${section === s.key ? "active" : ""}`} onClick={() => setSection(s.key)}>
            <s.icon />{s.label}
          </button>
        ))}
      </div>

      <div className="admin-layout">
        {!sidebarCollapsed && (
          <div className="sidebar">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Admin Panel</h3>
              <button className="modal-close" onClick={() => setSidebarCollapsed(true)} title="Hide panel"><FaXmark /></button>
            </div>

            {SECTIONS.map((s) => (
              <div key={s.key} className={`sidebar-link ${section === s.key ? "active" : ""}`} onClick={() => setSection(s.key)}>
                <s.icon />{s.label}
              </div>
            ))}

            <div className="sidebar-link" style={{ marginTop: "1rem", color: "var(--error, #ef4444)" }} onClick={handleLogout}>
              <FaRightFromBracket />Sign Out
            </div>
          </div>
        )}

        {sidebarCollapsed && (
          <button
            className="nav-hamburger"
            style={{ position: "fixed", left: 12, top: 84, zIndex: 50, display: "flex" }}
            onClick={() => setSidebarCollapsed(false)}
            title="Show panel"
          >
            <FaBars />
          </button>
        )}

        <div className="admin-content">
          <ActiveComponent onNavigate={setSection} />
        </div>
      </div>
    </div>
  );
}