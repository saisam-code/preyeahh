import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchBranches, createBranch, deleteBranch } from "../../services/branchService";
import { fetchRoles } from "../../services/rolesService";

export default function AdminBranches() {
  const [branches, setBranches] = useState([]);
  const [roleCounts, setRoleCounts] = useState({});
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchBranches();
      setBranches(list);
      const counts = await Promise.all(
        list.map((b) => fetchRoles({ branch: b, limit: 1 }).then((r) => [b, r.meta.total]))
      );
      setRoleCounts(Object.fromEntries(counts));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    const name = newName.trim().toUpperCase();
    if (!name) {
      toast.error("Enter a branch name first");
      return;
    }
    try {
      await createBranch(name);
      setNewName("");
      toast.success("Branch added");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding branch");
    }
  };

  const handleDelete = async (name) => {
    const count = roleCounts[name] || 0;
    if (!window.confirm(`Delete branch "${name}"? This will also delete ${count} role(s) and related entries.`)) return;
    try {
      await deleteBranch(name);
      toast.success("Branch deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting branch");
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h2>Manage Branches</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            className="search-input"
            placeholder="e.g. MECH"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleAdd}>+ Add Branch</button>
        </div>
      </div>
      {loading ? (
        <div className="empty"><div className="icon"><i className="fa fa-spinner fa-spin" /></div><p>Loading...</p></div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Branch Name</th><th>Roles Count</th><th>Actions</th></tr></thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b}>
                <td><strong>{b}</strong></td>
                <td>{roleCounts[b] ?? "—"}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(b)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
