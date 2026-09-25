import { useEffect, useState } from "react";
import { fetchRoleInterest } from "../../services/adminService";
import { fetchBranches } from "../../services/branchService";

export default function AdminInterest() {
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBranches().then(setBranches); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (branchFilter !== "all") params.branch = branchFilter;
      if (typeFilter !== "all") params.type = typeFilter;
      setRaw(await fetchRoleInterest(params).then((r) => r.data));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [branchFilter, typeFilter]);

  // Aggregate by role, mirrors renderInterest()'s client-side grouping.
  const map = {};
  raw.forEach((e) => {
    const key = e.role;
    if (!map[key]) map[key] = { roleName: e.roleName, branch: e.branch, committed: 0, exploring: 0 };
    if (e.committed) map[key].committed++;
    else map[key].exploring++;
  });
  const ranked = Object.values(map)
    .map((r) => ({ ...r, total: r.committed + r.exploring }))
    .sort((a, b) => b.committed - a.committed || b.total - a.total);
  const maxTotal = ranked[0]?.total || 1;

  const exportCSV = () => {
    if (!raw.length) return alert("No data to export.");
    const rows = [["Student Name", "Student Email", "Role", "Branch", "Interest", "Date"]];
    raw.forEach((e) => {
      rows.push([
        e.student?.name || "—",
        e.student?.email || "—",
        e.roleName,
        e.branch,
        e.committed ? "Committed" : "Exploring",
        new Date(e.recordedAt).toLocaleDateString(),
      ]);
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `role-interest-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="admin-header">
        <h2>Role Interest Ranking</h2>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
            <option value="all">All Branches</option>
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Interest</option>
            <option value="committed">Committed Only</option>
            <option value="exploring">Exploring Only</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      {loading ? (
        <div className="empty"><div className="icon"><i className="fa fa-spinner fa-spin" /></div><p>Loading...</p></div>
      ) : !ranked.length ? (
        <div className="empty"><div className="icon"><i className="fa fa-chart-bar" /></div><p>No interest data yet. Students generate this by tapping role cards after logging in.</p></div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Role</th><th>Branch</th><th>Committed</th><th>Exploring</th><th>Total</th><th>Interest Bar</th></tr>
          </thead>
          <tbody>
            {ranked.map((r, i) => {
              const pct = Math.round((r.committed / (r.total || 1)) * 100);
              const barWidth = Math.round((r.total / maxTotal) * 100);
              return (
                <tr key={r.roleName + r.branch}>
                  <td><strong style={{ color: "var(--primary)" }}>#{i + 1}</strong></td>
                  <td><strong>{r.roleName}</strong></td>
                  <td><span className="branch-tag">{r.branch}</span></td>
                  <td><span style={{ color: "#16a34a", fontWeight: 700 }}>{r.committed}</span></td>
                  <td><span style={{ color: "var(--muted)", fontWeight: 600 }}>{r.exploring}</span></td>
                  <td><strong>{r.total}</strong></td>
                  <td style={{ minWidth: 140 }}>
                    <div style={{ background: "var(--border)", borderRadius: 20, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${barWidth}%`, height: "100%", background: "var(--primary)", borderRadius: 20 }} />
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2, display: "block" }}>{pct}% committed</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
