import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchRoles, createRole, updateRole, deleteRole } from "../../services/rolesService";
import { fetchBranches } from "../../services/branchService";
import { fetchGuidance, createGuidance, updateGuidance, deleteGuidance } from "../../services/guidanceService";

const emptyRole = {
  title: "", branch: "", type: "core", description: "",
  overview: "", steps: "", skills: "", resources: "",
};

function linesToArray(str) {
  return str.split("\n").map((s) => s.trim()).filter(Boolean);
}

export default function AdminRoles() {
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState("all");
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyRole);
  const [roadmap, setRoadmap] = useState([]); // [{ id: mongoId|null, title, points }]

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (branchFilter !== "all") params.branch = branchFilter;
      const res = await fetchRoles(params);
      setRoles(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBranches().then(setBranches); }, []);
  useEffect(() => { load(); }, [branchFilter]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyRole, branch: branches[0] || "" });
    setRoadmap([]);
    setModalOpen(true);
  };

  const openEdit = async (role) => {
    setEditingId(role._id);
    setForm({
      title: role.title,
      branch: role.branch,
      type: role.type,
      description: role.description || "",
      overview: role.guidance?.overview || "",
      steps: (role.guidance?.steps || []).join("\n"),
      skills: (role.guidance?.skills || []).join("\n"),
      resources: (role.guidance?.resources || []).join("\n"),
    });
    const entries = await fetchGuidance({ role: role._id });
    setRoadmap(entries.map((g) => ({ id: g._id, title: g.title, points: g.points.join("\n") })));
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const addRoadmapEntry = () => setRoadmap((r) => [...r, { id: null, title: "", points: "" }]);
  const removeRoadmapEntry = (i) => setRoadmap((r) => r.filter((_, idx) => idx !== i));
  const updateRoadmapEntry = (i, field, value) =>
    setRoadmap((r) => r.map((entry, idx) => (idx === i ? { ...entry, [field]: value } : entry)));

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    const payload = {
      title: form.title.trim(),
      branch: form.branch,
      type: form.type,
      description: form.description.trim(),
      guidance: {
        overview: form.overview.trim(),
        steps: linesToArray(form.steps),
        skills: linesToArray(form.skills),
        resources: linesToArray(form.resources),
      },
    };

    try {
      const res = editingId ? await updateRole(editingId, payload) : await createRole(payload);
      const savedId = res.data._id;

      const keptIds = new Set();
      for (const entry of roadmap) {
        const title = entry.title.trim();
        const points = linesToArray(entry.points);
        if (!title || !points.length) continue;
        const saved = entry.id
          ? await updateGuidance(entry.id, { title, points })
          : await createGuidance({ title, points, branch: form.branch, role: savedId });
        keptIds.add((entry.id || saved._id).toString());
      }

      if (editingId) {
        const existing = await fetchGuidance({ role: savedId });
        for (const g of existing) {
          if (!keptIds.has(g._id.toString())) await deleteGuidance(g._id);
        }
      }

      toast.success(editingId ? "Role updated" : "Role created");
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving role");
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

  return (
    <div>
      <div className="admin-header">
        <h2>Manage Roles</h2>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <select className="filter-select" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
            <option value="all">All Branches</option>
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Role</button>
        </div>
      </div>

      {loading ? (
        <div className="empty"><div className="icon"><i className="fa fa-spinner fa-spin" /></div><p>Loading...</p></div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Branch</th><th>Type</th><th>Actions</th></tr></thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r._id}>
                <td>{r.title}</td>
                <td><span className="branch-tag">{r.branch}</span></td>
                <td><span className={`type-badge badge-${r.type}`}>{r.type === "core" ? "Core" : "Non-Core"}</span></td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!roles.length && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--muted)" }}>No roles found</td></tr>}
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
            <div className="form-row">
              <div className="form-group">
                <label>Branch</label>
                <select className="filter-select" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                  {branches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select className="filter-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="core">Core</option>
                  <option value="non-core">Non-Core</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea style={{ minHeight: 60 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the role" />
            </div>
          </div>

          <div className="role-form-section">
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
          </div>

          <div className="role-form-section">
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
          </div>

          <div className="modal-actions">
            <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save Role</button>
          </div>
        </div>
      </div>
    </div>
  );
}
