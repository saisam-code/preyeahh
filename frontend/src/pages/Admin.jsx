import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaChartBar,
  FaCrosshairs,
  FaSchool,
  FaMedal,
  FaMap,
  FaEnvelope,
  FaRightFromBracket,
  FaBars,
  FaXmark,
  FaUsers,
  FaComments,
  FaRoad,
  FaGaugeHigh,
  FaCheck,
  FaUserClock,
  FaShieldHalved,
  FaChevronDown,
  FaChevronRight,
  FaCompass,
} from "react-icons/fa6";

import AdminLogin from "../components/admin/AdminLogin.jsx";
import AdminDashboard from "../components/admin/AdminDashboard.jsx";
import AdminStudents from "../components/admin/AdminStudents.jsx";
import AdminChats from "../components/admin/AdminChats.jsx";
import AdminRoadmaps from "../components/admin/AdminRoadmaps.jsx";
import AdminMessages from "../components/admin/AdminMessages.jsx";
import AdminStudentChats from "../components/admin/AdminStudentChats.jsx";
import AdminStudentRoadmaps from "../components/admin/AdminStudentRoadmaps.jsx";
import AdminRoles from "../components/admin/AdminRoles.jsx";
import AdminBranches from "../components/admin/AdminBranches.jsx";
import AdminBeyond from "../components/admin/AdminBeyond.jsx";
import AdminGuidance from "../components/admin/AdminGuidance.jsx";
import AdminRequests from "../components/admin/AdminRequests.jsx";
import AdminInterest from "../components/admin/AdminInterest.jsx";
import AdminGuides from "../components/admin/AdminGuides.jsx";

import {
  fetchAdminMe,
  refreshAdmin,
  logoutAdmin,
  fetchDashboardRecent,
} from "../services/adminService.js";
import { setAccessToken, getAccessToken, setActiveRole } from "../services/api.js";

