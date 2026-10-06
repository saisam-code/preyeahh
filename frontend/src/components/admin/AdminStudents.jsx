import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaUser, FaMagnifyingGlass, FaEnvelope, FaCodeBranch, FaComments, FaMap, FaEye, FaCheck, FaXmark } from "react-icons/fa6";
import { fetchAllStudents, fetchOverviewStats } from "../../services/adminService.js";

const BRANCH_OPTIONS = ["all", "CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "AIML", "CSD", "CSBS"];

export default function AdminStudents({ onViewChats, onViewRoadmaps }) {
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [branch, setBranch] = useState("all");
  const [verified, setVerified] = useState("all");
  const [page, setPage] = useState(1);

  // selected student detail modal
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (branch !== "all") params.branch = branch;
      if (verified !== "all") params.verified = verified;

      const res = await fetchAllStudents(params);
      setStudents(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [page, search, branch, verified]);

  useEffect(() => {
    fetchOverviewStats()
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

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
    <div>
      {/* Overview stat cards */}
      {stats && (
        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              <FaUser />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalStudents}</span>
              <span className="stat-label">Total Students</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
              <FaCheck />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.verifiedStudents}</span>
              <span className="stat-label">Verified</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
              <FaXmark />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.unverifiedStudents}</span>
              <span className="stat-label">Unverified</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}>
              <FaComments />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalChats}</span>
              <span className="stat-label">Total Chats</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#ec4899,#db2777)" }}>
              <FaMap />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalRoadmaps}</span>
              <span className="stat-label">AI Roadmaps</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#14b8a6,#0d9488)" }}>
              <FaEnvelope />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalMessages}</span>
              <span className="stat-label">AI Messages</span>
            </div>
          </div>
        </div>
      )}

      <div className="admin-header" style={{ marginTop: "1.5rem" }}>
        <h2>All Students</h2>
        <span className="label-hint">{meta.total} student{meta.total !== 1 ? "s" : ""} total</span>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <form onSubmit={handleSearch} className="search-row">
          <div className="search-input-wrap">
            <FaMagnifyingGlass className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button type="button" className="search-clear" onClick={clearSearch}>
                <FaXmark />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>

        <div className="filter-row">
          <select className="filter-select" value={branch} onChange={(e) => { setBranch(e.target.value); setPage(1); }}>
            {BRANCH_OPTIONS.map((b) => (
              <option key={b} value={b}>{b === "all" ? "All Branches" : b}</option>
            ))}
          </select>
          <select className="filter-select" value={verified} onChange={(e) => { setVerified(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="empty"><div className="icon"><i className="fa fa-spinner fa-spin" /></div><p>Loading students…</p></div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Profile</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div className="student-avatar">{(s.name || "?")[0].toUpperCase()}</div>
                    <span>{s.name}</span>
                  </div>
                </td>
                <td style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{s.email}</td>
                <td>
                  {s.branch
                    ? <span className="branch-tag">{s.branch}</span>
                    : <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>—</span>}
                </td>
                <td>
                  <span className={`type-badge ${s.isVerified ? "badge-core" : "badge-non-core"}`}>
                    {s.isVerified ? "✓ Verified" : "Unverified"}
                  </span>
                </td>
                <td style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                  {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  {s.preferences?.onboardingCompleted ? (
                    <span style={{ color: "#10b981" }}>Complete</span>
                  ) : s.preferences?.onboardingSkipped ? (
                    <span style={{ color: "#f59e0b" }}>Skipped</span>
                  ) : (
                    <span>Pending</span>
                  )}
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="btn btn-outline btn-sm"
                      title="View profile"
                      onClick={() => setSelected(s)}
                    >
                      <FaEye /> Profile
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      title="View chats"
                      onClick={() => onViewChats(s)}
                    >
                      <FaComments /> Chats
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      title="View roadmaps"
                      onClick={() => onViewRoadmaps(s)}
                    >
                      <FaMap /> Roadmaps
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!students.length && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="pagination-row">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </button>
          <span className="pagination-info">Page {meta.page} of {meta.totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}

      {/* Profile Detail Modal */}
      {selected && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2>Student Profile</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="student-profile-detail">
              <div className="spd-avatar">{(selected.name || "?")[0].toUpperCase()}</div>
              <h3>{selected.name}</h3>
              <p className="spd-email">{selected.email}</p>
              <div className="spd-badges">
                {selected.branch && <span className="branch-tag">{selected.branch}</span>}
                <span className={`type-badge ${selected.isVerified ? "badge-core" : "badge-non-core"}`}>
                  {selected.isVerified ? "✓ Verified" : "Unverified"}
                </span>
                {selected.googleId && <span className="type-badge" style={{ background: "#4285f4", color: "#fff" }}>Google</span>}
              </div>

              <div className="spd-section">
                <div className="spd-section-title">Learning Preferences</div>
                <div className="spd-grid">
                  <div className="spd-item"><span>Role</span><strong>{selected.preferences?.currentRole || "—"}</strong></div>
                  <div className="spd-item"><span>Target Role</span><strong>{selected.preferences?.targetRole || "—"}</strong></div>
                  <div className="spd-item"><span>Experience</span><strong>{selected.preferences?.experienceLevel || "—"}</strong></div>
                  <div className="spd-item"><span>Learning Style</span><strong>{selected.preferences?.learningStyle || "—"}</strong></div>
                  <div className="spd-item"><span>Weekly Hours</span><strong>{selected.preferences?.weeklyHoursAvailable ?? "—"}</strong></div>
                  <div className="spd-item"><span>Language</span><strong>{selected.preferences?.preferredLanguage || "—"}</strong></div>
                </div>
              </div>

              {selected.preferences?.skills?.length > 0 && (
                <div className="spd-section">
                  <div className="spd-section-title">Skills</div>
                  <div className="spd-tags">
                    {selected.preferences.skills.map((sk, i) => (
                      <span key={i} className="skill-tag">
                        {sk.name} <em>({sk.level})</em>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selected.preferences?.goals?.length > 0 && (
                <div className="spd-section">
                  <div className="spd-section-title">Goals</div>
                  <ul className="spd-list">
                    {selected.preferences.goals.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
              )}

              {selected.preferences?.interests?.length > 0 && (
                <div className="spd-section">
                  <div className="spd-section-title">Interests</div>
                  <div className="spd-tags">
                    {selected.preferences.interests.map((itm, i) => (
                      <span key={i} className="skill-tag">{itm}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.preferences?.aiProfileSummary && (
                <div className="spd-section">
                  <div className="spd-section-title">AI Profile Summary</div>
                  <p className="spd-summary">{selected.preferences.aiProfileSummary}</p>
                </div>
              )}

              <div className="spd-section">
                <div className="spd-section-title">Account Info</div>
                <div className="spd-grid">
                  <div className="spd-item"><span>Joined</span><strong>{new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong></div>
                  <div className="spd-item"><span>Onboarding</span><strong>{selected.preferences?.onboardingCompleted ? "Complete" : selected.preferences?.onboardingSkipped ? "Skipped" : "Pending"}</strong></div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
                <button className="btn btn-primary" onClick={() => { onViewChats(selected); setSelected(null); }}>
                  <FaComments /> View Chats
                </button>
                <button className="btn btn-primary" onClick={() => { onViewRoadmaps(selected); setSelected(null); }}>
                  <FaMap /> View Roadmaps
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
