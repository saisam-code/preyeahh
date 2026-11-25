import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  createBranch,
  deleteBranch,
  fetchManagedBranches,
  updateBranchDomains,
} from "../../services/branchService.js";
import { fetchRoles } from "../../services/rolesService.js";
import { fetchCareerDomains } from "../../services/careerDomainService.js";

export default function AdminBranches() {
  const [branches, setBranches] = useState([]);
  const [domains, setDomains] = useState([]);
  const [roleCounts, setRoleCounts] = useState({});
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingBranch, setSavingBranch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [list, domainList] = await Promise.all([fetchManagedBranches(), fetchCareerDomains()]);
      setBranches(list);
      setDomains(domainList);
      const counts = await Promise.all(
        list.map((branch) => fetchRoles({ branch: branch.name, limit: 1 }).then((r) => [branch.name, r.meta.total]))
      );
      setRoleCounts(Object.fromEntries(counts));
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load branches and domains");
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
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding branch");
    }
  };

  const handleDomainChange = (branchName, selectedIds) => {
    setBranches((current) =>
      current.map((branch) =>
        branch.name === branchName ? { ...branch, domainIds: selectedIds } : branch
      )
    );
  };

  const handleSaveDomains = async (branch) => {
    setSavingBranch(branch.name);
    try {
      const domainIds = branch.domainIds.map((domain) =>
        typeof domain === "string" ? domain : domain._id
      );
      await updateBranchDomains(branch.name, domainIds);
      toast.success(`Domains updated for ${branch.name}`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update branch domains");
    } finally {
      setSavingBranch("");
    }
  };

  const handleDelete = async (name) => {
    const count = roleCounts[name] || 0;
    if (!window.confirm(`Delete branch "${name}"? This will also delete ${count} role(s) and related entries.`)) return;
    try {
      await deleteBranch(name);
      toast.success("Branch deleted");
      await load();
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
        <>
        {!domains.length && (
          <div className="empty">
            <p>No career domains are available. Run the career-domain migration before assigning domains to branches.</p>
          </div>
        )}
        <div className="admin-branch-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Branch Name</th><th>Roles Count</th><th>Career Domains</th><th>Actions</th></tr></thead>
            <tbody>
              {branches.map((branch) => {
                const selectedIds = branch.domainIds.map((domain) =>
                  typeof domain === "string" ? domain : domain._id
                );
                return (
                  <tr key={branch._id}>
                    <td><strong>{branch.name}</strong></td>
                    <td>{roleCounts[branch.name] ?? "—"}</td>
                    <td>
                      <select
                        className="admin-branch-domain-select"
                        aria-label={`Career domains for ${branch.name}`}
                        multiple
                        value={selectedIds}
                        onChange={(event) =>
                          handleDomainChange(
                            branch.name,
                            Array.from(event.target.selectedOptions, (option) => option.value)
                          )
                        }
                      >
                        {domains.map((domain) => (
                          <option key={domain._id} value={domain._id}>{domain.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={savingBranch === branch.name}
                        onClick={() => handleSaveDomains(branch)}
                      >
                        {savingBranch === branch.name ? "Saving..." : "Save domains"}
                      </button>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(branch.name)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