export default function Admin() {
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);

  // Active section state
  const [section, setSection] = useState(() => {
    const requested = location.state?.section;
    return requested || "dashboard";
  });

  // Students filter state (e.g. "all", "true", "false")
  const [studentVerifiedFilter, setStudentVerifiedFilter] = useState("all");
  const [targetStudentId, setTargetStudentId] = useState(null);
  const [targetChatId, setTargetChatId] = useState(null);
  const [targetRoadmapId, setTargetRoadmapId] = useState(null);

  // For nested student-drill-down views
  const [chatStudent, setChatStudent] = useState(null);
  const [roadmapStudent, setRoadmapStudent] = useState(null);

  // Sidebar states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [studentsMenuExpanded, setStudentsMenuExpanded] = useState(true);

  // Pending counts for sidebar badges
  const [pendingBadges, setPendingBadges] = useState({
    pendingRequests: 0,
    pendingGuides: 0,
    unverifiedStudents: 0,
  });

  // Check initial admin session
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

  // Fetch pending items for notification badges in the sidebar
  const loadBadges = useCallback(() => {
    if (!admin) return;
    fetchDashboardRecent()
      .then((res) => {
        if (res.data?.pending) {
          setPendingBadges({
            pendingRequests: res.data.pending.pendingRoleRequests || 0,
            pendingGuides: res.data.pending.pendingGuideRequests || 0,
            unverifiedStudents: res.data.pending.unverifiedStudents || 0,
          });
        }
      })
      .catch(() => {});
  }, [admin]);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

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

  // Generic navigation helper that supports extra params for deep linking!
  const navigateTo = (targetSec, params = {}) => {
    setSection(targetSec);
    setChatStudent(null);
    setRoadmapStudent(null);

    if (params.verified !== undefined) {
      setStudentVerifiedFilter(params.verified);
    } else if (targetSec === "students") {
      setStudentVerifiedFilter("all");
    }

    if (params.studentId) setTargetStudentId(params.studentId);
    else setTargetStudentId(null);

    if (params.chatId) setTargetChatId(params.chatId);
    else setTargetChatId(null);

    if (params.roadmapId) setTargetRoadmapId(params.roadmapId);
    else setTargetRoadmapId(null);

    // Auto-expand students sidebar menu if navigating to students
    if (targetSec === "students") {
      setStudentsMenuExpanded(true);
    }

    // Auto close mobile drawer on selection
    if (window.innerWidth < 960) {
      setSidebarCollapsed(true);
    }
  };

  const handleViewStudentChats = (student) => {
    setChatStudent(student);
    setRoadmapStudent(null);
    setSection("student-chats");
  };

  const handleViewStudentRoadmaps = (student) => {
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
      <div className="admin-loading-screen">
        <div className="admin-spinner" />
        <p>Verifying admin authorization…</p>
      </div>
    );
  }

  if (!admin) return <AdminLogin onSuccess={handleLoginSuccess} />;

  // Render active section
  let ActivePanel;
  if (section === "dashboard") {
    ActivePanel = (
      <AdminDashboard
        onNavigate={navigateTo}
        onSelectStudent={(st) => navigateTo("students", { studentId: st._id, verified: "all" })}
        onSelectChat={(ch) => navigateTo("chats", { chatId: ch._id })}
        onSelectRoadmap={(rm) => navigateTo("roadmaps", { roadmapId: rm._id })}
      />
    );
  } else if (section === "students") {
    ActivePanel = (
      <AdminStudents
        initialVerified={studentVerifiedFilter}
        targetStudentId={targetStudentId}
        onViewChats={handleViewStudentChats}
        onViewRoadmaps={handleViewStudentRoadmaps}
      />
    );
  } else if (section === "chats") {
    ActivePanel = <AdminChats targetChatId={targetChatId} />;
  } else if (section === "roadmaps") {
    ActivePanel = <AdminRoadmaps targetRoadmapId={targetRoadmapId} />;
  } else if (section === "messages") {
    ActivePanel = (
      <AdminMessages
        onNavigateToChat={(chatId) => navigateTo("chats", { chatId })}
      />
    );
  } else if (section === "student-chats") {
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
  } else {
    const LegacyComponents = {
      roles: AdminRoles,
      branches: AdminBranches,
      beyond: AdminBeyond,
      guidance: AdminGuidance,
      requests: AdminRequests,
      interest: AdminInterest,
      guides: AdminGuides,
    };
    const LegacyComp = LegacyComponents[section] || AdminDashboard;
    ActivePanel = <LegacyComp onNavigate={navigateTo} />;
  }

  return (
    <div className="admin-root-wrapper">
      {/* ── MOBILE HEADER BAR ── */}
      <div className="admin-mobile-topbar">
        <button
          className="admin-hamburger-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label="Toggle navigation menu"
        >
          {sidebarCollapsed ? <FaBars /> : <FaXmark />}
        </button>
        <div className="mobile-brand">
          <FaShieldHalved className="brand-icon" />
          <span>Preyeahh Admin</span>
        </div>
        <span className="mobile-active-tag">{section}</span>
      </div>

      <div className="admin-saas-layout">
        {/* ── SIDEBAR NAVIGATION (REQUIREMENT 9) ── */}
        <aside className={`admin-saas-sidebar ${sidebarCollapsed ? "collapsed-mobile" : ""}`}>
          <div className="sidebar-brand-block">
            <div className="brand-logo-wrap">
              <FaShieldHalved className="shield-icon" />
              <div className="brand-text-col">
                <span className="brand-title">Preyeahh SaaS</span>
                <span className="brand-role-pill">Admin Console</span>
              </div>
            </div>
            <button
              className="sidebar-close-mobile-btn"
              onClick={() => setSidebarCollapsed(true)}
              aria-label="Close menu"
            >
              <FaXmark />
            </button>
          </div>

          <div className="sidebar-scrollable-nav">
            {/* GROUP 1: OVERVIEW */}
            <div className="nav-group-section">
              <span className="nav-group-title">OVERVIEW</span>
              <button
                className={`sidebar-nav-item ${section === "dashboard" ? "active" : ""}`}
                onClick={() => navigateTo("dashboard")}
              >
                <FaGaugeHigh className="nav-item-icon" />
                <span>Dashboard</span>
              </button>
            </div>

            {/* GROUP 2: STUDENTS */}
            <div className="nav-group-section">
              <div
                className="nav-group-header-clickable"
                onClick={() => setStudentsMenuExpanded(!studentsMenuExpanded)}
              >
                <span className="nav-group-title">STUDENTS</span>
                <span className="nav-group-chevron">
                  {studentsMenuExpanded ? <FaChevronDown /> : <FaChevronRight />}
                </span>
              </div>

              {studentsMenuExpanded && (
                <div className="nav-sub-items-stack">
                  <button
                    className={`sidebar-nav-item ${
                      section === "students" && studentVerifiedFilter === "all" ? "active" : ""
                    }`}
                    onClick={() => navigateTo("students", { verified: "all" })}
                  >
                    <FaUsers className="nav-item-icon" />
                    <span>All Students</span>
                  </button>

                  <button
                    className={`sidebar-nav-item ${
                      section === "students" && studentVerifiedFilter === "true" ? "active" : ""
                    }`}
                    onClick={() => navigateTo("students", { verified: "true" })}
                  >
                    <FaCheck className="nav-item-icon icon-verified" />
                    <span>Verified</span>
                  </button>

                  <button
                    className={`sidebar-nav-item ${
                      section === "students" && studentVerifiedFilter === "false" ? "active" : ""
                    }`}
                    onClick={() => navigateTo("students", { verified: "false" })}
                  >
                    <FaUserClock className="nav-item-icon icon-unverified" />
                    <span>Unverified</span>
                    {pendingBadges.unverifiedStudents > 0 && (
                      <span className="sidebar-badge-count badge-warning">
                        {pendingBadges.unverifiedStudents}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* GROUP 3: COMMUNICATION */}
            <div className="nav-group-section">
              <span className="nav-group-title">COMMUNICATION</span>
              <button
                className={`sidebar-nav-item ${
                  section === "chats" || section === "student-chats" ? "active" : ""
                }`}
                onClick={() => navigateTo("chats")}
              >
                <FaComments className="nav-item-icon" />
                <span>Chats</span>
              </button>

              <button
                className={`sidebar-nav-item ${section === "messages" ? "active" : ""}`}
                onClick={() => navigateTo("messages")}
              >
                <FaEnvelope className="nav-item-icon" />
                <span>Messages</span>
              </button>
            </div>

            {/* GROUP 4: AI INTELLIGENCE */}
            <div className="nav-group-section">
              <span className="nav-group-title">AI LEARNING</span>
              <button
                className={`sidebar-nav-item ${
                  section === "roadmaps" || section === "student-roadmaps" ? "active" : ""
                }`}
                onClick={() => navigateTo("roadmaps")}
              >
                <FaMap className="nav-item-icon" />
                <span>AI Roadmaps</span>
              </button>
            </div>

            {/* GROUP 5: SYSTEM & CONTENT */}
            <div className="nav-group-section">
              <span className="nav-group-title">PLATFORM MANAGEMENT</span>
              <button
                className={`sidebar-nav-item ${section === "roles" ? "active" : ""}`}
                onClick={() => navigateTo("roles")}
              >
                <FaCrosshairs className="nav-item-icon" />
                <span>Manage Roles</span>
              </button>

              <button
                className={`sidebar-nav-item ${section === "branches" ? "active" : ""}`}
                onClick={() => navigateTo("branches")}
              >
                <FaSchool className="nav-item-icon" />
                <span>Manage Branches</span>
              </button>

              <button
                className={`sidebar-nav-item ${section === "beyond" ? "active" : ""}`}
                onClick={() => navigateTo("beyond")}
              >
                <FaMedal className="nav-item-icon" />
                <span>Beyond</span>
              </button>

              <button
                className={`sidebar-nav-item ${section === "guidance" ? "active" : ""}`}
                onClick={() => navigateTo("guidance")}
              >
                <FaCompass className="nav-item-icon" />
                <span>Guidance</span>
              </button>

              <button
                className={`sidebar-nav-item ${section === "requests" ? "active" : ""}`}
                onClick={() => navigateTo("requests")}
              >
                <FaEnvelope className="nav-item-icon" />
                <span>Role Requests</span>
                {pendingBadges.pendingRequests > 0 && (
                  <span className="sidebar-badge-count badge-warning">
                    {pendingBadges.pendingRequests}
                  </span>
                )}
              </button>

              <button
                className={`sidebar-nav-item ${section === "interest" ? "active" : ""}`}
                onClick={() => navigateTo("interest")}
              >
                <FaChartBar className="nav-item-icon" />
                <span>Role Interest</span>
              </button>

              <button
                className={`sidebar-nav-item ${section === "guides" ? "active" : ""}`}
                onClick={() => navigateTo("guides")}
              >
                <FaCrosshairs className="nav-item-icon" />
                <span>Guide Requests</span>
                {pendingBadges.pendingGuides > 0 && (
                  <span className="sidebar-badge-count badge-warning">
                    {pendingBadges.pendingGuides}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* SIDEBAR FOOTER */}
          <div className="sidebar-footer-card">
            <div className="sidebar-user-info">
              <div className="user-avatar-tag">
                {(admin.email || "A")[0].toUpperCase()}
              </div>
              <div className="user-details-col">
                <strong className="user-name">{admin.name || "Administrator"}</strong>
                <span className="user-email">{admin.email}</span>
              </div>
            </div>
            <button className="sidebar-signout-btn" onClick={handleLogout} title="Sign Out">
              <FaRightFromBracket />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <main className="admin-saas-main">
          {ActivePanel}
        </main>
      </div>
    </div>
  );
}
