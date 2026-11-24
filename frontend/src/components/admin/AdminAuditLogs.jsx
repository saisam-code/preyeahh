import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaMagnifyingGlass, FaRotate, FaShieldHalved } from "react-icons/fa6";
import { fetchAdminAuditLogs } from "../../services/adminService.js";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminAuditLogs({ page, limit: 25, search });
      setLogs(response.data || []);
      setMeta(response.meta || { total: 0, totalPages: 1 });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div className="admin-management-page">
      <div className="admin-header-row">
        <div>
          <div className="admin-header-title-wrap">
            <h1 className="admin-page-title">Admin Audit Log</h1>
            <span className="admin-total-badge">{meta.total} event{meta.total !== 1 ? "s" : ""}</span>
          </div>
          <p className="admin-page-subtitle">
            Review administrator access to sensitive student conversations and records.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          <FaRotate className={loading ? "spin-icon" : ""} /> Refresh
        </button>
      </div>

      <div className="admin-toolbar-card">
        <form className="toolbar-search-form" onSubmit={submitSearch}>
          <span className="toolbar-input-wrap">
            <FaMagnifyingGlass className="search-prefix-icon" />
            <input
              className="toolbar-search-field"
              type="search"
              placeholder="Search administrator, action, or access reason…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </span>
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
      </div>

      <div className="admin-table-panel">
        {loading ? (
          <div className="admin-table-loading">Loading audit events…</div>
        ) : logs.length === 0 ? (
          <div className="admin-table-empty">
            <FaShieldHalved className="empty-state-icon" />
            <p>No audit events found.</p>
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Date & time</th>
                  <th>Administrator</th>
                  <th>Action</th>
                  <th>Record</th>
                  <th>Access reason</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.adminEmail}</td>
                    <td><span className="admin-branch-badge">{log.action.replaceAll("_", " ")}</span></td>
                    <td>{log.targetType} · <code>{log.targetId}</code></td>
                    <td>{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && meta.totalPages > 1 && (
          <div className="admin-pagination-bar">
            <span className="pagination-text">Page {page} of {meta.totalPages}</span>
            <div className="toolbar-controls-row">
              <button
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
