import { useEffect, useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import {
  FaEnvelope,
  FaMagnifyingGlass,
  FaXmark,
  FaTrash,
  FaUser,
  FaCheck,
  FaBuilding,
  FaCalendarDays,
  FaPlus,
  FaCircleCheck,
} from "react-icons/fa6";
import {
  fetchRoleRequests,
  dismissRoleRequest,
  acceptRoleRequest,
  clearRoleRequests,
} from "../../services/roleRequestService.js";
import { createRole } from "../../services/rolesService.js";
import { fetchBranches } from "../../services/branchService.js";

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

function linesToArray(str) {
  return str.split("\n").map((s) => s.trim()).filter(Boolean);
}

const emptyRoleForm = {
  title: "", branch: "", type: "core", description: "",
  overview: "", steps: "", skills: "", resources: "",
};

export default function AdminRequests({ onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  // Accept modal state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState(null);
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [branches, setBranches] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchRoleRequests();
      setRequests(data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load role requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    fetchBranches().then(setBranches).catch(() => {});
  }, []);

  const handleDismiss = async (id) => {
    try {
      await dismissRoleRequest(id);
      toast.success("Request dismissed");
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Error dismissing request");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to dismiss all pending role requests?")) return;
    try {
      await clearRoleRequests();
      toast.success("All requests cleared");
      setRequests([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error clearing requests");
    }
  };

  // ── ACCEPT FLOW ──
  const openAcceptModal = (request) => {
    setAcceptingRequest(request);
    setRoleForm({
      ...emptyRoleForm,
      title: request.roleName || "",
      branch: request.branch || branches[0] || "",
      description: request.summary || "",
    });
    setAcceptModalOpen(true);
  };

  const closeAcceptModal = () => {
    setAcceptModalOpen(false);
    setAcceptingRequest(null);
    setRoleForm(emptyRoleForm);
  };

  const handleAcceptSave = async () => {
    if (!roleForm.title.trim()) return toast.error("Role title is required");
    if (!roleForm.branch.trim()) return toast.error("Branch is required");

    setSaving(true);
    try {
      // 1. Create the role
      const payload = {
        title: roleForm.title.trim(),
        branch: roleForm.branch,
        type: roleForm.type,
        description: roleForm.description.trim(),
        guidance: {
          overview: roleForm.overview.trim(),
          steps: linesToArray(roleForm.steps),
          skills: linesToArray(roleForm.skills),
          resources: linesToArray(roleForm.resources),
        },
      };
      const roleRes = await createRole(payload);
      const createdRoleId = roleRes.data._id;

      // 2. Accept the request & link to the created role → triggers email notification
      await acceptRoleRequest(acceptingRequest._id, createdRoleId);

      toast.success("Role created & student will be notified!");
      setRequests((prev) => prev.filter((r) => r._id !== acceptingRequest._id));
      closeAcceptModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error accepting request");
    } finally {
      setSaving(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesBranch = branchFilter === "all" || r.branch?.toUpperCase() === branchFilter.toUpperCase();
      if (!matchesBranch) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const roleMatch = (r.roleName || "").toLowerCase().includes(q);
      const summaryMatch = (r.summary || "").toLowerCase().includes(q);
      const studentNameMatch = (r.student?.name || "").toLowerCase().includes(q);
      const studentEmailMatch = (r.student?.email || r.email || "").toLowerCase().includes(q);

      return roleMatch || summaryMatch || studentNameMatch || studentEmailMatch;
    });
  }, [requests, search, branchFilter]);

  return (
    <div className="admin-management-page">
      {/* ── HEADER ── */}
      <div className="admin-header-row">
        <div>
          <div className="admin-header-title-wrap">
            <h1 className="admin-page-title">Role Requests</h1>
            <span className="admin-total-badge">
              {requests.length} pending request{requests.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="admin-page-subtitle">
            Curate student demand, review suggested industry roles, and track requester identities
          </p>
        </div>

        {requests.length > 0 && (
          <button className="btn btn-outline btn-xs" style={{ color: "var(--error)" }} onClick={handleClearAll}>
            <FaTrash /> Dismiss All
          </button>
        )}
      </div>

      {/* ── TOOLBAR: SEARCH & BRANCH FILTER ── */}
      <div className="admin-toolbar-card">
        <div className="toolbar-search-form" style={{ maxWidth: 360 }}>
          <div className="toolbar-input-wrap">
            <FaMagnifyingGlass className="search-prefix-icon" />
            <input
              type="text"
              className="toolbar-search-field"
              placeholder="Search by role, summary, student name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="search-clear-btn" onClick={() => setSearch("")}>
                <FaXmark />
              </button>
            )}
          </div>
        </div>

        <div className="toolbar-controls-row">
          <div className="select-with-label">
            <span className="select-label">Branch:</span>
            <select
              className="toolbar-select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              {BRANCH_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b === "all" ? "All Branches" : b}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="admin-table-panel">
        {loading ? (
          <div className="admin-table-loading">
            <div className="admin-spinner" />
            <p>Loading role requests…</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="admin-table-empty">
            <FaEnvelope className="empty-state-icon" />
            <h3>No pending role requests</h3>
            <p>
              {requests.length === 0
                ? "There are currently no new role suggestions from students."
                : "No requests match your current search and branch filters."}
            </p>
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Requested Role</th>
                  <th>Branch</th>
                  <th>Requested By</th>
                  <th>Summary & Description</th>
                  <th>Submitted Date</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => {
                  const student = r.student;
                  const requesterEmail = student?.email || r.email;
                  const requesterName = student?.name;

                  return (
                    <tr key={r._id} className="table-row-hover">
                      {/* Role Name */}
                      <td>
                        <strong className="cell-title" style={{ fontSize: "0.9rem" }}>
                          {r.roleName}
                        </strong>
                      </td>

                      {/* Branch */}
                      <td>
                        <span className="admin-branch-badge">{r.branch}</span>
                      </td>

                      {/* REQUESTED BY (USER REQUIREMENT) */}
                      <td>
                        {student ? (
                          <div
                            className="student-profile-cell"
                            style={{ cursor: onNavigate ? "pointer" : "default" }}
                            onClick={() => {
                              if (onNavigate && student._id) {
                                onNavigate("students", { studentId: student._id });
                              }
                            }}
                            title={onNavigate ? "Click to view student profile" : undefined}
                          >
                            <div className="student-avatar-badge-sm">
                              {(student.name || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                <span className="student-cell-name">{student.name}</span>
                                <span className="status-chip chip-verified" style={{ fontSize: "0.65rem", padding: "0.08rem 0.35rem" }}>
                                  Student
                                </span>
                              </div>
                              <span className="student-cell-email">{student.email}</span>
                              {student.branch && (
                                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                  Branch: {student.branch}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : requesterEmail ? (
                          <div className="student-profile-cell">
                            <div className="avatar-mini" style={{ background: "var(--surface-mid)", color: "var(--text-muted)" }}>
                              <FaUser style={{ fontSize: "0.68rem" }} />
                            </div>
                            <div>
                              <span className="student-cell-name" style={{ color: "var(--text-dim)" }}>
                                {requesterEmail}
                              </span>
                              <span className="status-chip chip-neutral" style={{ fontSize: "0.65rem", padding: "0.08rem 0.35rem" }}>
                                Guest Request
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="student-profile-cell">
                            <div className="avatar-mini" style={{ background: "var(--surface-mid)", color: "var(--text-muted)" }}>
                              <FaUser style={{ fontSize: "0.68rem" }} />
                            </div>
                            <div>
                              <span className="student-cell-name" style={{ color: "var(--text-muted)" }}>
                                Anonymous Visitor
                              </span>
                              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                No email provided
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Summary */}
                      <td style={{ maxWidth: 320 }}>
                        <p className="cell-message-text" style={{ fontSize: "0.82rem", WebkitLineClamp: 3 }}>
                          {r.summary}
                        </p>
                      </td>

                      {/* Date */}
                      <td>
                        <span className="student-cell-date">
                          {new Date(r.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Actions — ACCEPT + DISMISS */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => openAcceptModal(r)}
                            title="Accept this request and create the role"
                          >
                            <FaCircleCheck /> Accept
                          </button>
                          <button
                            className="btn btn-outline btn-xs"
                            style={{ color: "var(--error)", borderColor: "rgba(220, 38, 38, 0.3)" }}
                            onClick={() => handleDismiss(r._id)}
                            title="Dismiss this request"
                          >
                            <FaXmark /> Dismiss
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ACCEPT ROLE MODAL ── */}
      <div className={`modal-overlay ${acceptModalOpen ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && closeAcceptModal()}>
        <div className="modal" style={{ maxWidth: 620 }}>
          <div className="modal-header">
            <h2>Accept & Create Role</h2>
            <button className="modal-close" onClick={closeAcceptModal}>×</button>
          </div>

          {acceptingRequest && (
            <div style={{
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "0.5rem",
              padding: "0.75rem 1rem",
              margin: "0 1.25rem",
              fontSize: "0.82rem",
              lineHeight: 1.5,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <FaCircleCheck style={{ color: "var(--success)", fontSize: "0.9rem" }} />
                <strong>Accepting request from:</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                {acceptingRequest.student ? (
                  <>
                    <span style={{ fontWeight: 600 }}>{acceptingRequest.student.name}</span>
                    <span style={{ color: "var(--text-muted)" }}>({acceptingRequest.student.email})</span>
                  </>
                ) : acceptingRequest.email ? (
                  <span>{acceptingRequest.email}</span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>Anonymous visitor</span>
                )}
                <span className="admin-branch-badge">{acceptingRequest.branch}</span>
              </div>
              <p style={{ margin: "0.5rem 0 0", color: "var(--text-dim)" }}>
                <em>"{acceptingRequest.summary}"</em>
              </p>
            </div>
          )}

          <div className="role-form-section" style={{ padding: "1rem 1.25rem" }}>
            <div className="role-form-section-title">Role Details</div>
            <div className="form-group">
              <label>Role Title</label>
              <input type="text" value={roleForm.title} onChange={(e) => setRoleForm({ ...roleForm, title: e.target.value })} placeholder="e.g. Software Engineer" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Branch</label>
                <select
                  className="filter-select"
                  value={roleForm.branch}
                  onChange={(e) => setRoleForm({ ...roleForm, branch: e.target.value })}
                >
                  {branches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select className="filter-select" value={roleForm.type} onChange={(e) => setRoleForm({ ...roleForm, type: e.target.value })}>
                  <option value="core">Core</option>
                  <option value="non-core">Non-Core</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea style={{ minHeight: 60 }} value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} placeholder="Brief description of the role" />
            </div>
          </div>

          <div className="role-form-section" style={{ padding: "0 1.25rem 1rem" }}>
            <div className="role-form-section-title">Guidance (Optional)</div>
            <div className="form-group">
              <label>Overview</label>
              <textarea style={{ minHeight: 50 }} value={roleForm.overview} onChange={(e) => setRoleForm({ ...roleForm, overview: e.target.value })} placeholder="Short summary shown on the role card" />
            </div>
            <div className="form-group">
              <label>Steps to Get There <span className="label-hint">(one per line)</span></label>
              <textarea style={{ minHeight: 70 }} value={roleForm.steps} onChange={(e) => setRoleForm({ ...roleForm, steps: e.target.value })} placeholder={"Master DSA\nBuild projects\nTarget internships"} />
            </div>
            <div className="form-group">
              <label>Key Skills <span className="label-hint">(one per line)</span></label>
              <textarea value={roleForm.skills} onChange={(e) => setRoleForm({ ...roleForm, skills: e.target.value })} placeholder={"Python\nMachine Learning\nSQL"} />
            </div>
            <div className="form-group">
              <label>Resources <span className="label-hint">(one per line — <code>Label|https://url</code>)</span></label>
              <textarea value={roleForm.resources} onChange={(e) => setRoleForm({ ...roleForm, resources: e.target.value })} placeholder={"LeetCode|https://leetcode.com"} />
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn btn-outline" onClick={closeAcceptModal} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAcceptSave} disabled={saving}>
              {saving ? "Saving…" : "Create Role & Notify Student"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
