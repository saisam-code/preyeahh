import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaXmark,
  FaUser,
  FaCheck,
  FaEnvelope,
  FaGraduationCap,
  FaCalendarDays,
  FaComments,
  FaMap,
  FaRobot,
  FaCodeBranch,
  FaClockRotateLeft,
  FaChevronDown,
  FaChevronUp,
  FaLink,
} from "react-icons/fa6";
import {
  fetchStudentChats,
  fetchStudentRoadmaps,
} from "../../services/adminService.js";

export default function AdminStudentDrawer({
  student,
  onClose,
  onOpenFullChats,
  onOpenFullRoadmaps,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "chats" | "roadmaps" | "activity"
  const [chats, setChats] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [expandedChatId, setExpandedChatId] = useState(null);
  const [expandedRoadmapId, setExpandedRoadmapId] = useState(null);

  useEffect(() => {
    if (!student?._id) return;
    let isMounted = true;
    setLoadingExtras(true);

    Promise.allSettled([
      fetchStudentChats(student._id),
      fetchStudentRoadmaps(student._id),
    ])
      .then(([chatsRes, roadmapsRes]) => {
        if (!isMounted) return;
        if (chatsRes.status === "fulfilled") {
          setChats(chatsRes.value.data?.chats || []);
        }
        if (roadmapsRes.status === "fulfilled") {
          setRoadmaps(roadmapsRes.value.data?.roadmaps || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingExtras(false);
      });

    return () => {
      isMounted = false;
    };
  }, [student?._id]);

  if (!student) return null;

  const totalMessages = chats.reduce(
    (acc, c) => acc + (c.messages?.length || 0),
    0
  );

  return (
    <div className="admin-drawer-overlay open" onClick={onClose}>
      <div
        className="admin-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Student Details"
      >
        {/* Drawer Header */}
        <div className="admin-drawer-header">
          <div className="drawer-header-info">
            <div className="drawer-avatar">
              {(student.name || "?")[0].toUpperCase()}
            </div>
            <div>
              <div className="drawer-title-row">
                <h3 className="drawer-title">{student.name}</h3>
                <span
                  className={`admin-status-badge ${
                    student.isVerified ? "badge-verified" : "badge-unverified"
                  }`}
                >
                  {student.isVerified ? "✓ Verified" : "Unverified"}
                </span>
                {student.googleId && (
                  <span className="admin-badge-subtle">Google Auth</span>
                )}
              </div>
              <p className="drawer-subtitle">{student.email}</p>
            </div>
          </div>
          <button
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <FaXmark />
          </button>
        </div>

        {/* Quick Meta Strip */}
        <div className="drawer-meta-strip">
          <div className="meta-strip-item">
            <span className="strip-label">Branch</span>
            <span className="strip-value">{student.branch || "Not Specified"}</span>
          </div>
          <div className="meta-strip-item">
            <span className="strip-label">Joined</span>
            <span className="strip-value">
              {new Date(student.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="meta-strip-item">
            <span className="strip-label">Chats</span>
            <span className="strip-value">{chats.length}</span>
          </div>
          <div className="meta-strip-item">
            <span className="strip-label">AI Roadmaps</span>
            <span className="strip-value">{roadmaps.length}</span>
          </div>
        </div>

        {/* Drawer Tabs Navigation */}
        <div className="drawer-tabs">
          <button
            className={`drawer-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <FaUser /> Overview & Profile
          </button>
          <button
            className={`drawer-tab-btn ${activeTab === "chats" ? "active" : ""}`}
            onClick={() => setActiveTab("chats")}
          >
            <FaComments /> Chats ({chats.length})
          </button>
          <button
            className={`drawer-tab-btn ${activeTab === "roadmaps" ? "active" : ""}`}
            onClick={() => setActiveTab("roadmaps")}
          >
            <FaMap /> AI Roadmaps ({roadmaps.length})
          </button>
          <button
            className={`drawer-tab-btn ${activeTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveTab("activity")}
          >
            <FaClockRotateLeft /> Activity History
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="admin-drawer-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="drawer-section-stack">
              {/* Learning Profile */}
              <div className="drawer-card-box">
                <h4 className="drawer-box-title">Learning & Career Profile</h4>
                <div className="drawer-kv-grid">
                  <div className="kv-cell">
                    <span className="kv-label">Current Role</span>
                    <span className="kv-value">
                      {student.preferences?.currentRole || "—"}
                    </span>
                  </div>
                  <div className="kv-cell">
                    <span className="kv-label">Target Role</span>
                    <span className="kv-value">
                      {student.preferences?.targetRole || "—"}
                    </span>
                  </div>
                  <div className="kv-cell">
                    <span className="kv-label">Experience Level</span>
                    <span className="kv-value">
                      {student.preferences?.experienceLevel || "—"}
                    </span>
                  </div>
                  <div className="kv-cell">
                    <span className="kv-label">Learning Style</span>
                    <span className="kv-value">
                      {student.preferences?.learningStyle || "—"}
                    </span>
                  </div>
                  <div className="kv-cell">
                    <span className="kv-label">Weekly Hours</span>
                    <span className="kv-value">
                      {student.preferences?.weeklyHoursAvailable
                        ? `${student.preferences.weeklyHoursAvailable} hrs/week`
                        : "—"}
                    </span>
                  </div>
                  <div className="kv-cell">
                    <span className="kv-label">Preferred Language</span>
                    <span className="kv-value">
                      {student.preferences?.preferredLanguage || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Profile Summary */}
              {student.preferences?.aiProfileSummary && (
                <div className="drawer-card-box">
                  <h4 className="drawer-box-title">AI Profile Summary</h4>
                  <p className="drawer-summary-text">
                    {student.preferences.aiProfileSummary}
                  </p>
                </div>
              )}

              {/* Skills & Goals */}
              <div className="drawer-card-box">
                <h4 className="drawer-box-title">Skills & Interests</h4>
                {student.preferences?.skills?.length > 0 ? (
                  <div className="drawer-chip-cloud">
                    {student.preferences.skills.map((sk, i) => (
                      <span key={i} className="drawer-skill-chip">
                        {sk.name}{" "}
                        <span className="chip-muted">({sk.level || "beginner"})</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="drawer-empty-text">No skills registered yet.</p>
                )}

                {student.preferences?.goals?.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <h5 className="drawer-subhead">Stated Goals</h5>
                    <ul className="drawer-bullet-list">
                      {student.preferences.goals.map((g, idx) => (
                        <li key={idx}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CHATS */}
          {activeTab === "chats" && (
            <div className="drawer-section-stack">
              <div className="drawer-section-header">
                <div>
                  <h4 className="drawer-box-title" style={{ margin: 0 }}>
                    Conversations
                  </h4>
                  <span className="drawer-hint">
                    {chats.length} thread{chats.length !== 1 ? "s" : ""} ·{" "}
                    {totalMessages} total message{totalMessages !== 1 ? "s" : ""}
                  </span>
                </div>
                {onOpenFullChats && chats.length > 0 && (
                  <button
                    className="btn btn-outline btn-xs"
                    onClick={() => {
                      onOpenFullChats(student);
                      onClose();
                    }}
                  >
                    Open in Chat Manager →
                  </button>
                )}
              </div>

              {loadingExtras ? (
                <div className="drawer-loading">Loading conversations…</div>
              ) : chats.length === 0 ? (
                <div className="drawer-empty-state">
                  <FaComments className="empty-icon" />
                  <p>No chat conversations found for this student.</p>
                </div>
              ) : (
                <div className="drawer-threads-list">
                  {chats.map((chat) => {
                    const isExpanded = expandedChatId === chat._id;
                    const lastMsg = chat.messages?.[chat.messages.length - 1];

                    return (
                      <div
                        key={chat._id}
                        className={`drawer-thread-card ${isExpanded ? "expanded" : ""}`}
                      >
                        <div
                          className="thread-summary-row"
                          onClick={() =>
                            setExpandedChatId(isExpanded ? null : chat._id)
                          }
                        >
                          <div className="thread-main-col">
                            <div className="thread-title-line">
                              <strong>{chat.title || "Untitled Conversation"}</strong>
                              {chat.isArchived && (
                                <span className="status-tag archived">Archived</span>
                              )}
                            </div>
                            <div className="thread-meta-line">
                              {chat.branch && (
                                <span className="admin-branch-badge">
                                  {chat.branch}
                                </span>
                              )}
                              {chat.topic && (
                                <span className="thread-topic">{chat.topic}</span>
                              )}
                              <span className="thread-count">
                                {chat.messages?.length || 0} messages
                              </span>
                            </div>
                          </div>
                          <div className="thread-right-col">
                            <span className="thread-time">
                              {new Date(chat.updatedAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                          </div>
                        </div>

                        {/* Collapsed message preview or expanded message thread */}
                        {isExpanded ? (
                          <div className="thread-conversation-view">
                            {(!chat.messages || chat.messages.length === 0) ? (
                              <p className="drawer-empty-text">No messages yet.</p>
                            ) : (
                              chat.messages.map((m, mIdx) => (
                                <div
                                  key={m._id || mIdx}
                                  className={`drawer-msg-bubble role-${m.role}`}
                                >
                                  <div className="msg-bubble-meta">
                                    <span className="msg-author">
                                      {m.role === "user"
                                        ? student.name
                                        : "AI Mentor"}
                                    </span>
                                    {m.createdAt && (
                                      <span className="msg-timestamp">
                                        {new Date(m.createdAt).toLocaleTimeString(
                                          "en-IN",
                                          {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          }
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  <p className="msg-text-content">{m.content}</p>
                                </div>
                              ))
                            )}
                          </div>
                        ) : (
                          lastMsg && (
                            <div className="thread-last-preview">
                              <span className="preview-label">
                                {lastMsg.role === "user" ? "Student: " : "AI: "}
                              </span>
                              <span className="preview-snippet">
                                {lastMsg.content.slice(0, 90)}
                                {lastMsg.content.length > 90 ? "…" : ""}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROADMAPS */}
          {activeTab === "roadmaps" && (
            <div className="drawer-section-stack">
              <div className="drawer-section-header">
                <div>
                  <h4 className="drawer-box-title" style={{ margin: 0 }}>
                    AI Generated Roadmaps
                  </h4>
                  <span className="drawer-hint">
                    {roadmaps.length} learning path{roadmaps.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {onOpenFullRoadmaps && roadmaps.length > 0 && (
                  <button
                    className="btn btn-outline btn-xs"
                    onClick={() => {
                      onOpenFullRoadmaps(student);
                      onClose();
                    }}
                  >
                    Open in Roadmap Manager →
                  </button>
                )}
              </div>

              {loadingExtras ? (
                <div className="drawer-loading">Loading roadmaps…</div>
              ) : roadmaps.length === 0 ? (
                <div className="drawer-empty-state">
                  <FaMap className="empty-icon" />
                  <p>No roadmaps generated for this student yet.</p>
                </div>
              ) : (
                <div className="drawer-roadmaps-list">
                  {roadmaps.map((r) => {
                    const isExpanded = expandedRoadmapId === r._id;
                    const allTopics =
                      r.sections?.flatMap((s) => s.topics || []) || [];
                    const completedTopics = allTopics.filter(
                      (t) => t.isCompleted
                    ).length;
                    const pct = allTopics.length
                      ? Math.round((completedTopics / allTopics.length) * 100)
                      : 0;

                    return (
                      <div
                        key={r._id}
                        className={`drawer-roadmap-item ${
                          isExpanded ? "expanded" : ""
                        }`}
                      >
                        <div
                          className="roadmap-head-row"
                          onClick={() =>
                            setExpandedRoadmapId(isExpanded ? null : r._id)
                          }
                        >
                          <div style={{ flex: 1 }}>
                            <div className="roadmap-title-row">
                              <strong>{r.title}</strong>
                              <span
                                className={`roadmap-level-pill level-${r.level || "beginner"}`}
                              >
                                {r.level || "beginner"}
                              </span>
                              {r.isCompleted && (
                                <span className="status-tag verified">
                                  ✓ Completed
                                </span>
                              )}
                            </div>
                            <div className="roadmap-meta-info">
                              {r.branch && (
                                <span className="admin-branch-badge">
                                  {r.branch}
                                </span>
                              )}
                              {r.roleId?.title && (
                                <span className="drawer-subtle-badge">
                                  {r.roleId.title}
                                </span>
                              )}
                              <span>
                                {completedTopics}/{allTopics.length} topics ({pct}%)
                              </span>
                            </div>
                            {/* Compact Progress Bar */}
                            <div className="drawer-progress-track">
                              <div
                                className="drawer-progress-fill"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <div className="roadmap-chevron-col">
                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                          </div>
                        </div>

                        {/* Expanded Sections & Topics */}
                        {isExpanded && (
                          <div className="roadmap-expanded-body">
                            {r.description && (
                              <p className="roadmap-desc-para">{r.description}</p>
                            )}

                            {r.sections?.map((sec, sIdx) => (
                              <div key={sec._id || sIdx} className="sec-breakdown">
                                <h5 className="sec-title">{sec.title}</h5>
                                <div className="sec-topics-list">
                                  {sec.topics?.map((top, tIdx) => (
                                    <div
                                      key={top._id || tIdx}
                                      className={`sec-topic-item ${
                                        top.isCompleted ? "done" : ""
                                      }`}
                                    >
                                      <span className="topic-indicator">
                                        {top.isCompleted ? "✓" : "○"}
                                      </span>
                                      <div style={{ flex: 1 }}>
                                        <div className="topic-name">
                                          {top.title}
                                        </div>
                                        {top.resources?.length > 0 && (
                                          <div className="topic-resources-row">
                                            {top.resources.map((res, rIdx) => (
                                              <a
                                                key={rIdx}
                                                href={res.url || "#"}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="topic-resource-link"
                                              >
                                                <FaLink /> {res.title}
                                              </a>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACTIVITY HISTORY */}
          {activeTab === "activity" && (
            <div className="drawer-section-stack">
              <div className="drawer-card-box">
                <h4 className="drawer-box-title">Account Milestones</h4>
                <div className="activity-timeline">
                  <div className="timeline-node">
                    <div className="node-marker" />
                    <div className="node-content">
                      <div className="node-time">
                        {new Date(student.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                      <div className="node-title">Account Created</div>
                      <div className="node-desc">
                        Registered with email: {student.email}
                      </div>
                    </div>
                  </div>

                  <div className="timeline-node">
                    <div className="node-marker" />
                    <div className="node-content">
                      <div className="node-time">Verification Status</div>
                      <div className="node-title">
                        {student.isVerified
                          ? "Email Verified"
                          : "Email Unverified"}
                      </div>
                      <div className="node-desc">
                        {student.isVerified
                          ? "Student verified their email successfully."
                          : "Verification email sent; pending student confirmation."}
                      </div>
                    </div>
                  </div>

                  <div className="timeline-node">
                    <div className="node-marker" />
                    <div className="node-content">
                      <div className="node-time">Onboarding Workflow</div>
                      <div className="node-title">
                        {student.preferences?.onboardingCompleted
                          ? "Onboarding Completed"
                          : student.preferences?.onboardingSkipped
                          ? "Onboarding Skipped"
                          : "Onboarding In Progress"}
                      </div>
                      <div className="node-desc">
                        {student.preferences?.onboardingCompleted
                          ? "Completed preferences & role questionnaires."
                          : "Has not fully finalized onboarding steps."}
                      </div>
                    </div>
                  </div>

                  {chats.length > 0 && (
                    <div className="timeline-node">
                      <div className="node-marker" />
                      <div className="node-content">
                        <div className="node-time">
                          Latest Chat Interaction
                        </div>
                        <div className="node-title">
                          {chats[0].title || "Active Discussion"}
                        </div>
                        <div className="node-desc">
                          {chats[0].messages?.length || 0} messages exchanged in
                          last thread.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="admin-drawer-footer">
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {onOpenFullChats && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  onOpenFullChats(student);
                  onClose();
                }}
              >
                <FaComments /> View Chats
              </button>
            )}
            {onOpenFullRoadmaps && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onOpenFullRoadmaps(student);
                  onClose();
                }}
              >
                <FaMap /> View Roadmaps
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
