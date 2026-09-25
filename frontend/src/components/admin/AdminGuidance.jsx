import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchGuidance, createGuidance, updateGuidance, deleteGuidance } from "../../services/guidanceService";
import { fetchBranches } from "../../services/branchService";
import { fetchRoles } from "../../services/rolesService";

const emptyForm = { title: "", branch: "All", role: "", points: "" };

function linesToArray(str) {
  return str.split("\n").map((s) => s.trim()).filter(Boolean);
}

export default function AdminGuidance() {
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [entries, setEntries] = useState([]);
  const [rolesByBranch, setRolesByBranch] = useState([]);
  const [rolesForFilter, setRolesForFilter] = useState({}); // id -> title, for the table
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (branchFilter !== "all") params.branch = branchFilter;
      const list = await fetchGuidance(params);
      setEntries(list);

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
  };

  useEffect(() => { fetchBranches().then(setBranches); }, []);
  useEffect(() => { load(); }, [branchFilter]);

  const loadRolesForBranch = async (branch) => {
    if (branch === "All") return setRolesByBranch([]);
    const res = await fetchRoles({ branch, limit: 100 });
    setRolesByBranch(res.data);
  };

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setRolesByBranch([]); setModalOpen(true); };
  const openEdit = async (g) => {
    setEditingId(g._id);
    setForm({ title: g.title, branch: g.branch, role: g.role || "", points: g.points.join("\n") });
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

    const payload = { title: form.title.trim(), branch: form.branch, points, role: form.role || null };
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
        <h2>Manage Guidance</h2><div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <select className="filter-select" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
            <option value="all">All Branches</option>
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
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
          <thead><tr><th>Title</th><th>Branch</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>
            {visibleEntries.map((g) => (
              <tr key={g._id}>
                <td>{g.title}</td>
                <td><span className="branch-tag">{g.branch === "All" ? "All Branches" : g.branch}</span></td>
                <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{g.role ? (rolesForFilter[g.role] || "—") : "All roles"}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(g)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!visibleEntries.length && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--muted)" }}>No entries found</td></tr>}
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
            <select value={form.branch} onChange={(e) => handleBranchChange(e.target.value)}>
              <option value="All">All Branches</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Specific Role <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional — leave blank for branch-wide)</span></label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="">All roles in this branch</option>
              {rolesByBranch.map((r) => <option key={r._id} value={r._id}>{r.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Bullet Points <span style={{ fontWeight: 400, color: "var(--muted)" }}>(one per line)</span></label>
            <textarea style={{ minHeight: 110 }} value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} placeholder={"Learn C/C++\nBuild a GitHub profile\nJoin the coding club"} />
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
