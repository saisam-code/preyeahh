import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaCheck,
  FaUserClock,
  FaComments,
  FaMap,
  FaEnvelope,
  FaArrowRight,
  FaRotate,
  FaTriangleExclamation,
  FaArrowTrendUp,
  FaRobot,
  FaUser,
  FaCircle,
  FaRegClock,
} from "react-icons/fa6";
import AdminCard from "./AdminCard.jsx";
import {
  fetchOverviewStats,
  fetchDashboardRecent,
} from "../../services/adminService.js";

export default function AdminDashboard({
  onNavigate,
  onSelectStudent,
  onSelectChat,
  onSelectRoadmap,
}) {
  const [stats, setStats] = useState(null);
  const [recentData, setRecentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [overviewRes, recentRes] = await Promise.allSettled([
        fetchOverviewStats(),
        fetchDashboardRecent(),
      ]);

      if (overviewRes.status === "fulfilled") {
        setStats(overviewRes.value.data);
      }
      if (recentRes.status === "fulfilled") {
        setRecentData(recentRes.value.data);
      }
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !stats) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-spinner" />
        <p>Loading dashboard overview…</p>
      </div>
    );
  }

  const s = stats || {
    totalStudents: 0,
    verifiedStudents: 0,
    unverifiedStudents: 0,
    totalChats: 0,
    totalRoadmaps: 0,
    totalMessages: 0,
  };

  const pending = recentData?.pending || {
    pendingGuideRequests: 0,
    pendingRoleRequests: 0,
    unverifiedStudents: s.unverifiedStudents || 0,
  };

  const hasAttentionNeeded =
    pending.pendingGuideRequests > 0 ||
    pending.pendingRoleRequests > 0 ||
    pending.unverifiedStudents > 0;

  return (
    <div className="admin-dashboard-container">
      {/* ── TOP HEADER ── */}
      <div className="admin-dashboard-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">
            Overview of your platform activity & student engagement
          </p>
        </div>
        <div className="admin-header-actions">
          <div className="status-indicator-chip">
            <span className="live-dot" />
            <span>Live System</span>
          </div>
          <button
            className={`btn btn-outline btn-sm ${refreshing ? "loading" : ""}`}
            onClick={() => loadData(true)}
            title="Refresh dashboard metrics"
            disabled={refreshing}
          >
            <FaRotate className={refreshing ? "spin-icon" : ""} />
            <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ── ATTENTION REQUIRED STRIP (OPERATIONAL PRIORITY) ── */}
      {hasAttentionNeeded && (
        <div className="admin-attention-banner">
          <div className="attention-header">
            <div className="attention-icon">
              <FaTriangleExclamation />
            </div>
            <div>
              <strong>Items Requiring Attention</strong>
              <p>There are pending items awaiting administrator review.</p>
            </div>
          </div>
          <div className="attention-action-chips">
            {pending.unverifiedStudents > 0 && (
              <button
                className="attention-chip chip-warning"
                onClick={() => onNavigate("students", { verified: "false" })}
              >
                <span>{pending.unverifiedStudents} Unverified Student{pending.unverifiedStudents !== 1 ? "s" : ""}</span>
                <FaArrowRight />
              </button>
            )}
            {pending.pendingRoleRequests > 0 && (
              <button
                className="attention-chip chip-warning"
                onClick={() => onNavigate("requests")}
              >
                <span>{pending.pendingRoleRequests} Pending Role Request{pending.pendingRoleRequests !== 1 ? "s" : ""}</span>
                <FaArrowRight />
              </button>
            )}
            {pending.pendingGuideRequests > 0 && (
              <button
                className="attention-chip chip-warning"
                onClick={() => onNavigate("guides")}
              >
                <span>{pending.pendingGuideRequests} Pending Guide Request{pending.pendingGuideRequests !== 1 ? "s" : ""}</span>
                <FaArrowRight />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── SECTION 1: COMPACT KPI CARDS GRID (REQUIREMENTS 1 & 8) ── */}
      <section className="dashboard-section">
        <div className="section-label-bar">
          <span className="section-label">KEY PERFORMANCE METRICS</span>
          <span className="section-hint">Click any card to open management</span>
        </div>

        <div className="admin-kpi-grid">
          {/* Card 1: Total Students */}
          <AdminCard
            icon={FaUsers}
            label="Total Students"
            value={s.totalStudents}
            subtext="Registered platform learners"
            badgeText="All accounts"
            badgeType="neutral"
            variant="neutral"
            onClick={() => onNavigate("students", { verified: "all" })}
          />

          {/* Card 2: Verified Students */}
          <AdminCard
            icon={FaCheck}
            label="Verified Students"
            value={s.verifiedStudents}
            subtext={`${s.totalStudents ? Math.round((s.verifiedStudents / s.totalStudents) * 100) : 0}% verification rate`}
            badgeText="Verified"
            badgeType="success"
            variant="success"
            onClick={() => onNavigate("students", { verified: "true" })}
          />

          {/* Card 3: Unverified Students */}
          <AdminCard
            icon={FaUserClock}
            label="Unverified Students"
            value={s.unverifiedStudents}
            subtext={s.unverifiedStudents > 0 ? "Requires email review" : "All users verified"}
            badgeText={s.unverifiedStudents > 0 ? "Pending" : "None"}
            badgeType={s.unverifiedStudents > 0 ? "warning" : "success"}
            variant={s.unverifiedStudents > 0 ? "warning" : "neutral"}
            onClick={() => onNavigate("students", { verified: "false" })}
          />

          {/* Card 4: Total Chats */}
          <AdminCard
            icon={FaComments}
            label="Total Chats"
            value={s.totalChats}
            subtext="Conversations initiated"
            badgeText="Active"
            badgeType="info"
            variant="info"
            onClick={() => onNavigate("chats")}
          />

          {/* Card 5: AI Roadmaps */}
          <AdminCard
            icon={FaMap}
            label="AI Roadmaps"
            value={s.totalRoadmaps}
            subtext="Personalized learning paths"
            badgeText="Generated"
            badgeType="info"
            variant="info"
            onClick={() => onNavigate("roadmaps")}
          />

          {/* Card 6: AI Messages */}
          <AdminCard
            icon={FaEnvelope}
            label="AI Messages"
            value={s.totalMessages}
            subtext="Total exchange interactions"
            badgeText="Activity"
            badgeType="neutral"
            variant="neutral"
            onClick={() => onNavigate("messages")}
          />
        </div>
      </section>

      {/* ── SECTION 2: USEFUL OPERATIONAL PREVIEWS (REQUIREMENT 2) ── */}
      <section className="dashboard-section" style={{ marginTop: "2rem" }}>
        <div className="section-label-bar">
          <span className="section-label">OPERATIONAL ACTIVITY STREAM</span>
          <span className="section-hint">Recent records across all platform modules</span>
        </div>

        <div className="operational-split-grid">
          {/* Card Box 1: Recent Students */}
          <div className="admin-panel-box">
            <div className="panel-box-header">
              <div>
                <h3 className="panel-box-title">Recent Students</h3>
                <span className="panel-box-subtitle">Newly registered platform accounts</span>
              </div>
              <button
                className="panel-view-all-btn"
                onClick={() => onNavigate("students", { verified: "all" })}
              >
                View all students →
              </button>
            </div>

            <div className="panel-box-content">
              {(!recentData?.recentStudents || recentData.recentStudents.length === 0) ? (
                <div className="panel-empty">No recent students</div>
              ) : (
                <div className="panel-table-wrap">
                  <table className="compact-stream-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Branch</th>
                        <th>Status</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentData.recentStudents.map((st) => (
                        <tr
                          key={st._id}
                          className="clickable-row"
                          onClick={() => {
                            if (onSelectStudent) onSelectStudent(st);
                            else onNavigate("students", { verified: "all", studentId: st._id });
                          }}
                          title="Click to view student profile"
                        >
                          <td>
                            <div className="student-compact-cell">
                              <div className="avatar-mini">
                                {(st.name || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <strong className="cell-name">{st.name}</strong>
                                <span className="cell-email">{st.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="admin-branch-badge">
                              {st.branch || "—"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-chip ${
                                st.isVerified ? "chip-verified" : "chip-unverified"
                              }`}
                            >
                              {st.isVerified ? "Verified" : "Unverified"}
                            </span>
                          </td>
                          <td className="cell-time">
                            {new Date(st.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Card Box 2: Recent Chats */}
          <div className="admin-panel-box">
            <div className="panel-box-header">
              <div>
                <h3 className="panel-box-title">Recent Chats</h3>
                <span className="panel-box-subtitle">Latest active chat conversations</span>
              </div>
              <button
                className="panel-view-all-btn"
                onClick={() => onNavigate("chats")}
              >
                View all chats →
              </button>
            </div>

            <div className="panel-box-content">
              {(!recentData?.recentChats || recentData.recentChats.length === 0) ? (
                <div className="panel-empty">No active conversations found</div>
              ) : (
                <div className="panel-table-wrap">
                  <table className="compact-stream-table">
                    <thead>
                      <tr>
                        <th>Topic & Student</th>
                        <th>Branch</th>
                        <th>Messages</th>
                        <th>Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentData.recentChats.map((chat) => (
                        <tr
                          key={chat._id}
                          className="clickable-row"
                          onClick={() => {
                            if (onSelectChat) onSelectChat(chat);
                            else onNavigate("chats", { chatId: chat._id });
                          }}
                          title="Click to inspect chat"
                        >
                          <td>
                            <div className="chat-compact-cell">
                              <strong className="cell-title">
                                {chat.title || "Untitled Conversation"}
                              </strong>
                              <span className="cell-sub">
                                {chat.studentId?.name || "Student"}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="admin-branch-badge">
                              {chat.branch || chat.studentId?.branch || "—"}
                            </span>
                          </td>
                          <td>
                            <span className="admin-count-pill">
                              {chat.messages?.length || 0} msgs
                            </span>
                          </td>
                          <td className="cell-time">
                            {new Date(chat.updatedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Card Box 3: Recent AI Roadmaps */}
          <div className="admin-panel-box">
            <div className="panel-box-header">
              <div>
                <h3 className="panel-box-title">Recent AI Roadmaps</h3>
                <span className="panel-box-subtitle">Curated student roadmaps generated</span>
              </div>
              <button
                className="panel-view-all-btn"
                onClick={() => onNavigate("roadmaps")}
              >
                View all roadmaps →
              </button>
            </div>

            <div className="panel-box-content">
              {(!recentData?.recentRoadmaps || recentData.recentRoadmaps.length === 0) ? (
                <div className="panel-empty">No roadmaps generated yet</div>
              ) : (
                <div className="panel-table-wrap">
                  <table className="compact-stream-table">
                    <thead>
                      <tr>
                        <th>Roadmap</th>
                        <th>Student</th>
                        <th>Level</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentData.recentRoadmaps.map((rm) => (
                        <tr
                          key={rm._id}
                          className="clickable-row"
                          onClick={() => {
                            if (onSelectRoadmap) onSelectRoadmap(rm);
                            else onNavigate("roadmaps", { roadmapId: rm._id });
                          }}
                          title="Click to view roadmap"
                        >
                          <td>
                            <strong className="cell-title">{rm.title}</strong>
                          </td>
                          <td className="cell-sub">
                            {rm.studentId?.name || "Student"}
                          </td>
                          <td>
                            <span className={`level-chip level-${rm.level || "beginner"}`}>
                              {rm.level || "beginner"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-chip ${
                                rm.isCompleted ? "chip-verified" : "chip-neutral"
                              }`}
                            >
                              {rm.isCompleted ? "Completed" : "In Progress"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Card Box 4: Recent Messages Stream */}
          <div className="admin-panel-box">
            <div className="panel-box-header">
              <div>
                <h3 className="panel-box-title">Recent Messages Activity</h3>
                <span className="panel-box-subtitle">Live stream of student & AI exchanges</span>
              </div>
              <button
                className="panel-view-all-btn"
                onClick={() => onNavigate("messages")}
              >
                View all messages →
              </button>
            </div>

            <div className="panel-box-content">
              {(!recentData?.recentMessages || recentData.recentMessages.length === 0) ? (
                <div className="panel-empty">No recent messages recorded</div>
              ) : (
                <div className="message-stream-list">
                  {recentData.recentMessages.map((msgItem, idx) => {
                    const isUser = msgItem.message?.role === "user";
                    return (
                      <div
                        key={idx}
                        className="stream-msg-card"
                        onClick={() => onNavigate("chats", { chatId: msgItem.chatId })}
                        title="Click to view parent chat"
                      >
                        <div className="msg-stream-icon">
                          {isUser ? <FaUser /> : <FaRobot />}
                        </div>
                        <div className="msg-stream-main">
                          <div className="msg-stream-top">
                            <strong className="stream-author">
                              {isUser ? msgItem.studentName || "Student" : "AI Mentor"}
                            </strong>
                            <span className="stream-chat-context">
                              in {msgItem.chatTitle || "Chat"}
                            </span>
                            {msgItem.message?.createdAt && (
                              <span className="stream-time">
                                {new Date(msgItem.message.createdAt).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                          <p className="msg-stream-snippet">
                            {msgItem.message?.content?.slice(0, 110)}
                            {(msgItem.message?.content?.length || 0) > 110 ? "…" : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
