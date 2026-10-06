import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaChartBar, FaCrosshairs, FaSchool, FaMedal, FaMap, FaEnvelope,
  FaRightFromBracket, FaBars, FaXmark, FaUsers, FaComments, FaRoad,
} from "react-icons/fa6";

import AdminLogin from "../components/admin/AdminLogin.jsx";
import AdminRoles from "../components/admin/AdminRoles.jsx";
import AdminBranches from "../components/admin/AdminBranches.jsx";
import AdminBeyond from "../components/admin/AdminBeyond.jsx";
import AdminGuidance from "../components/admin/AdminGuidance.jsx";
import AdminRequests from "../components/admin/AdminRequests.jsx";
import AdminInterest from "../components/admin/AdminInterest.jsx";
import AdminGuides from "../components/admin/AdminGuides.jsx";
import AdminStudents from "../components/admin/AdminStudents.jsx";
import AdminStudentChats from "../components/admin/AdminStudentChats.jsx";
import AdminStudentRoadmaps from "../components/admin/AdminStudentRoadmaps.jsx";

import { fetchAdminMe, refreshAdmin, logoutAdmin } from "../services/adminService.js";
import { setAccessToken, getAccessToken, setActiveRole } from "../services/api.js";

const SECTIONS = [
  { key: "students", label: "Students", icon: FaUsers },
  { key: "roles", label: "Manage Roles", icon: FaCrosshairs },
  { key: "branches", label: "Manage Branches", icon: FaSchool },
  { key: "beyond", label: "Beyond", icon: FaMedal },
  { key: "guidance", label: "Guidance", icon: FaMap },
  { key: "requests", label: "Role Requests", icon: FaEnvelope },
  { key: "interest", label: "Role Interest", icon: FaChartBar },
  { key: "guides", label: "Guide Requests", icon: FaCrosshairs },
];

export default function Admin() {
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);
  const [section, setSection] = useState(() => {
    const requestedSection = location.state?.section;
    return SECTIONS.some((item) => item.key === requestedSection) ? requestedSection : "students";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // For nested student-drill-down views
  const [chatStudent, setChatStudent] = useState(null);   // student being viewed in chats
  const [roadmapStudent, setRoadmapStudent] = useState(null); // student being viewed in roadmaps

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
    setSection("students");
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

  const navigateTo = (key) => {
    setSection(key);
    setChatStudent(null);
    setRoadmapStudent(null);
  };

  const handleViewChats = (student) => {
    setChatStudent(student);
    setRoadmapStudent(null);
    setSection("student-chats");
  };

  const handleViewRoadmaps = (student) => {
    setRoadmapStudent(student);
    setChatStudent(null);
    setSection("student-roadmaps");
  };

  const handleBackToStudents = () => {
    setSection("students");
    setChatStudent(null);
    setRoadmapStudent(null);
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

  // Render active section/panel
  let ActivePanel;
  if (section === "student-chats") {
    ActivePanel = (
      <AdminStudentChats
        student={chatStudent}
        onBack={handleBackToStudents}
      />
    );
  } else if (section === "student-roadmaps") {
    ActivePanel = (
      <AdminStudentRoadmaps
        student={roadmapStudent}
        onBack={handleBackToStudents}
      />
    );
  } else if (section === "students") {
    ActivePanel = (
      <AdminStudents
        onViewChats={handleViewChats}
        onViewRoadmaps={handleViewRoadmaps}
      />
    );
  } else {
    const Comp = SECTIONS.find((s) => s.key === section)?.Component;
    // Legacy sections that pass their own Component
    const LegacyComponents = {
      roles: AdminRoles,
      branches: AdminBranches,
      beyond: AdminBeyond,
      guidance: AdminGuidance,
      requests: AdminRequests,
      interest: AdminInterest,
      guides: AdminGuides,
    };
    const LegacyComp = LegacyComponents[section] || AdminRoles;
    ActivePanel = <LegacyComp onNavigate={navigateTo} />;
  }

  return (
    <div>
      <div className="mobile-section-nav">
        {SECTIONS.map((s) => (
          <button key={s.key} className={`msn-btn ${section === s.key ? "active" : ""}`} onClick={() => navigateTo(s.key)}>
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
              <div
                key={s.key}
                className={`sidebar-link ${section === s.key || (section === "student-chats" && s.key === "students") || (section === "student-roadmaps" && s.key === "students") ? "active" : ""}`}
                onClick={() => navigateTo(s.key)}
              >
                <s.icon />{s.label}
              </div>
            ))}

            {/* Sub-links when drilling into chats/roadmaps */}
            {(section === "student-chats" || section === "student-roadmaps") && (
              <div style={{ marginLeft: "1.25rem", borderLeft: "2px solid var(--accent, #6366f1)", paddingLeft: "0.75rem" }}>
                {section === "student-chats" && (
                  <div className="sidebar-link active" style={{ fontSize: "0.82rem" }}>
                    <FaComments /> Chats
                  </div>
                )}
                {section === "student-roadmaps" && (
                  <div className="sidebar-link active" style={{ fontSize: "0.82rem" }}>
                    <FaRoad /> Roadmaps
                  </div>
                )}
              </div>
            )}

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
          {ActivePanel}
        </div>
      </div>
    </div>
  );
}
