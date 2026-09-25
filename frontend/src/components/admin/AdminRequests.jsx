import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchRoleRequests, dismissRoleRequest, clearRoleRequests } from "../../services/roleRequestService";

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRequests(await fetchRoleRequests());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDismiss = async (id) => {
    try {
      await dismissRoleRequest(id);
      toast.success("Request dismissed");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error dismissing request");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all role requests?")) return;
    try {
      await clearRoleRequests();
      toast.success("All requests cleared");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error clearing requests");
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h2>Role Requests</h2>
        <button className="btn btn-danger btn-sm" onClick={handleClearAll}>Clear All</button>
      </div>
      {loading ? (
        <div className="empty"><div className="icon"><i className="fa fa-spinner fa-spin" /></div><p>Loading...</p></div>
      ) : !requests.length ? (
        <div className="empty"><div className="icon"><i className="fa fa-inbox" /></div><p>No role requests yet.</p></div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Role Name</th><th>Branch</th><th>Summary</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r._id}>
                <td><strong>{r.roleName}</strong></td>
                <td><span className="branch-tag">{r.branch}</span></td>
                <td style={{ fontSize: "0.83rem", color: "var(--muted)", maxWidth: 320 }}>{r.summary}</td>
                <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => handleDismiss(r._id)}>Dismiss</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
