import React from "react";

export default function RoleCard({ role, onOpen }) {
  return (
    <div className="role-card" style={{ border: "1px solid var(--border)", padding: 16, borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <h3 style={{ margin: 0 }}>{role.title}</h3>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{role.branch}</div>
      </div>
      <p style={{ color: "var(--text-dim)", marginTop: 8 }}>{role.description}</p>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button className="btn" onClick={() => onOpen(role)}>
          View
        </button>
      </div>
    </div>
  );
}
