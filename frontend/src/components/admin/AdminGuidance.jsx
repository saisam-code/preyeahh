import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchGuidance, createGuidance, updateGuidance, deleteGuidance } from "../../services/guidanceService.js";
import { fetchBranches } from "../../services/branchService.js";
import { fetchRoles } from "../../services/rolesService.js";
import ContributorLabel from "../ContributorLabel.jsx";

const emptyForm = { title: "", branch: "All", role: "", overview: "", durationWeeks: 4, points: "", resources: "" };

function linesToArray(str) {
  return str.split("\n").map((s) => s.trim()).filter(Boolean);
}

export default function AdminGuidance({ fixedBranch = null, currentUserId = null } = {}) {
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState(fixedBranch || "all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [entries, setEntries] = useState([]);
  const [rolesByBranch, setRolesByBranch] = useState([]);
  const [rolesForFilter, setRolesForFilter] = useState({}); // id -> title, for the table
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (branchFilter !== "all") params.branch = branchFilter;
      const list = await fetchGuidance(params);
      setEntries(fixedBranch ? list.filter((entry) => entry.branch === fixedBranch) : list);

      const roleIds = [...new Set(list.filter((g) => g.role).map((g) => g.role))];
      if (roleIds.length) {
        const allRoles = await fetchRoles({ limit: 200 });
        const map = {};
        allRoles.data.forEach((r) => { map[r._id] = r.title; });
        setRolesForFilter(map);
      }
    } finally {
      setLoading(false);
    }
  }, [branchFilter, fixedBranch]);

  useEffect(() => { fetchBranches().then(setBranches); }, []);
  useEffect(() => { if (fixedBranch) setBranchFilter(fixedBranch); }, [fixedBranch]);
  useEffect(() => { load(); }, [load]);

  const loadRolesForBranch = async (branch) => {
    if (branch === "All") return setRolesByBranch([]);
    const res = await fetchRoles({ branch, limit: 100 });
    setRolesByBranch(res.data);
  };

  const openAdd = () => { setEditingId(null); setForm({ ...emptyForm, branch: fixedBranch || emptyForm.branch }); setRolesByBranch([]); setModalOpen(true); };
  const openEdit = async (g) => {
    setEditingId(g._id);
    setForm({
      title: g.title,
      branch: g.branch,
      role: g.role || "",
      overview: g.overview || "",
      durationWeeks: g.durationWeeks || 4,
      points: g.points.join("\n"),
      resources: (g.resources || []).join("\n"),
    });
    await loadRolesForBranch(g.branch);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleBranchChange = (branch) => {
    setForm((f) => ({ ...f, branch, role: "" }));
    loadRolesForBranch(branch);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    const points = linesToArray(form.points);
    if (!points.length) return toast.error("Add at least one bullet point");

    const resources = linesToArray(form.resources);
    const payload = {
      title: form.title.trim(),
      branch: form.branch,
      role: form.role || null,
      overview: form.overview.trim(),
      durationWeeks: Number(form.durationWeeks),
      points,
      resources,
    };
    try {
      if (editingId) await updateGuidance(editingId, payload);
      else await createGuidance(payload);
      toast.success(editingId ? "Entry updated" : "Entry created");
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving entry");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this guidance entry?")) return;
    try {
      await deleteGuidance(id);
      toast.success("Entry deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting entry");
    }
  };
const visibleEntries = entries.filter((g) => {
    if (scopeFilter === "global") return !g.role;
    if (scopeFilter === "role") return !!g.role;
    return true;
  });
  return (
    <div>
      <div className="admin-header">
        <div>
          <h2>Manage Guidance</h2>
          {fixedBranch && <p className="label-hint">Choose an existing plan to edit, or create a new branch or role plan. Guidance plans cannot be deleted by guides.</p>}
        </div><div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {!fixedBranch && (
            <select className="filter-select" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="all">All Branches</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
          <select className="filter-select" value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)}>
            <option value="all">All Entries</option>
            <option value="global">Global (branch-wide) only</option>
            <option value="role">Role-specific only</option>
          </select>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Entry</button>
        </div>
      </div>

      {loading ? (
        <div className="empty"><div className="icon"><i className="fa fa-spinner fa-spin" /></div><p>Loading...</p></div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Branch</th><th>Role</th><th>Contributor</th><th>Actions</th></tr></thead>
          <tbody>
            {visibleEntries.map((g) => (
              <tr key={g._id}>
                <td>{g.title}</td>
                <td><span className="branch-tag">{g.branch === "All" ? "All Branches" : g.branch}</span></td>
                <td style={{ fontSize: "var(--font-size-sm)", color: "var(--muted)" }}>{g.role ? (rolesForFilter[g.role] || "—") : "All roles"}</td>
                <td><ContributorLabel item={g} /></td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-outline btn-sm" disabled={Boolean(fixedBranch && String(g.createdBy?.userId || "") !== currentUserId)} title={fixedBranch && String(g.createdBy?.userId || "") !== currentUserId ? "Ask the original contributor or an admin" : "Edit"} onClick={() => openEdit(g)}>Edit</button>
                    {!fixedBranch && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g._id)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
            {!visibleEntries.length && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)" }}>No entries found</td></tr>}
          </tbody>
        </table>
      )}

      <div className={`modal-overlay ${modalOpen ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && closeModal()}>
        <div className="modal">
          <h2>{editingId ? "Edit Guidance Entry" : "Add Guidance Entry"}</h2>
          <div className="form-group">
            <label>Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Year 1 — Explore" />
          </div>
          <div className="form-group">
            <label>Branch</label>
            <select value={fixedBranch || form.branch} onChange={(e) => handleBranchChange(e.target.value)} disabled={Boolean(fixedBranch)}>
              {(fixedBranch ? [fixedBranch] : ["All", ...branches]).map((b) => <option key={b} value={b}>{b === "All" ? "All Branches" : b}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Specific Role <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional — leave blank for branch-wide)</span></label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="">All roles in this branch</option>
              {rolesByBranch.map((r) => <option key={r._id} value={r._id}>{r.title}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Plan overview</label>
              <textarea
                style={{ minHeight: 75 }}
                maxLength={1500}
                value={form.overview}
                onChange={(e) => setForm({ ...form, overview: e.target.value })}
                placeholder="Describe the goal and expected outcome of this plan"
              />
            </div>
            <div className="form-group">
              <label>Duration (weeks)</label>
              <input
                type="number"
                min="1"
                max="52"
                value={form.durationWeeks}
                onChange={(e) => setForm({ ...form, durationWeeks: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Milestones <span style={{ fontWeight: 400, color: "var(--muted)" }}>(one per line, in order)</span></label>
            <textarea style={{ minHeight: 110 }} value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} placeholder={"Explore the field and prerequisites\nComplete a guided project\nReview progress with your guide"} />
          </div>
          <div className="form-group">
            <label>Recommended resources <span className="label-hint">(one per line)</span></label>
            <textarea style={{ minHeight: 75 }} value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} placeholder={"Official syllabus | https://example.gov"} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
