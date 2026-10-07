import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaComments,
  FaMagnifyingGlass,
  FaXmark,
  FaUser,
  FaRobot,
  FaBoxArchive,
  FaCircle,
  FaArrowLeft,
  FaClock,
} from "react-icons/fa6";
import { fetchAllChats } from "../../services/adminService.js";

const BRANCH_OPTIONS = [
  "all",
  "CSE",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "IT",
  "AIDS",
  "AIML",
  "CSD",
  "CSBS",
];

export default function AdminChats({ targetChatId = null }) {
  const [chats, setChats] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState("all"); // "all" | "active" | "archived"
  const [page, setPage] = useState(1);

  // Active expanded/opened chat for reading messages
  const [selectedChat, setSelectedChat] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (branch !== "all") params.branch = branch;
      if (status !== "all") params.status = status;

      const res = await fetchAllChats(params);
      const list = res.data || [];
      setChats(list);
      if (res.meta) setMeta(res.meta);

      if (targetChatId && !selectedChat) {
        const found = list.find((c) => c._id === targetChatId);
        if (found) setSelectedChat(found);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [page, search, branch, status, targetChatId, selectedChat]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="admin-management-page">
      {/* ── HEADER ── */}
      <div className="admin-header-row">
        <div>
          <div className="admin-header-title-wrap">
            <h1 className="admin-page-title">Chats Management</h1>
            <span className="admin-total-badge">
              {meta.total} conversation{meta.total !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="admin-page-subtitle">
            Inspect live student AI interactions, conversations, and mentorship dialogue
          </p>
        </div>
      </div>

      {/* ── SEARCH & FILTER TOOLBAR (REQUIREMENT 5) ── */}
      <div className="admin-toolbar-card">
        <form onSubmit={handleSearch} className="toolbar-search-form">
          <div className="toolbar-input-wrap">
            <FaMagnifyingGlass className="search-prefix-icon" />
            <input
              type="text"
              className="toolbar-search-field"
              placeholder="Search chats by title, topic, or keyword…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button type="button" className="search-clear-btn" onClick={clearSearch}>
                <FaXmark />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>

        <div className="toolbar-controls-row">
          <div className="select-with-label">
            <span className="select-label">Branch:</span>
            <select
              className="toolbar-select"
              value={branch}
              onChange={(e) => {
                setBranch(e.target.value);
                setPage(1);
              }}
            >
              {BRANCH_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b === "all" ? "All Branches" : b}
                </option>
              ))}
            </select>
          </div>

          <div className="select-with-label">
            <span className="select-label">Status:</span>
            <select
              className="toolbar-select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Conversations</option>
              <option value="active">Active Threads</option>
              <option value="archived">Archived Threads</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── CHATS LISTING & CONVERSATION VIEWER ── */}
      <div className="admin-table-panel">
        {loading ? (
          <div className="admin-table-loading">
            <div className="admin-spinner" />
            <p>Loading conversations…</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="admin-table-empty">
            <FaComments className="empty-state-icon" />
            <h3>No conversations found</h3>
            <p>Try modifying your search or filter settings.</p>
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Conversation</th>
                  <th>Student</th>
                  <th>Branch</th>
                  <th>Messages</th>
                  <th>Last Message</th>
                  <th>Updated</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {chats.map((chat) => {
                  const student = chat.studentId;
                  const lastMsg = chat.messages?.[chat.messages.length - 1];

                  return (
                    <tr
                      key={chat._id}
                      className="table-row-hover"
                      onClick={() => setSelectedChat(chat)}
                    >
                      {/* Title & Topic */}
                      <td>
                        <div className="chat-thread-cell">
                          <div className="chat-thread-title">
                            <FaCircle
                              style={{
                                fontSize: "0.45rem",
                                color: chat.isArchived ? "var(--text-muted)" : "#16a34a",
                                marginRight: "0.35rem",
                              }}
                            />
                            <strong>{chat.title || "Untitled Conversation"}</strong>
                          </div>
                          {chat.topic && (
                            <span className="chat-thread-topic">{chat.topic}</span>
                          )}
                        </div>
                      </td>

                      {/* Student */}
                      <td>
                        <div className="student-profile-cell">
                          <div className="student-avatar-badge-sm">
                            {(student?.name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="student-cell-name">{student?.name || "Unknown"}</span>
                            <span className="student-cell-email">{student?.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Branch */}
                      <td>
                        <span className="admin-branch-badge">
                          {chat.branch || student?.branch || "—"}
                        </span>
                      </td>

                      {/* Messages count */}
                      <td>
                        <span className="admin-count-pill">
                          {chat.messages?.length || 0} msgs
                        </span>
                      </td>

                      {/* Last Message snippet */}
                      <td style={{ maxWidth: 220 }}>
                        {lastMsg ? (
                          <div className="cell-last-message">
                            <span className="last-msg-role">
                              {lastMsg.role === "user" ? "Student" : "AI"}:
                            </span>
                            <span className="last-msg-text">
                              {lastMsg.content?.slice(0, 45)}
                              {(lastMsg.content?.length || 0) > 45 ? "…" : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="cell-muted">—</span>
                        )}
                      </td>

                      {/* Updated Date */}
                      <td>
                        <span className="student-cell-date">
                          {new Date(chat.updatedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChat(chat);
                          }}
                        >
                          <FaComments /> View Chat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="admin-pagination-bar">
            <button
              className="btn btn-outline btn-xs"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Previous
            </button>
            <span className="pagination-text">
              Page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong> (
              {meta.total} total)
            </span>
            <button
              className="btn btn-outline btn-xs"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── CHAT VIEWER DRAWER / MODAL (REQUIREMENT 5) ── */}
      {selectedChat && (
        <div
          className="admin-drawer-overlay open"
          onClick={() => setSelectedChat(null)}
        >
          <div
            className="admin-drawer"
            style={{ maxWidth: 640 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-drawer-header">
              <div className="drawer-header-info">
                <div className="kpi-icon-badge kpi-badge-info">
                  <FaComments />
                </div>
                <div>
                  <h3 className="drawer-title">
                    {selectedChat.title || "Conversation Transcript"}
                  </h3>
                  <p className="drawer-subtitle">
                    Student: {selectedChat.studentId?.name} ({selectedChat.studentId?.email})
                  </p>
                </div>
              </div>
              <button
                className="drawer-close-btn"
                onClick={() => setSelectedChat(null)}
              >
                <FaXmark />
              </button>
            </div>

            {/* Quick Meta */}
            <div className="drawer-meta-strip">
              <div className="meta-strip-item">
                <span className="strip-label">Branch</span>
                <span className="strip-value">
                  {selectedChat.branch || selectedChat.studentId?.branch || "General"}
                </span>
              </div>
              <div className="meta-strip-item">
                <span className="strip-label">Total Messages</span>
                <span className="strip-value">
                  {selectedChat.messages?.length || 0}
                </span>
              </div>
              <div className="meta-strip-item">
                <span className="strip-label">Status</span>
                <span className="strip-value">
                  {selectedChat.isArchived ? "Archived" : "Active Thread"}
                </span>
              </div>
            </div>

            {/* Chat Transcript Body */}
            <div className="admin-drawer-body">
              {(!selectedChat.messages || selectedChat.messages.length === 0) ? (
                <div className="drawer-empty-state">
                  <p>No messages in this conversation thread.</p>
                </div>
              ) : (
                <div className="transcript-bubbles-stack">
                  {selectedChat.messages.map((msg, idx) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg._id || idx}
                        className={`admin-msg admin-msg-${isUser ? "user" : "assistant"}`}
                      >
                        <div className="admin-msg-avatar">
                          {isUser ? <FaUser /> : <FaRobot />}
                        </div>
                        <div className="admin-msg-bubble">
                          <div className="admin-msg-role">
                            {isUser
                              ? selectedChat.studentId?.name || "Student"
                              : "AI Assistant"}
                          </div>
                          <div className="admin-msg-content">{msg.content}</div>
                          {msg.createdAt && (
                            <div className="admin-msg-time">
                              {new Date(msg.createdAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="admin-drawer-footer">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedChat(null)}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
