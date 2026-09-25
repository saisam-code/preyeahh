import { useEffect, useState } from "react";
import { fetchDashboardStats } from "../../services/adminService";

export default function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDashboardStats().then((r) => setStats(r.data)).catch(() => setStats(null));
  }, []);

  if (!stats) {
    return (
      <div className="empty">
        <div className="icon"><i className="fa fa-spinner fa-spin" /></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const cards = [
    { num: stats.branches, label: "Branches", section: "branches" },
    { num: stats.totalRoles, label: "Total Roles", section: "roles" },
    { num: stats.coreRoles, label: "Core Roles", section: "roles" },
    { num: stats.nonCoreRoles, label: "Non-Core Roles", section: "roles" },
    { num: stats.beyondEntries, label: "Beyond Entries", section: "beyond" },
    { num: stats.guidanceEntries, label: "Guidance Entries", section: "guidance" },
    { num: stats.pendingGuideRequests, label: "Pending Guide Requests", section: "guides" },
    { num: stats.pendingRoleRequests, label: "Pending Role Requests", section: "requests" },
  ];

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="stats">
        {cards.map((c) => (
          <div
            className="stat-card"
            key={c.label}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            onClick={() => onNavigate?.(c.section)}
            onKeyDown={(e) => e.key === "Enter" && onNavigate?.(c.section)}
          >
            <div className="num">{c.num}</div>
            <div className="label">{c.label}</div>
          </div>
        ))}
      </div>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Click any card to jump to that section.</p>
    </div>
  );
}