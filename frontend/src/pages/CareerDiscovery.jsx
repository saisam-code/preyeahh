import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  FaMagnifyingGlass,
  FaScaleBalanced,
  FaFlask,
  FaArrowRight,
  FaIndianRupeeSign,
  FaShieldHalved,
  FaTriangleExclamation,
  FaChartLine,
} from "react-icons/fa6";
import { discoverCareers, compareCareers, analyzeCareerSwitch } from "../services/careerPlannerService.js";

const CATEGORIES = [
  "all",
  "Conventional",
  "Unconventional",
  "Emerging",
  "Creative",
  "Sports & Performing Arts",
];

export default function CareerDiscovery() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  // Compare mode
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  // Reality detail modal
  const [selectedRole, setSelectedRole] = useState(null);

  const loadCareers = async () => {
    try {
      setLoading(true);
      const data = await discoverCareers({ category, search });
      setRoles(data || []);
    } catch {
      toast.error("Failed to fetch careers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCareers();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCareers();
  };

  const toggleCompare = (roleId) => {
    if (selectedForCompare.includes(roleId)) {
      setSelectedForCompare(selectedForCompare.filter((id) => id !== roleId));
    } else {
      if (selectedForCompare.length >= 4) {
        return toast.error("You can compare up to 4 careers simultaneously");
      }
      setSelectedForCompare([...selectedForCompare, roleId]);
    }
  };

  const handleRunComparison = async () => {
    if (selectedForCompare.length < 2) {
      return toast.error("Select at least 2 careers to compare");
    }
    setComparing(true);
    try {
      const result = await compareCareers(selectedForCompare);
      setComparisonResult(result);
    } catch (err) {
      toast.error(err.response?.data?.message || "Comparison failed");
    } finally {
      setComparing(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 0" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0 }}>Career Discovery & Reality</h2>
        <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0" }}>
          Explore real-world careers, understand verified salaries, job demands, entry costs, and compare paths before committing.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", flex: 1 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`tab ${category === c ? "active" : ""}`}
              onClick={() => setCategory(c)}
              style={{ textTransform: "capitalize", whiteSpace: "nowrap" }}
            >
              {c}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Search role, skill, domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "0.4rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card-bg)" }}
          />
          <button type="submit" className="btn btn-outline btn-sm">
            <FaMagnifyingGlass />
          </button>
        </form>
      </div>

      {/* Floating Compare Action Bar */}
      {selectedForCompare.length > 0 && (
        <div style={{ background: "var(--primary-bg, #eff6ff)", border: "1.5px solid var(--primary)", padding: "0.75rem 1.25rem", borderRadius: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <strong>{selectedForCompare.length} careers selected</strong> (Compare 2 to 4 paths side-by-side)
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-outline btn-sm" onClick={() => setSelectedForCompare([])}>Clear</button>
            <button className="btn btn-primary btn-sm" onClick={handleRunComparison} disabled={comparing}>
              <FaScaleBalanced /> {comparing ? "Analyzing..." : "Compare Now"}
            </button>
          </div>
        </div>
      )}

      {/* Comparison Modal / Panel */}
      {comparisonResult && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 900, maxHeight: "85vh", overflowY: "auto", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>Career Comparison Analysis</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setComparisonResult(null)}>Close</button>
            </div>

            {/* AI Comparative summary */}
            <div style={{ padding: "1rem", background: "rgba(26,86,219,0.06)", borderRadius: "0.5rem", marginBottom: "1.5rem", fontSize: "0.92rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {comparisonResult.aiAnalysis}
            </div>

            {/* Comparison Grid */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${comparisonResult.roles.length}, 1fr)`, gap: "1rem" }}>
              {comparisonResult.roles.map((r) => (
                <div key={r._id} style={{ border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "1rem", background: "var(--card-bg)" }}>
                  <h4 style={{ margin: "0 0 0.5rem" }}>{r.title}</h4>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>{r.domain}</div>
                  <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "0.5rem 0" }} />
                  <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <div><strong>Starting Pay:</strong> {r.reality?.salaryRange?.starting || "Market standard"}</div>
                    <div><strong>Demand:</strong> {r.reality?.demandLevel || "High"}</div>
                    <div><strong>Education Time:</strong> ~{r.reality?.timeToEmployabilityMonths || 48} months</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Career Cards Grid */}
      {loading ? (
        <div className="empty"><p>Loading careers...</p></div>
      ) : roles.length === 0 ? (
        <div className="empty"><p>No careers found matching your criteria.</p></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "1.25rem" }}>
          {roles.map((role) => {
            const isSelected = selectedForCompare.includes(role._id);
            return (
              <div
                key={role._id}
                style={{
                  background: "var(--card-bg, #fff)",
                  border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                  borderRadius: "0.85rem",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <span className="branch-tag">{role.category || "Conventional"}</span>
                    <button
                      onClick={() => toggleCompare(role._id)}
                      style={{
                        background: isSelected ? "var(--primary)" : "transparent",
                        color: isSelected ? "#fff" : "var(--text-muted)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.35rem",
                        padding: "0.2rem 0.5rem",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      {isSelected ? "Selected" : "+ Compare"}
                    </button>
                  </div>

                  <h3 style={{ margin: "0.2rem 0", fontSize: "1.15rem" }}>{role.title}</h3>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    {role.domain || "Engineering & Tech"}
                  </div>

                  <p style={{ fontSize: "0.88rem", color: "var(--text)", lineHeight: 1.5, margin: "0 0 1rem", minHeight: 40 }}>
                    {role.description ? (role.description.length > 110 ? role.description.slice(0, 110) + "..." : role.description) : "Discover career pathways and entry realities."}
                  </p>

                  {/* Career Reality Highlights */}
                  <div style={{ background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "0.82rem", display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Starting Salary:</span>
                      <strong>{role.reality?.salaryRange?.starting || "₹4 - ₹8 LPA"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Job Demand:</span>
                      <span style={{ color: "var(--primary)", fontWeight: 600 }}>{role.reality?.demandLevel || "High"}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setSelectedRole(role)}
                  >
                    View Reality
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Career Reality Detail Modal */}
      {selectedRole && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 650, padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>Career Reality: {selectedRole.title}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedRole(null)}>Close</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ padding: "0.85rem", background: "rgba(26,86,219,0.06)", borderRadius: "0.5rem" }}>
                <strong>Salary & Income Trajectory (Estimated INR):</strong>
                <div style={{ marginTop: "0.35rem", fontSize: "0.88rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  <div>Entry: <strong>{selectedRole.reality?.salaryRange?.starting || "₹4 - ₹7 LPA"}</strong></div>
                  <div>Mid-Level: <strong>{selectedRole.reality?.salaryRange?.mid || "₹10 - ₹18 LPA"}</strong></div>
                  <div>Senior: <strong>{selectedRole.reality?.salaryRange?.experienced || "₹25+ LPA"}</strong></div>
                </div>
              </div>

              <div>
                <strong>Practical Entry Timeline:</strong>
                <p style={{ margin: "0.25rem 0", fontSize: "0.88rem", color: "var(--text-muted)" }}>
                  Estimated ~{selectedRole.reality?.timeToEmployabilityMonths || 48} months of education and skill preparation to become fully job-ready.
                </p>
              </div>

              <div>
                <strong>Career Risks & Honest Realities:</strong>
                <ul style={{ margin: "0.25rem 0", paddingLeft: "1.25rem", fontSize: "0.88rem" }}>
                  {selectedRole.reality?.careerRisks?.length ? (
                    selectedRole.reality.careerRisks.map((r, i) => <li key={i}>{r}</li>)
                  ) : (
                    <>
                      <li>Continuous learning required due to evolving industry technologies.</li>
                      <li>Competitive market for junior positions requiring strong portfolio evidence.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
