import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaBuilding, FaMagnifyingGlass, FaRotate } from "react-icons/fa6";
import { fetchAllInstitutions, updateInstitutionStatus } from "../../services/adminService.js";

const STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"];

function formatStatus(status) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminInstitutions({ onUpdated }) {
  const [institutions, setInstitutions] = useState([]);
  const [draftStatuses, setDraftStatuses] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAllInstitutions();
      const records = response.data || [];
      setInstitutions(records);
      setDraftStatuses(Object.fromEntries(records.map((institution) => [institution._id, institution.status])));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load institutions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredInstitutions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return institutions.filter((institution) => {
      const matchesStatus = statusFilter === "all" || institution.status === statusFilter;
      const searchable = [
        institution.name,
        institution.code,
        institution.category,
        institution.location,
        institution.contactEmail,
        institution.contactPerson,
      ].join(" ").toLowerCase();
      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [institutions, search, statusFilter]);

  const saveStatus = async (institution) => {
    const nextStatus = draftStatuses[institution._id];
    if (!nextStatus || nextStatus === institution.status) return;
    if (
      ["REJECTED", "SUSPENDED"].includes(nextStatus) &&
      !window.confirm(`${formatStatus(nextStatus)} ${institution.name}?`)
    ) return;

    setSavingId(institution._id);
    try {
      await updateInstitutionStatus(institution._id, nextStatus);
      setInstitutions((current) =>
        current.map((item) => item._id === institution._id ? { ...item, status: nextStatus } : item)
      );
      onUpdated?.();
      toast.success(`${institution.name} marked ${formatStatus(nextStatus).toLowerCase()}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update institution status");
      setDraftStatuses((current) => ({ ...current, [institution._id]: institution.status }));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-management-page">
      <div className="admin-header-row">
        <div>
          <div className="admin-header-title-wrap">
            <h1 className="admin-page-title">Institutions</h1>
            <span className="admin-total-badge">
              {institutions.length} institution{institutions.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="admin-page-subtitle">
            Review institution applications and manage access to the institution portal.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          <FaRotate className={loading ? "spin-icon" : ""} /> Refresh
        </button>
      </div>

      <div className="admin-toolbar-card">
        <label className="toolbar-search-form">
          <span className="toolbar-input-wrap">
            <FaMagnifyingGlass className="search-prefix-icon" />
            <input
              className="toolbar-search-field"
              type="search"
              placeholder="Search name, code, location, or contact…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </span>
        </label>
        <div className="toolbar-controls-row">
          <label className="select-with-label">
            <span className="select-label">Status:</span>
            <select className="toolbar-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {STATUSES.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="admin-table-panel">
        {loading ? (
          <div className="admin-table-loading">Loading institutions…</div>
        ) : filteredInstitutions.length === 0 ? (
          <div className="admin-table-empty">
            <FaBuilding className="empty-state-icon" />
            <p>{institutions.length ? "No institutions match these filters." : "No institution applications yet."}</p>
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Manage status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstitutions.map((institution) => {
                  const status = draftStatuses[institution._id] || institution.status;
                  return (
                    <tr key={institution._id}>
                      <td>
                        <strong className="student-cell-name">{institution.name}</strong>
                        <span className="student-cell-email">{institution.code} · {institution.category}</span>
                      </td>
                      <td>
                        <span className="student-cell-name">{institution.contactPerson || "—"}</span>
                        <span className="student-cell-email">{institution.contactEmail}</span>
                      </td>
                      <td>{institution.location || "—"}</td>
                      <td>{Number(institution.studentCountApprox || 0).toLocaleString()}</td>
                      <td>
                        <span className={`admin-status-badge institution-status-${institution.status.toLowerCase()}`}>
                          {formatStatus(institution.status)}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions-inline">
                          <select
                            className="toolbar-select"
                            aria-label={`Set status for ${institution.name}`}
                            value={status}
                            onChange={(event) => setDraftStatuses((current) => ({
                              ...current,
                              [institution._id]: event.target.value,
                            }))}
                          >
                            {STATUSES.map((option) => (
                              <option key={option} value={option}>{formatStatus(option)}</option>
                            ))}
                          </select>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={savingId === institution._id || status === institution.status}
                            onClick={() => saveStatus(institution)}
                          >
                            {savingId === institution._id ? "Saving…" : "Save"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
