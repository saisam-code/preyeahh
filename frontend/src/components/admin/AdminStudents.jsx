import React, { useCallback, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  FaMagnifyingGlass,
  FaXmark,
  FaEye,
  FaComments,
  FaMap,
  FaEllipsisVertical,
  FaFilter,
  FaArrowDownAZ,
  FaUser,
  FaCheck,
  FaUserClock,
} from "react-icons/fa6";
import { fetchAllStudents } from "../../services/adminService.js";
import AdminStudentDrawer from "./AdminStudentDrawer.jsx";

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

export default function AdminStudents({
  initialVerified = "all",
  targetStudentId = null,
  onViewChats,
  onViewRoadmaps,
}) {
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [branch, setBranch] = useState("all");
  const [verified, setVerified] = useState(initialVerified);
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "oldest" | "name_asc" | "name_desc"
  const [page, setPage] = useState(1);

  // Drawer selected student
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Active dropdown row menu
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update verified filter if initialVerified changes
  useEffect(() => {
    if (initialVerified) {
      setVerified(initialVerified);
      setPage(1);
    }
  }, [initialVerified]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (branch !== "all") params.branch = branch;
      if (verified !== "all") params.verified = verified;

      const res = await fetchAllStudents(params);
      let list = res.data || [];

      // Sort client-side if needed for name or chronological order
      if (sortBy === "oldest") {
        list = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortBy === "name_asc") {
        list = [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      } else if (sortBy === "name_desc") {
        list = [...list].sort((a, b) => (b.name || "").localeCompare(a.name || ""));
      }

      setStudents(list);
      if (res.meta) setMeta(res.meta);

      // If targetStudentId was passed, open its drawer automatically
      if (targetStudentId && !selectedStudent) {
        const found = list.find((s) => s._id === targetStudentId);
        if (found) setSelectedStudent(found);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [page, search, branch, verified, sortBy, targetStudentId, selectedStudent]);

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

  const resetAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setBranch("all");
    setVerified("all");
    setSortBy("newest");
    setPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" || branch !== "all" || verified !== "all" || sortBy !== "newest";

  return (
    <div className="admin-management-page">
      {/* ── TOP HEADER ── */}
      <div className="admin-header-row">
        <div>
          <div className="admin-header-title-wrap">
            <h1 className="admin-page-title">Students Management</h1>
            <span className="admin-total-badge">
              {meta.total} student{meta.total !== 1 ? "s" : ""}
            </span>
            {verified === "true" && (
              <span className="filter-pill-active">Filtered: Verified only</span>
            )}
            {verified === "false" && (
              <span className="filter-pill-active pill-warning">Filtered: Unverified only</span>
            )}
          </div>
          <p className="admin-page-subtitle">
            Search, filter, inspect profiles, and monitor student chats & AI roadmaps
          </p>
        </div>

        {hasActiveFilters && (
          <button className="btn btn-outline btn-xs" onClick={resetAllFilters}>
            <FaXmark /> Reset Filters
          </button>
        )}
      </div>

      {/* ── FILTER & SEARCH TOOLBAR (REQUIREMENT 3) ── */}
      <div className="admin-toolbar-card">
        <form onSubmit={handleSearch} className="toolbar-search-form">
          <div className="toolbar-input-wrap">
            <FaMagnifyingGlass className="search-prefix-icon" />
            <input
              type="text"
              className="toolbar-search-field"
              placeholder="Search students by name or email…"
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
          {/* Branch filter */}
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

          {/* Verification filter */}
          <div className="select-with-label">
            <span className="select-label">Status:</span>
            <select
              className="toolbar-select"
              value={verified}
              onChange={(e) => {
                setVerified(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="true">Verified Only</option>
              <option value="false">Unverified Only</option>
            </select>
          </div>

          {/* Sort filter */}
          <div className="select-with-label">
            <span className="select-label">Sort:</span>
            <select
              className="toolbar-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── COMPACT DATA TABLE (REQUIREMENT 3 & 10) ── */}
      <div className="admin-table-panel">
        {loading ? (
          <div className="admin-table-loading">
            <div className="admin-spinner" />
            <p>Loading students list…</p>
          </div>
        ) : students.length === 0 ? (
          <div className="admin-table-empty">
            <FaUser className="empty-state-icon" />
            <h3>No students found</h3>
            <p>Try adjusting your search query, branch filter, or verification status.</p>
            {hasActiveFilters && (
              <button
                className="btn btn-outline btn-sm"
                style={{ marginTop: "0.75rem" }}
                onClick={resetAllFilters}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Onboarding</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const isMenuOpen = openMenuId === student._id;

                  return (
                    <tr
                      key={student._id}
                      className="table-row-hover"
                      onClick={() => setSelectedStudent(student)}
                    >
                      {/* Name & Avatar */}
                      <td>
                        <div className="student-profile-cell">
                          <div className="student-avatar-badge">
                            {(student.name || "?")[0].toUpperCase()}
                          </div>
                          <span className="student-cell-name">{student.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td>
                        <span className="student-cell-email">{student.email}</span>
                      </td>

                      {/* Branch */}
                      <td>
                        {student.branch ? (
                          <span className="admin-branch-badge">{student.branch}</span>
                        ) : (
                          <span className="cell-muted">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`admin-status-badge ${
                            student.isVerified ? "badge-verified" : "badge-unverified"
                          }`}
                        >
                          {student.isVerified ? "✓ Verified" : "Unverified"}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td>
                        <span className="student-cell-date">
                          {new Date(student.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Onboarding */}
                      <td>
                        {student.preferences?.onboardingCompleted ? (
                          <span className="status-dot-text text-success">
                            <span className="dot dot-success" /> Completed
                          </span>
                        ) : student.preferences?.onboardingSkipped ? (
                          <span className="status-dot-text text-warning">
                            <span className="dot dot-warning" /> Skipped
                          </span>
                        ) : (
                          <span className="status-dot-text text-muted">
                            <span className="dot dot-muted" /> Pending
                          </span>
                        )}
                      </td>

                      {/* Action column: primary button + compact '...' menu (Requirement 3) */}
                      <td
                        style={{ textAlign: "right" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="table-actions-inline">
                          <button
                            className="btn btn-outline btn-xs"
                            onClick={() => setSelectedStudent(student)}
                            title="Inspect student details"
                          >
                            <FaEye /> View
                          </button>

                          {/* Compact More Actions Menu */}
                          <div
                            className="dropdown-actions-wrap"
                            ref={isMenuOpen ? menuRef : null}
                          >
                            <button
                              className="btn-dots-menu"
                              onClick={() =>
                                setOpenMenuId(isMenuOpen ? null : student._id)
                              }
                              title="More actions"
                              aria-label="More actions"
                            >
                              <FaEllipsisVertical />
                            </button>

                            {isMenuOpen && (
                              <div className="actions-dropdown-menu">
                                <button
                                  className="dropdown-menu-item"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setSelectedStudent(student);
                                  }}
                                >
                                  <FaUser /> View Full Profile
                                </button>
                                <button
                                  className="dropdown-menu-item"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    if (onViewChats) onViewChats(student);
                                  }}
                                >
                                  <FaComments /> View Chats
                                </button>
                                <button
                                  className="dropdown-menu-item"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    if (onViewRoadmaps) onViewRoadmaps(student);
                                  }}
                                >
                                  <FaMap /> View AI Roadmaps
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAGINATION CONTROLS ── */}
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

      {/* ── STUDENT DETAILS DRAWER (REQUIREMENT 3) ── */}
      {selectedStudent && (
        <AdminStudentDrawer
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onOpenFullChats={onViewChats}
          onOpenFullRoadmaps={onViewRoadmaps}
        />
      )}
    </div>
  );
}
