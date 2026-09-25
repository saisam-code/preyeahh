import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchBeyond, createBeyond, updateBeyond, deleteBeyond } from "../../services/beyondService";
import { fetchBranches } from "../../services/branchService";

const CATEGORIES = [
  { value: "college", label: "In College" },
  { value: "startup", label: "Startups" },
  { value: "gate", label: "GATE & Higher Studies" },
  { value: "national", label: "National" },
  { value: "international", label: "International" },
];

function linesToArray(str) {
  return str.split("\n").map((s) => s.trim()).filter(Boolean);
}

const emptyForm = { title: "", branch: "All", category: "college", description: "", howto: "", skills: "", resources: "" };

export default function AdminBeyond() {
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (branchFilter !== "all") params.branch = branchFilter;
      const res = await fetchBeyond(params);
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBranches().then(setBranches); }, []);
  useEffect(() => { load(); }, [branchFilter]);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title, branch: item.branch, category: item.category,
      description: item.description || "", howto: item.howto || "",
      skills: (item.skills || []).join("\n"), resources: (item.resources || []).join("\n"),
    });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    const payload = {
      title: form.title.trim(), branch: form.branch, category: form.category,
      description: form.description.trim(), howto: form.howto.trim(),
      skills: linesToArray(form.skills), resources: linesToArray(form.resources),
    };
    try {
      if (editingId) await updateBeyond(editingId, payload);
      else await createBeyond(payload);
      toast.success(editingId ? "Entry updated" : "Entry created");
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving entry");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this beyond entry?")) return;
    try {
      await deleteBeyond(id);
      toast.success("Entry deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting entry");
    }
  };

  const catLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label || v;

  return (
    <div>
      <div className="admin-header">
        <h2>Manage Beyond</h2>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
            <option value="all">All Branches</option>
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Entry</button>
        </div>
      </div>

      {loading ? (
        <div className="empty"><div className="icon"><i className="fa fa-spinner fa-spin" /></div><p>Loading...</p></div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Branch</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((l) => (
              <tr key={l._id}>
                <td>
                  <strong>{l.title}</strong>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.2rem" }}>{catLabel(l.category)}</div>
                </td>
                <td><span className="branch-tag">{l.branch === "All" ? "All Branches" : l.branch}</span></td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(l)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(l._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--muted)" }}>No entries found</td></tr>}
          </tbody>
        </table>
      )}

      <div className={`modal-overlay ${modalOpen ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && closeModal()}>
        <div className="modal" style={{ maxWidth: 600 }}>
          <div className="modal-header">
            <h2>{editingId ? "Edit Beyond Entry" : "Add Beyond Entry"}</h2>
            <button className="modal-close" onClick={closeModal}>×</button>
          </div>
          <div className="form-group">
            <label>Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Open Source Maintainer" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Branch</label>
              <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                <option value="All">All Branches</option>
                {branches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea style={{ minHeight: 70 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of this opportunity" />
          </div>
          <div className="form-group">
            <label>How to Get There</label>
            <textarea style={{ minHeight: 90 }} value={form.howto} onChange={(e) => setForm({ ...form, howto: e.target.value })} placeholder="Steps to achieve this opportunity" />
          </div>
          <div className="form-group">
            <label>Key Skills <span className="label-hint">(one per line, optional)</span></label>
            <textarea style={{ minHeight: 70 }} value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Resources <span className="label-hint">(one per line — <code>Label|https://url</code>)</span></label>
            <textarea style={{ minHeight: 70 }} value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} />
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
