import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaEnvelope,
  FaMagnifyingGlass,
  FaXmark,
  FaUser,
  FaRobot,
  FaComments,
  FaArrowRight,
  FaFilter,
} from "react-icons/fa6";
import { fetchAllMessages } from "../../services/adminService.js";

export default function AdminMessages({ onNavigateToChat }) {
  const [messages, setMessages] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole] = useState("all"); // "all" | "user" | "assistant"
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (search.trim()) params.search = search.trim();
      if (role !== "all") params.role = role;

      const res = await fetchAllMessages(params);
      setMessages(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [page, search, role]);

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
            <h1 className="admin-page-title">Messages & AI Activity</h1>
            <span className="admin-total-badge">
              {meta.total} message{meta.total !== 1 ? "s" : ""} recorded
            </span>
          </div>
          <p className="admin-page-subtitle">
            Audit dialogue, inspect prompts, and monitor AI mentor responses across all students
          </p>
        </div>
      </div>

      {/* ── SEARCH & FILTER TOOLBAR (REQUIREMENT 7) ── */}
      <div className="admin-toolbar-card">
        <form onSubmit={handleSearch} className="toolbar-search-form">
          <div className="toolbar-input-wrap">
            <FaMagnifyingGlass className="search-prefix-icon" />
            <input
              type="text"
              className="toolbar-search-field"
              placeholder="Search message text, queries, or AI responses…"
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
            <span className="select-label">Sender Type:</span>
            <select
              className="toolbar-select"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Senders</option>
              <option value="user">Student Messages (Queries)</option>
              <option value="assistant">AI Mentor Responses</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── MESSAGES DATA TABLE (REQUIREMENT 7 & 10) ── */}
      <div className="admin-table-panel">
        {loading ? (
          <div className="admin-table-loading">
            <div className="admin-spinner" />
            <p>Loading messages activity…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="admin-table-empty">
            <FaEnvelope className="empty-state-icon" />
            <h3>No messages found</h3>
            <p>Try clearing or modifying your search filter.</p>
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Student</th>
                  <th>Message Preview</th>
                  <th>Chat Context</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((item, idx) => {
                  const student = item.student;
                  const msg = item.message;
                  const isUser = msg?.role === "user";

                  return (
                    <tr
                      key={item._id || msg?._id || idx}
                      className="table-row-hover"
                      onClick={() => {
                        if (onNavigateToChat && item.chatId) {
                          onNavigateToChat(item.chatId);
                        }
                      }}
                      title="Click to view conversation"
                    >
                      {/* Sender Type Badge */}
                      <td>
                        <span
                          className={`message-sender-chip ${
                            isUser ? "sender-user" : "sender-assistant"
                          }`}
                        >
                          {isUser ? <FaUser /> : <FaRobot />}
                          <span>{isUser ? "Student" : "AI Mentor"}</span>
                        </span>
                      </td>

                      {/* Student */}
                      <td>
                        <div className="student-profile-cell">
                          <div className="student-avatar-badge-sm">
                            {(student?.name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="student-cell-name">
                              {student?.name || "Student"}
                            </span>
                            <span className="student-cell-email">
                              {student?.branch ? `${student.branch} · ` : ""}
                              {student?.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Message Preview */}
                      <td style={{ maxWidth: 360 }}>
                        <p className="cell-message-text">
                          {msg?.content || "—"}
                        </p>
                      </td>

                      {/* Chat Context */}
                      <td>
                        <div className="cell-chat-context">
                          <strong>{item.chatTitle || "Conversation"}</strong>
                          {item.branch && (
                            <span className="admin-branch-badge">{item.branch}</span>
                          )}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td>
                        <span className="student-cell-date">
                          {msg?.createdAt
                            ? new Date(msg.createdAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateToChat && item.chatId) {
                              onNavigateToChat(item.chatId);
                            }
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
    </div>
  );
}
