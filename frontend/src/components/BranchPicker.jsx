import { useEffect, useState } from "react";
import api from "../services/api";
import { useBranch } from "../context/BranchContext";

export default function BranchPicker() {
  const { branch, setBranch } = useBranch();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // Try to fetch branches. Backend may not expose /branches; fall back to extracting from roles.
    api
      .get("/branches")
      .then(({ data }) => {
        if (!mounted) return;
        setBranches(data?.data || []);
      })
      .catch(() => {
        // fallback: derive branches from roles endpoint
        api
          .get("/roles")
          .then(({ data }) => {
            if (!mounted) return;
            const roles = data?.data || [];
            const unique = Array.from(new Set(roles.map((r) => r.branch))).filter(Boolean);
            setBranches(unique.map((b) => ({ name: b })));
          })
          .catch((err) => setError(err));
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  if (loading) return <div>Loading branches...</div>;
  if (error) return <div className="ulm-err">Failed to load branches</div>;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <label style={{ fontWeight: 600, marginRight: 8 }}>Branch</label>
      <select value={branch || ""} onChange={(e) => setBranch(e.target.value)} style={{ padding: "0.5rem 1rem" }}>
        <option value="">Select branch</option>
        {branches.map((b) => (
          <option key={b.name || b} value={b.name || b}>
            {b.name || b}
          </option>
        ))}
      </select>
    </div>
  );
}
