import { useEffect, useState } from "react";
import { fetchBranches } from "../services/branchService";
import { useBranch } from "../context/BranchContext";

const BRANCH_ICONS = { CSE: "fa-laptop-code", ECE: "fa-satellite-dish", EEE: "fa-bolt", MECH: "fa-gears", CIVIL: "fa-building" };

export default function BranchGate({ label }) {
  const { setBranch } = useBranch();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches()
      .then(setBranches)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="section" style={{ textAlign: "center", paddingTop: "3rem", paddingBottom: "4rem" }}>
      <div className="empty" style={{ paddingBottom: "0.5rem" }}>
        <div className="icon"><i className="fa fa-compass" /></div>
        <p>Pick a branch to see {label}</p>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading branches...</p>
      ) : (
        <div className="branch-grid" style={{ maxWidth: 760, margin: "2rem auto 0" }}>
          {branches.map((b) => (
            <div
              key={b}
              className="branch-card"
              style={{ cursor: "pointer" }}
              onClick={() => setBranch(b)}
            >
              <div className="branch-icon"><i className={`fa ${BRANCH_ICONS[b] || "fa-graduation-cap"}`} /></div>
              <div className="branch-name">{b}</div>
              <div className="branch-arrow" style={{ opacity: 1, transform: "none" }}>
                <i className="fa fa-arrow-right" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}