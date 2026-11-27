import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { searchResources, createResource, updateResource, deleteResource } from "../../services/resourceService.js";
import { fetchCareerDomains } from "../../services/careerDomainService.js";

const initialForm = { title: "", description: "", type: "article", url: "", technology: "", difficulty: "all" };

export default function GuideResources({ branch, domainId }) {
  const [items, setItems] = useState([]);
  const [domain, setDomain] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCareerDomains()
      .then((domains) => setDomain(domains.find((item) => item._id === domainId) || null))
      .catch((error) => toast.error(error.response?.data?.message || "Could not load career domain"));
  }, [domainId]);

  const load = useCallback(async () => {
    if (!domain?.slug) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await searchResources({ branch, domain: domain.slug, limit: 50 });
      setItems((result.data || []).filter((item) => item.branches?.includes(branch) && item.relatedDomains?.includes(domain.slug)));
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load domain resources");
    } finally {
      setLoading(false);
    }
  }, [branch, domain]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateResource(editingId, form);
      } else {
        await createResource({ ...form, branches: [branch] });
      }
      setForm(initialForm);
      setEditingId(null);
      toast.success(editingId ? "Resource updated" : "Resource added");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add resource");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      type: item.type,
      url: item.url,
      technology: item.technology,
      difficulty: item.difficulty,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this branch resource?")) return;
    try {
      await deleteResource(id);
      toast.success("Resource deleted");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete resource");
    }
  };

  return (
    <section>
      <div className="admin-header"><h2>Manage {domain?.name || "Domain"} Resources</h2></div>
      <form className="role-form-section" onSubmit={handleSave}>
        <div className="form-row">
          <div className="form-group">
            <label>Title</label>
            <input required maxLength={200} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div className="form-group">
            <label>Technology</label>
            <input required maxLength={50} value={form.technology} onChange={(event) => setForm({ ...form, technology: event.target.value })} placeholder="e.g. python" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Resource URL</label>
            <input required type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              {["video", "article", "documentation", "course", "github", "practice", "book"].map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Description</label>
            <textarea required maxLength={1000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div className="form-group">
            <label>Difficulty</label>
            <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
              {["all", "beginner", "intermediate", "advanced"].map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving || !domain}>
          {saving ? "Saving..." : editingId ? "Save Changes" : "Add Resource"}
        </button>
        {editingId && <button className="btn btn-outline" type="button" onClick={() => { setEditingId(null); setForm(initialForm); }}>Cancel</button>}
      </form>
      {loading ? <div className="empty"><p>Loading...</p></div> : (
        <table className="admin-table">
          <thead><tr><th>Resource</th><th>Technology</th><th>Type</th><th>Contributor</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td><td>{item.technology}</td><td>{item.type}</td>
                <td>{item.createdBy?.name || "Original contributor not recorded"}{item.editHistory?.length > 0 && ` · Edited by ${[...new Set(item.editHistory.map((edit) => edit.name).filter(Boolean))].join(", ")}`}</td>
                <td>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => handleEdit(item)}>Edit</button>{" "}
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)" }}>No branch resources found</td></tr>}
          </tbody>
        </table>
      )}
    </section>
  );
}
