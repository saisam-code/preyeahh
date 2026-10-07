import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaMap,
  FaMagnifyingGlass,
  FaXmark,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaLink,
  FaCircle,
  FaGraduationCap,
} from "react-icons/fa6";
import { fetchAllRoadmaps } from "../../services/adminService.js";

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

export default function AdminRoadmaps({ targetRoadmapId = null }) {
  const [roadmaps, setRoadmaps] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [branch, setBranch] = useState("all");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("all"); // "all" | "completed" | "in-progress"
  const [page, setPage] = useState(1);

  // Selected roadmap for inspection
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [expandedSectionId, setExpandedSectionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (branch !== "all") params.branch = branch;
      if (level !== "all") params.level = level;
      if (status !== "all") params.status = status;

      const res = await fetchAllRoadmaps(params);
      const list = res.data || [];
      setRoadmaps(list);
      if (res.meta) setMeta(res.meta);

      if (targetRoadmapId && !selectedRoadmap) {
        const found = list.find((r) => r._id === targetRoadmapId);
        if (found) setSelectedRoadmap(found);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load roadmaps");
    } finally {
      setLoading(false);
    }
  }, [page, search, branch, level, status, targetRoadmapId, selectedRoadmap]);

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
            <h1 className="admin-page-title">AI Roadmaps Management</h1>
            <span className="admin-total-badge">
              {meta.total} learning path{meta.total !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="admin-page-subtitle">
            Curate and monitor student progression across AI-generated learning paths
          </p>
        </div>
      </div>

      {/* ── SEARCH & FILTER TOOLBAR (REQUIREMENT 6) ── */}
      <div className="admin-toolbar-card">
        <form onSubmit={handleSearch} className="toolbar-search-form">
          <div className="toolbar-input-wrap">
            <FaMagnifyingGlass className="search-prefix-icon" />
            <input
              type="text"
              className="toolbar-search-field"
              placeholder="Search by roadmap title, role, or description…"
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
            <span className="select-label">Level:</span>
            <select
              className="toolbar-select"
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
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
              <option value="all">All Roadmaps</option>
              <option value="completed">Completed Only</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── ROADMAPS LISTING TABLE ── */}
      <div className="admin-table-panel">
        {loading ? (
          <div className="admin-table-loading">
            <div className="admin-spinner" />
            <p>Loading roadmaps…</p>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="admin-table-empty">
            <FaMap className="empty-state-icon" />
            <h3>No AI roadmaps found</h3>
            <p>Try refining your search or filters.</p>
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Roadmap</th>
                  <th>Student</th>
                  <th>Level</th>
                  <th>Progress</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {roadmaps.map((rm) => {
                  const student = rm.studentId;
                  const allTopics = rm.sections?.flatMap((s) => s.topics || []) || [];
                  const doneTopics = allTopics.filter((t) => t.isCompleted).length;
                  const pct = allTopics.length
                    ? Math.round((doneTopics / allTopics.length) * 100)
                    : 0;

                  return (
                    <tr
                      key={rm._id}
                      className="table-row-hover"
                      onClick={() => setSelectedRoadmap(rm)}
                    >
                      {/* Title & Role */}
                      <td>
                        <div className="roadmap-title-cell">
                          <strong>{rm.title}</strong>
                          <div className="cell-sub-tags">
                            {rm.branch && (
                              <span className="admin-branch-badge">{rm.branch}</span>
                            )}
                            {rm.roleId?.title && (
                              <span className="drawer-subtle-badge">{rm.roleId.title}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Student */}
                      <td>
                        <div className="student-profile-cell">
                          <div className="student-avatar-badge-sm">
                            {(student?.name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="student-cell-name">{student?.name || "Student"}</span>
                            <span className="student-cell-email">{student?.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Level */}
                      <td>
                        <span className={`level-chip level-${rm.level || "beginner"}`}>
                          {rm.level || "beginner"}
                        </span>
                      </td>

                      {/* Progress */}
                      <td style={{ minWidth: 140 }}>
                        <div className="cell-progress-container">
                          <div className="cell-progress-text">
                            <span>{doneTopics}/{allTopics.length} topics</span>
                            <strong>{pct}%</strong>
                          </div>
                          <div className="drawer-progress-track">
                            <div
                              className="drawer-progress-fill"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Created */}
                      <td>
                        <span className="student-cell-date">
                          {new Date(rm.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`status-chip ${
                            rm.isCompleted ? "chip-verified" : "chip-neutral"
                          }`}
                        >
                          {rm.isCompleted ? "✓ Completed" : "In Progress"}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoadmap(rm);
                          }}
                        >
                          <FaMap /> Details
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

      {/* ── ROADMAP DETAIL DRAWER (REQUIREMENT 6) ── */}
      {selectedRoadmap && (
        <div
          className="admin-drawer-overlay open"
          onClick={() => setSelectedRoadmap(null)}
        >
          <div
            className="admin-drawer"
            style={{ maxWidth: 680 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-drawer-header">
              <div className="drawer-header-info">
                <div className="kpi-icon-badge kpi-badge-info">
                  <FaMap />
                </div>
                <div>
                  <h3 className="drawer-title">{selectedRoadmap.title}</h3>
                  <p className="drawer-subtitle">
                    Student: {selectedRoadmap.studentId?.name} ({selectedRoadmap.studentId?.email})
                  </p>
                </div>
              </div>
              <button
                className="drawer-close-btn"
                onClick={() => setSelectedRoadmap(null)}
              >
                <FaXmark />
              </button>
            </div>

            {/* Quick Strip */}
            <div className="drawer-meta-strip">
              <div className="meta-strip-item">
                <span className="strip-label">Branch</span>
                <span className="strip-value">{selectedRoadmap.branch || "General"}</span>
              </div>
              <div className="meta-strip-item">
                <span className="strip-label">Difficulty</span>
                <span className="strip-value" style={{ textTransform: "capitalize" }}>
                  {selectedRoadmap.level}
                </span>
              </div>
              <div className="meta-strip-item">
                <span className="strip-label">Duration</span>
                <span className="strip-value">~{selectedRoadmap.estimatedWeeks || 4} Weeks</span>
              </div>
              <div className="meta-strip-item">
                <span className="strip-label">Sections</span>
                <span className="strip-value">{selectedRoadmap.sections?.length || 0}</span>
              </div>
            </div>

            {/* Roadmap Body */}
            <div className="admin-drawer-body">
              {selectedRoadmap.description && (
                <div className="drawer-card-box">
                  <h4 className="drawer-box-title">Overview</h4>
                  <p className="drawer-summary-text">{selectedRoadmap.description}</p>
                </div>
              )}

              {/* Fit Snapshot */}
              {selectedRoadmap.fitSnapshot?.whyThisFits?.length > 0 && (
                <div className="drawer-card-box">
                  <h4 className="drawer-box-title">Why This Fits The Student</h4>
                  <ul className="drawer-bullet-list">
                    {selectedRoadmap.fitSnapshot.whyThisFits.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                  {selectedRoadmap.fitSnapshot.basedOn?.length > 0 && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Derived from: {selectedRoadmap.fitSnapshot.basedOn.join(", ")}
                    </div>
                  )}
                </div>
              )}

              {/* Sections Breakdown */}
              <div className="drawer-card-box">
                <h4 className="drawer-box-title">Curriculum Sections & Topics</h4>
                <div className="roadmap-sections-tree">
                  {(selectedRoadmap.sections || []).map((sec, sIdx) => {
                    const isExpanded = expandedSectionId === sec._id;
                    const secDone = (sec.topics || []).filter((t) => t.isCompleted).length;

                    return (
                      <div key={sec._id || sIdx} className="roadmap-tree-node">
                        <div
                          className="roadmap-tree-header"
                          onClick={() =>
                            setExpandedSectionId(isExpanded ? null : sec._id)
                          }
                        >
                          <div>
                            <strong>{sec.title}</strong>
                            <span className="tree-sec-meta">
                              {secDone}/{(sec.topics || []).length} done
                            </span>
                          </div>
                          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </div>

                        {isExpanded && (
                          <div className="roadmap-tree-topics">
                            {sec.topics?.map((top, tIdx) => (
                              <div
                                key={top._id || tIdx}
                                className={`tree-topic-row ${
                                  top.isCompleted ? "topic-completed" : ""
                                }`}
                              >
                                <span className="topic-check-icon">
                                  {top.isCompleted ? "✓" : "○"}
                                </span>
                                <div style={{ flex: 1 }}>
                                  <div className="tree-topic-title">{top.title}</div>
                                  {top.description && (
                                    <p className="tree-topic-desc">{top.description}</p>
                                  )}
                                  {top.resources?.length > 0 && (
                                    <div className="tree-topic-resources">
                                      {top.resources.map((res, rIdx) => (
                                        <a
                                          key={rIdx}
                                          href={res.url || "#"}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="topic-res-chip"
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
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="admin-drawer-footer">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedRoadmap(null)}
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
