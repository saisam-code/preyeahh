import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaXmark, FaFire, FaEye, FaPaperPlane, FaHandPointer } from "react-icons/fa6";

import { useBranch } from "../context/BranchContext";
import { useAuth } from "../context/AuthContext";
import { fetchRoles } from "../services/rolesService";
import { fetchGuidanceForRole } from "../services/guidanceService";
import { getInterestForRole, recordInterest } from "../services/studentService";
import { submitRoleRequest } from "../services/roleRequestService";
import BranchGate from "../components/BranchGate";
import LoginModal from "../components/LoginModal";

function parseResource(str) {
  const [label, url] = str.split("|").map((s) => s?.trim());
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="resource-link">
        {label} ↗
      </a>
    );
  }
  return str;
}

export default function Roles() {
  const { branch } = useBranch();
  const { user } = useAuth();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedRole, setSelectedRole] = useState(null);
  const [roadmap, setRoadmap] = useState(null);

  const [commitRole, setCommitRole] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingCommit, setPendingCommit] = useState(null);

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ roleName: "", branch: branch || "", summary: "" });
  const [requestErr, setRequestErr] = useState("");
  const [requestOk, setRequestOk] = useState(false);

  useEffect(() => {
    if (!branch) return;
    setLoading(true);
    fetchRoles({ branch, limit: 100 })
      .then((res) => setRoles(res.data))
      .finally(() => setLoading(false));
  }, [branch]);

  useEffect(() => {
    if (user && user.role === "student" && pendingCommit) {
      doRecordInterest(pendingCommit.role, pendingCommit.committed);
      setPendingCommit(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredRoles = useMemo(() => {
    let list = roles;
    if (typeFilter !== "all") list = list.filter((r) => r.type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [roles, typeFilter, search]);

  const openDetail = async (role) => {
    setSelectedRole(role);
    setRoadmap(null);
    try {
      const data = await fetchGuidanceForRole(role._id);
      setRoadmap(data);
    } catch {
      setRoadmap({ roleRoadmap: [], branchRoadmap: [] });
    }
  };

  const handleCardClick = (role) => {
    if (user && (user.role === "guide" || user.role === "admin")) {
      openDetail(role);
      return;
    }
    setCommitRole(role);
  };

  const doRecordInterest = async (role, committed) => {
    if (user.branch && role.branch !== user.branch) {
      toast(`${role.title} is a ${role.branch} role — only ${user.branch} roles count toward your profile`);
    } else {
      try {
        const existing = await getInterestForRole(role._id);
        if (existing) {
          const prev = existing.committed ? "Committed" : "Exploring";
          const curr = committed ? "Committed" : "Exploring";
          if (!window.confirm(`You already marked this role as "${prev}". Update it to "${curr}"?`)) {
            openDetail(role);
            return;
          }
        }
        await recordInterest(role._id, committed);
        toast.success("Saved");
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not record interest");
      }
    }
    openDetail(role);
  };

  const handleCommitChoice = (committed) => {
    const role = commitRole;
    setCommitRole(null);
    if (!user || user.role !== "student") {
      setPendingCommit({ role, committed });
      setLoginOpen(true);
      return;
    }
    doRecordInterest(role, committed);
  };

  const submitRequest = async () => {
    if (!requestForm.roleName.trim() || !requestForm.summary.trim()) {
      setRequestErr("Please fill in both fields.");
      return;
    }
    setRequestErr("");
    try {
      await submitRoleRequest(requestForm);
      setRequestOk(true);
      setTimeout(() => {
        setRequestOpen(false);
        setRequestOk(false);
        setRequestForm({ roleName: "", branch: branch || "", summary: "" });
      }, 1500);
    } catch (err) {
      setRequestErr(err.response?.data?.message || "Could not submit request.");
    }
  };

  if (!branch) return <BranchGate label="roles" />;

  return (
    <div>
      <div className="page-hero">
        <h1>{branch} <span>Roles</span></h1>
        <p>Career roles for {branch} — tap any card for full guidance &amp; resources</p>
      </div>

      <div className="section">
        <div className="filter-row">
          <div className="type-tabs">
            {["all", "core", "non-core"].map((t) => (
              <div key={t} className={`tab ${typeFilter === t ? "active" : ""}`} onClick={() => setTypeFilter(t)}>
                {t === "all" ? "All" : t === "core" ? "Core" : "Non-Core"}
              </div>
            ))}
          </div>
          <div className="search-wrap">
            <input
              className="search-input"
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty"><div className="icon"><i className="fa fa-spinner fa-spin" /></div><p>Loading...</p></div>
        ) : filteredRoles.length === 0 ? (
          <div className="empty"><div className="icon"><i className="fa fa-search" /></div><p>No roles found</p></div>
        ) : (
          <div className="roles-grid">
            {filteredRoles.map((r) => {
              const crossBranch = user?.role === "student" && user.branch && r.branch !== user.branch;
              return (
                <div key={r._id} className={`role-card ${crossBranch ? "role-card-cross" : ""}`} onClick={() => handleCardClick(r)}>
                  <div className="role-card-top">
                    <span className={`type-badge badge-${r.type}`}>{r.type === "core" ? "Core" : "Non-Core"}</span>
                    {crossBranch && <span className="cross-branch-badge">Outside your branch</span>}
                  </div>
                  <div className="role-card-body">
                    <h3>{r.title}</h3>
                    <p>{r.description}</p>
                    <div className="role-summary">
                      <strong>Overview:</strong> {r.guidance?.overview || "Tap to view full guidance."}
                    </div>
                    <div className="role-card-footer">
                      <span className="tap-hint"><FaHandPointer /> Tap for full guidance &amp; resources</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="request-role-banner">
          <div className="request-role-banner-text">
            <i className="fa fa-lightbulb" />
            <span>Can't find a desired role? <strong>Ask here</strong> and we'll consider adding it.</span>
          </div>
          <button className="btn btn-accent" onClick={() => { setRequestForm({ roleName: "", branch: branch || "", summary: "" }); setRequestOpen(true); }}>
            <FaPaperPlane /> Request a Role
          </button>
        </div>
      </div>

      {/* COMMIT PROMPT */}
      <div className={`modal-overlay ${commitRole ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && setCommitRole(null)}>
        <div className="modal" style={{ maxWidth: 400, textAlign: "center" }}>
          <div style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}><i className="fa fa-crosshairs" /></div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Quick check-in</h2>
          <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1rem" }}>
            Are you seriously considering <strong>{commitRole?.title}</strong> as a long-term career, or just exploring?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <button className="btn btn-primary" style={{ width: "100%", padding: "0.7rem" }} onClick={() => handleCommitChoice(true)}>
              <FaFire /> I'm committed — this is my goal
            </button>
            <button className="btn" style={{ width: "100%", padding: "0.7rem", background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--text)" }} onClick={() => handleCommitChoice(false)}>
              <FaEye /> Just exploring for now
            </button>
          </div>
        </div>
      </div>

      {/* ROLE DETAIL */}
      <div className={`modal-overlay ${selectedRole ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && setSelectedRole(null)}>
        {selectedRole && (
          <div className="modal modal-detail">
            <div className="modal-header">
              <h2>{selectedRole.title}</h2>
              <button className="modal-close" onClick={() => setSelectedRole(null)}><FaXmark /></button>
            </div>

            <div className="rd-meta">
              <span className="branch-tag">{selectedRole.branch}</span>
              <span className={`type-badge badge-${selectedRole.type}`}>{selectedRole.type === "core" ? "Core" : "Non-Core"}</span>
              <p className="rd-desc">{selectedRole.description}</p>
            </div>

            {selectedRole.guidance?.overview && (
              <div className="rd-block rd-block--overview">
                <div className="rd-block-header"><i className="fa fa-lightbulb" /><span>Overview</span></div>
                <p className="rd-block-body">{selectedRole.guidance.overview}</p>
              </div>
            )}

            {selectedRole.guidance?.steps?.length > 0 && (
              <div className="rd-block rd-block--steps">
                <div className="rd-block-header"><i className="fa fa-map" /><span>How to Get There</span></div>
                <ol className="rd-steps-list">
                  {selectedRole.guidance.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            )}

            {selectedRole.guidance?.skills?.length > 0 && (
              <div className="rd-block rd-block--skills">
                <div className="rd-block-header"><i className="fa fa-wrench" /><span>Key Skills</span></div>
                <div className="rd-tags">
                  {selectedRole.guidance.skills.map((s, i) => <span key={i} className="rd-tag">{s}</span>)}
                </div>
              </div>
            )}

            {selectedRole.guidance?.resources?.length > 0 && (
              <div className="rd-block rd-block--resources">
                <div className="rd-block-header"><i className="fa fa-book-open" /><span>Resources</span></div>
                <ul className="rd-resource-list">
                  {selectedRole.guidance.resources.map((s, i) => <li key={i}>{parseResource(s)}</li>)}
                </ul>
              </div>
            )}

            {roadmap && (roadmap.roleRoadmap.length > 0 || roadmap.branchRoadmap.length > 0) && (
              <div className="rd-block rd-block--roadmap">
                <div className="rd-block-header">
                  <i className="fa fa-calendar-days" />
                  <span>{roadmap.roleRoadmap.length ? `Roadmap for ${selectedRole.title}` : `${selectedRole.branch} Branch Roadmap`}</span>
                </div>
                <p className="rd-roadmap-note">
                  {roadmap.roleRoadmap.length ? "Personalised roadmap for this role." : `This roadmap applies to all roles in the ${selectedRole.branch} branch.`}
                </p>
                <div className="rd-roadmap-grid">
                  {[...roadmap.roleRoadmap, ...roadmap.branchRoadmap].map((g) => (
                    <div className="rd-roadmap-item" key={g._id}>
                      <div className="rd-roadmap-item-title">{g.title}</div>
                      <ul>{g.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* REQUEST ROLE */}
      <div className={`modal-overlay ${requestOpen ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && setRequestOpen(false)}>
        <div className="modal" style={{ maxWidth: 480 }}>
          <div className="modal-header">
            <div>
              <h2>Request a Role</h2>
              <p className="modal-sub">Tell us what role you'd like to see added.</p>
            </div>
            <button className="modal-close" onClick={() => setRequestOpen(false)}><FaXmark /></button>
          </div>
          <div className="form-group">
            <label>Role Name</label>
            <input value={requestForm.roleName} onChange={(e) => setRequestForm({ ...requestForm, roleName: e.target.value })} placeholder="e.g. Cybersecurity Analyst" />
          </div>
          <div className="form-group">
            <label>Brief Summary</label>
            <textarea style={{ minHeight: 100 }} value={requestForm.summary} onChange={(e) => setRequestForm({ ...requestForm, summary: e.target.value })} placeholder="Describe what this role involves..." />
          </div>
          {requestErr && <p style={{ color: "var(--danger, #ef4444)", fontSize: "0.83rem", marginBottom: "0.5rem" }}>{requestErr}</p>}
          {requestOk && <p style={{ color: "#16a34a", fontSize: "0.83rem", marginBottom: "0.5rem" }}>Request submitted! Admin will review it.</p>}
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setRequestOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitRequest}><FaPaperPlane /> Submit Request</button>
          </div>
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}