import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchManagedRoles, fetchRoles, createRole, updateRole, deleteRole } from "../../services/rolesService.js";
import { fetchBranches } from "../../services/branchService.js";
import { fetchGuidance, createGuidance, updateGuidance, deleteGuidance } from "../../services/guidanceService.js";
import { fetchAllInstitutions } from "../../services/adminService.js";
import { fetchCareerDomains } from "../../services/careerDomainService.js";
import { fetchCareerSubdomains } from "../../services/careerSubdomainService.js";
import { CAREER_DOMAINS } from "../../data/careerWheelData.js";
import ContributorLabel from "../ContributorLabel.jsx";

const emptyRole = {
  title: "", branch: "", type: "core", domain: CAREER_DOMAINS[0].title, institutionId: "", description: "",
  subdomainId: "", overview: "", steps: "", skills: "", resources: "",
};

function linesToArray(str) {
  return str.split("\n").map((s) => s.trim()).filter(Boolean);
}

export default function AdminRoles({ fixedBranch = null, currentUserId = null, institutionMode = false } = {}) {
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState(fixedBranch || "all");
  const [roles, setRoles] = useState([]);
  const [careerDomains, setCareerDomains] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [scopeFilter, setScopeFilter] = useState("platform");
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyRole);
  const [roadmap, setRoadmap] = useState([]); // [{ id: mongoId|null, title, points }]
  const selectedDomainId = careerDomains.find((domain) => domain.name === form.domain)?._id || "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (branchFilter !== "all") params.branch = branchFilter;
      if (!fixedBranch) params.institutionId = scopeFilter;
      const res = fixedBranch ? await fetchRoles(params) : await fetchManagedRoles(params);
      setRoles(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, [branchFilter, fixedBranch, scopeFilter]);

  useEffect(() => {
    if (institutionMode || fixedBranch) return;
    fetchBranches()
      .then(setBranches)
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load branches"));
  }, [fixedBranch, institutionMode]);
  useEffect(() => {
    fetchCareerDomains()
      .then(setCareerDomains)
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load career domains"));
  }, []);
  useEffect(() => {
    if (!modalOpen || !selectedDomainId || !form.branch) {
      setSubdomains([]);
      return undefined;
    }

    let active = true;
    fetchCareerSubdomains({ domainId: selectedDomainId, branchName: form.branch })
      .then((list) => {
        if (!active) return;
        setSubdomains(list);
        setForm((current) => (
          current.subdomainId && !list.some((item) => item._id === current.subdomainId)
            ? { ...current, subdomainId: "" }
            : current
        ));
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || "Failed to load subdomains");
      });

    return () => { active = false; };
  }, [modalOpen, selectedDomainId, form.branch]);
  useEffect(() => {
    if (institutionMode) return;
    fetchAllInstitutions()
      .then((response) => setInstitutions(response.data || []))
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load institutions"));
  }, [institutionMode]);
  useEffect(() => { if (fixedBranch) setBranchFilter(fixedBranch); }, [fixedBranch]);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyRole,
      branch: fixedBranch || branches[0] || "",
      institutionId: scopeFilter === "all" || scopeFilter === "platform" ? "" : scopeFilter,
    });
    setRoadmap([]);
    setModalOpen(true);
  };

  const openEdit = async (role) => {
    setEditingId(role._id);
    setForm({
      title: role.title,
      branch: role.branch,
      type: role.type,
      domain: CAREER_DOMAINS.some((domain) => domain.title === role.domain)
        ? role.domain
        : CAREER_DOMAINS[0].title,
      subdomainId: role.subdomainId || "",
      institutionId: role.institution || "",
      description: role.description || "",
      overview: role.guidance?.overview || "",
      steps: (role.guidance?.steps || []).join("\n"),
      skills: (role.guidance?.skills || []).join("\n"),
      resources: (role.guidance?.resources || []).join("\n"),
    });
    if (!institutionMode) {
      try {
        const entries = await fetchGuidance({ role: role._id });
        setRoadmap(entries.map((g) => ({ id: g._id, title: g.title, points: g.points.join("\n") })));
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load role roadmap");
        return;
      }
    } else {
      setRoadmap([]);
    }
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const addRoadmapEntry = () => setRoadmap((r) => [...r, { id: null, title: "", points: "" }]);
  const removeRoadmapEntry = (i) => setRoadmap((r) => r.filter((_, idx) => idx !== i));
  const updateRoadmapEntry = (i, field, value) =>
    setRoadmap((r) => r.map((entry, idx) => (idx === i ? { ...entry, [field]: value } : entry)));

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.branch.trim()) return toast.error("Department or branch is required");
    const payload = {
      title: form.title.trim(),
      branch: form.branch,
      type: form.type,
      domain: form.domain,
      subdomainId: form.subdomainId || null,
      description: form.description.trim(),
    };
    if (!institutionMode) {
      payload.institutionId = form.institutionId;
      payload.guidance = {
        overview: form.overview.trim(),
        steps: linesToArray(form.steps),
        skills: linesToArray(form.skills),
        resources: linesToArray(form.resources),
      };
    }

    setSaving(true);
    try {
      const res = editingId ? await updateRole(editingId, payload) : await createRole(payload);
      const savedId = res.data._id;

      const keptIds = new Set();
      for (const entry of institutionMode ? [] : roadmap) {
        const title = entry.title.trim();
        const points = linesToArray(entry.points);
        if (!title || !points.length) continue;
        const saved = entry.id
          ? await updateGuidance(entry.id, { title, points })
          : await createGuidance({ title, points, branch: form.branch, role: savedId });
        keptIds.add((entry.id || saved._id).toString());
      }

      if (editingId && !institutionMode) {
        const existing = await fetchGuidance({ role: savedId });
        for (const g of existing) {
          if (!keptIds.has(g._id.toString())) await deleteGuidance(g._id);
        }
      }

      toast.success(editingId ? "Role updated" : "Role created");
      closeModal();
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving role");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this role?")) return;
    try {
      await deleteRole(id);
      toast.success("Role deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting role");
    }
  };

  const visibleRoles = roles.filter((role) => {
    const matchesDomain = domainFilter === "all" || role.domain === domainFilter;
    const matchesSearch = !search.trim() || `${role.title} ${role.branch} ${role.description}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesDomain && matchesSearch;
  });

  return (
    <div>
      <div className="admin-header">
        <div>
          <h2>{institutionMode ? "Career Roles & Pathways" : "Manage Roles"}</h2>
          {institutionMode && <p className="label-hint">Create and maintain career roles for your institution across the 12 career domains.</p>}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {!institutionMode && (
            <select className="filter-select" value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)}>
              <option value="all">All roles</option>
              <option value="platform">Platform roles</option>
              {institutions.map((institution) => <option key={institution._id} value={institution._id}>{institution.name}</option>)}
            </select>
          )}
          {!fixedBranch && (
            <select className="filter-select" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="all">All Branches</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
          <button className="btn btn-primary" onClick={openAdd}>+ Add Role</button>
        </div>
      </div>

      <div className="admin-toolbar-card" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          className="filter-select"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search role, branch, or description"
          aria-label="Search roles"
        />
        <select className="filter-select" value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)} aria-label="Filter by career domain">
          <option value="all">All career domains</option>
          {CAREER_DOMAINS.map((domain) => <option key={domain.id} value={domain.title}>{domain.title}</option>)}
        </select>
        <span className="label-hint" style={{ alignSelf: "center" }}>{visibleRoles.length} role{visibleRoles.length === 1 ? "" : "s"}</span>
      </div>

      {loading ? (
        <div className="empty"><div className="icon"><i className="fa fa-spinner fa-spin" /></div><p>Loading...</p></div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Career domain</th><th>Branch</th>{!institutionMode && <th>Institution</th>}<th>Type</th><th>Contributor</th><th>Actions</th></tr></thead>
          <tbody>
            {visibleRoles.map((r) => (
              <tr key={r._id}>
                <td>{r.title}</td>
                <td>{r.domain || "—"}</td>
                <td><span className="branch-tag">{r.branch}</span></td>
                {!institutionMode && <td>{institutions.find((institution) => institution._id === r.institution)?.name || (r.institution ? "Institution" : "Platform")}</td>}
                <td><span className={`type-badge badge-${r.type}`}>{r.type === "core" ? "Core" : "Non-Core"}</span></td>
                <td><ContributorLabel item={r} /></td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-outline btn-sm" disabled={Boolean(fixedBranch && String(r.createdBy?.userId || "") !== currentUserId)} title={fixedBranch && String(r.createdBy?.userId || "") !== currentUserId ? "Ask the original contributor or an admin" : "Edit"} onClick={() => openEdit(r)}>Edit</button>
                    <button className="btn btn-danger btn-sm" disabled={Boolean(fixedBranch && String(r.createdBy?.userId || "") !== currentUserId)} title={fixedBranch && String(r.createdBy?.userId || "") !== currentUserId ? "Ask the original contributor or an admin" : "Delete"} onClick={() => handleDelete(r._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!visibleRoles.length && <tr><td colSpan={institutionMode ? 6 : 7} style={{ textAlign: "center", color: "var(--muted)" }}>No roles found</td></tr>}
          </tbody>
        </table>
      )}

      <div className={`modal-overlay ${modalOpen ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && closeModal()}>
        <div className="modal" style={{ maxWidth: 600 }}>
          <div className="modal-header">
            <h2>{editingId ? "Edit Role" : "Add Role"}</h2>
            <button className="modal-close" onClick={closeModal}>×</button>
          </div>

          <div className="role-form-section">
            <div className="role-form-section-title">Basic Info</div>
            <div className="form-group">
              <label>Role Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Software Engineer" />
            </div>
            <div className="form-group">
              <label>Career Domain</label>
              <select className="filter-select" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value, subdomainId: "" })}>
                {CAREER_DOMAINS.map((domain) => <option key={domain.id} value={domain.title}>{domain.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Subdomain (optional)</label>
              <select
                className="filter-select"
                value={form.subdomainId}
                onChange={(event) => setForm({ ...form, subdomainId: event.target.value })}
                disabled={!subdomains.length}
              >
                <option value="">No subdomain</option>
                {subdomains.map((subdomain) => (
                  <option key={subdomain._id} value={subdomain._id}>{subdomain.name}</option>
                ))}
              </select>
              {!subdomains.length && (
                <span className="label-hint">Add a subdomain for this domain and branch in Manage Subdomains.</span>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{institutionMode ? "Department / Branch" : "Branch"}</label>
                {institutionMode ? (
                  <input type="text" maxLength={20} value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="e.g. CSE" />
                ) : (
                  <select
                    className="filter-select"
                    value={fixedBranch || form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    disabled={Boolean(fixedBranch)}
                  >
                    {(fixedBranch ? [fixedBranch] : branches).map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label>Type</label>
                <select className="filter-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="core">Core</option>
                  <option value="non-core">Non-Core</option>
                </select>
              </div>
            </div>
            {!institutionMode && (
              <div className="form-group">
                <label>Owned by</label>
                <select className="filter-select" value={form.institutionId} onChange={(e) => setForm({ ...form, institutionId: e.target.value })}>
                  <option value="">Platform</option>
                  {institutions.map((institution) => <option key={institution._id} value={institution._id}>{institution.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Description</label>
              <textarea style={{ minHeight: 60 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the role" />
            </div>
          </div>

          {!institutionMode && <div className="role-form-section">
            <div className="role-form-section-title">Guidance</div>
            <div className="form-group">
              <label>Overview</label>
              <textarea style={{ minHeight: 60 }} value={form.overview} onChange={(e) => setForm({ ...form, overview: e.target.value })} placeholder="Short summary shown on the role card" />
            </div>
            <div className="form-group">
              <label>Steps to Get There <span className="label-hint">(one per line)</span></label>
              <textarea style={{ minHeight: 90 }} value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} placeholder={"Master DSA\nBuild projects\nTarget internships"} />
            </div>
            <div className="form-group">
              <label>Key Skills <span className="label-hint">(one per line)</span></label>
              <textarea value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder={"Python\nMachine Learning\nSQL"} />
            </div>
            <div className="form-group">
              <label>Resources <span className="label-hint">(one per line — <code>Label|https://url</code> for links)</span></label>
              <textarea value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} placeholder={"LeetCode|https://leetcode.com"} />
            </div>
          </div>}

          {!institutionMode && <div className="role-form-section">
            <div className="role-form-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Roadmap</span>
              <button className="btn btn-primary btn-sm" type="button" onClick={addRoadmapEntry}>+ Add Step</button>
            </div>
            <p className="label-hint" style={{ marginBottom: "0.75rem" }}>Year-by-year or milestone roadmap specific to this role.</p>
            {roadmap.map((entry, i) => (
              <div className="roadmap-entry" key={i}>
                <div className="roadmap-entry-topbar">
                  <div className="roadmap-entry-num">{i + 1}</div>
                  <div className="roadmap-entry-header">
                    <input
                      className="re-title" type="text"
                      value={entry.title}
                      onChange={(e) => updateRoadmapEntry(i, "title", e.target.value)}
                      placeholder="e.g. Year 1 — Explore foundations"
                    />
                  </div>
                  <button type="button" className="roadmap-entry-remove" onClick={() => removeRoadmapEntry(i)}>×</button>
                </div>
                <div className="roadmap-entry-body">
                  <div className="roadmap-entry-body-label">Bullet Points (one per line)</div>
                  <textarea
                    className="re-points"
                    value={entry.points}
                    onChange={(e) => updateRoadmapEntry(i, "points", e.target.value)}
                    placeholder={"Learn C/C++ and basic data structures\nStart competitive programming"}
                  />
                </div>
              </div>
            ))}
          </div>}

          <div className="modal-actions">
            <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Role"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
