import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchGuides, setGuideStatus, assignGuideRoles, assignGuideDomain, deleteGuide } from "../../services/guideService.js";
import { fetchRoles } from "../../services/rolesService.js";
import { fetchCareerDomains } from "../../services/careerDomainService.js";

export default function AdminGuides() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(null); // guide being edited
  const [branchRoles, setBranchRoles] = useState([]);
  const [checked, setChecked] = useState(new Set());
  const [careerDomains, setCareerDomains] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      setGuides(await fetchGuides());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    fetchCareerDomains()
      .then(setCareerDomains)
      .catch((error) => toast.error(error.response?.data?.message || "Could not load career domains"));
  }, []);

  const handleStatus = async (id, status) => {
    try {
      await setGuideStatus(id, status);
      toast.success(`Guide ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating status");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete guide "${name}"? This cannot be undone.`)) return;
    try {
      await deleteGuide(id);
      toast.success("Guide deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting guide");
    }
  };

  const openAssign = async (guide) => {
    const res = await fetchRoles({ branch: guide.branch, limit: 100 });
    setBranchRoles(res.data);
    setChecked(new Set(guide.roleNames || []));
    setAssignModal(guide);
  };

  const toggleRole = (title) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  };

  const saveAssigned = async () => {
    if (!checked.size) return toast.error("Select at least one role.");
    try {
      await assignGuideRoles(assignModal.id, [...checked]);
      toast.success("Roles updated");
      setAssignModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error assigning roles");
    }
  };

  const saveDomain = async (guide) => {
    const domainId = selectedDomains[guide.id] || guide.domainId;
    if (!domainId) return toast.error("Choose a career domain.");
    try {
      await assignGuideDomain(guide.id, domainId);
      toast.success("Guide career domain assigned");
      setSelectedDomains((current) => ({ ...current, [guide.id]: domainId }));
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error assigning career domain");
    }
  };

  return (
    <div>
      <div className="admin-header"><h2>Guide Requests</h2></div>

      {loading ? (
        <div className="empty"><div className="icon"><i className="fa fa-spinner fa-spin" /></div><p>Loading...</p></div>
      ) : !guides.length ? (
        <div className="empty"><div className="icon"><i className="fa fa-compass" /></div><p>No guide registrations yet.</p></div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Branch</th><th>Career Domain</th><th>Roles</th><th>Bio</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {guides.map((g) => (
              <tr key={g.id}>
                <td><strong>{g.name}</strong></td>
                <td style={{ fontSize: "var(--font-size-sm)", color: "var(--muted)" }}>{g.email}</td>
                <td><span className="branch-tag">{g.branch}</span></td>
                <td>
                  <select
                    value={selectedDomains[g.id] || g.domainId || ""}
                    onChange={(event) => setSelectedDomains((current) => ({ ...current, [g.id]: event.target.value }))}
                    aria-label={`Career domain for ${g.name}`}
                  >
                    <option value="">Select domain</option>
                    {careerDomains.map((domain) => <option key={domain._id} value={domain._id}>{domain.name}</option>)}
                  </select>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={!(selectedDomains[g.id] || g.domainId)}
                    onClick={() => saveDomain(g)}
                  >
                    Save
                  </button>
                </td>
                <td style={{ fontSize: "var(--font-size-sm)" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                    {(g.roleNames || []).map((r) => <span className="detail-tag" key={r}>{r}</span>)}
                    {!g.roleNames?.length && "—"}
                  </div>
                </td>
                <td style={{ fontSize: "var(--font-size-sm)", color: "var(--muted)", maxWidth: 180 }}>{g.bio || "—"}</td>
                <td><span className={`guide-status-badge guide-status-${g.status}`}>{g.status}</span></td>
                <td>
                  <div className="table-actions" style={{ flexWrap: "wrap", gap: "0.4rem" }}>
                    {g.status !== "approved" && <button className="btn btn-primary btn-sm" onClick={() => handleStatus(g.id, "approved")}>Approve</button>}
                    {g.status !== "rejected" && <button className="btn btn-danger btn-sm" onClick={() => handleStatus(g.id, "rejected")}>Reject</button>}
                    <button className="btn btn-outline btn-sm" onClick={() => openAssign(g)}>Assign Roles</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id, g.name)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className={`modal-overlay ${assignModal ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && setAssignModal(null)}>
        <div className="modal" style={{ maxWidth: 400 }}>
          <div className="modal-header">
            <div>
              <h2>Assign Roles</h2>
              <p className="modal-sub">Select roles for this {assignModal?.branch} guide.</p>
            </div>
            <button className="modal-close" onClick={() => setAssignModal(null)}>×</button>
          </div>
          <div style={{ maxHeight: 280, overflowY: "auto", padding: "0.25rem 0" }}>
            {branchRoles.length ? branchRoles.map((r) => (
              <label key={r._id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.45rem 0", fontSize: "var(--font-size-sm)", cursor: "pointer" }}>
                <input type="checkbox" checked={checked.has(r.title)} onChange={() => toggleRole(r.title)} style={{ width: 16, height: 16, accentColor: "var(--primary)" }} />
                {r.title}
              </label>
            )) : <p style={{ color: "var(--muted)", fontSize: "var(--font-size-sm)" }}>No roles in this branch yet.</p>}
          </div>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setAssignModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveAssigned}>Save Roles</button>
          </div>
        </div>
      </div>
    </div>
  );
}
