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
  FaShuffle,
  FaBullseye,
  FaAward,
  FaClock,
  FaBuildingColumns,
} from "react-icons/fa6";
import {
  discoverCareers,
  compareCareers,
  analyzeCareerSwitch,
  calculateFinancialRoi,
  getPublicOutcomes,
  startExperiment,
  submitReport,
} from "../services/careerPlannerService.js";

function formatRealityFact(fact) {
  if (!fact) return "No verified data yet";
  if (typeof fact === "string") return fact.trim() || "No verified data yet";
  if (typeof fact === "object" && fact.value && fact.value.trim()) {
    return fact.value.trim();
  }
  return "No verified data yet";
}

const CATEGORIES = [
  "all",
  "Conventional",
  "Unconventional",
  "Emerging",
  "Creative",
  "Sports & Performing Arts",
];

const CAPABILITY_TABS = [
  { id: "discovery", label: "Career Discovery & Reality" },
  { id: "compare", label: "Career Comparison (2-5)" },
  { id: "switch", label: "Career Switching & Gaps" },
  { id: "experiments", label: "Practical Experiments" },
  { id: "financial", label: "Financial ROI Planner" },
  { id: "outcomes", label: "Alumni & Outcomes" },
  { id: "safety", label: "Trust & Safety Center" },
];

export default function CareerDiscovery() {
  const [activeTab, setActiveTab] = useState("discovery");
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

  // Switching state
  const [switchFrom, setSwitchFrom] = useState("Mechanical Engineering");
  const [switchTo, setSwitchTo] = useState("UI/UX Designer");
  const [switchAnalysis, setSwitchAnalysis] = useState("");
  const [analyzingSwitch, setAnalyzingSwitch] = useState(false);

  // Financial ROI state
  const [eduCost, setEduCost] = useState(400000);
  const [startingSal, setStartingSal] = useState(600000);
  const [roiResult, setRoiResult] = useState(null);

  // Outcomes state
  const [outcomes, setOutcomes] = useState([]);

  // Report state
  const [reportReason, setReportReason] = useState("Inappropriate behavior");
  const [reportDetails, setReportDetails] = useState("");

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

  useEffect(() => {
    if (activeTab === "outcomes") {
      getPublicOutcomes().then(setOutcomes).catch(() => {});
    }
  }, [activeTab]);

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

  const handleRunSwitch = async (e) => {
    e.preventDefault();
    setAnalyzingSwitch(true);
    try {
      const res = await analyzeCareerSwitch({ currentCareer: switchFrom, targetCareer: switchTo });
      setSwitchAnalysis(res.analysis);
      toast.success("Career transition pathway analyzed");
    } catch {
      toast.error("Could not run switch analysis");
    } finally {
      setAnalyzingSwitch(false);
    }
  };

  const handleCalculateRoi = async (e) => {
    e.preventDefault();
    try {
      const res = await calculateFinancialRoi({
        educationCostMin: eduCost * 0.9,
        educationCostMax: eduCost * 1.1,
        startingSalary: startingSal,
      });
      setRoiResult(res);
      toast.success("Financial ROI breakdown generated");
    } catch {
      toast.error("Error calculating ROI");
    }
  };

  const handleStartExp = async (title, domain) => {
    try {
      await startExperiment({ experimentTitle: title, careerDomain: domain });
      toast.success("Experiment added to your active planner!");
    } catch {
      toast.error("Please login as a student to start career experiments");
    }
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    try {
      await submitReport({
        reportedUserId: "650000000000000000000001",
        reason: reportReason,
        details: reportDetails,
      });
      toast.success("Report submitted securely to platform moderation.");
      setReportDetails("");
    } catch {
      toast.error("Please login to submit moderation reports");
    }
  };

  return (
    <div style={{ maxWidth: 1150, margin: "0 auto", padding: "1.5rem 0" }}>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 1, color: "var(--primary)", fontWeight: 700 }}>
          PREYEAHH CAREER INTELLIGENCE SUITE
        </span>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.2rem 0" }}>
          Explore Careers & Reality Intelligence
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.95rem" }}>
          Understand verified market realities, compare career paths, calculate real ROI, and experiment safely before committing.
        </p>
      </div>

      {/* ── CAPABILITY TABS ── */}
      <div className="tabs" style={{ marginBottom: "1.5rem", overflowX: "auto" }}>
        {CAPABILITY_TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
            style={{ whiteSpace: "nowrap" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 1. DISCOVERY & REALITY TAB ── */}
      {activeTab === "discovery" && (
        <div>
          {/* Category Filters & Search */}
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
                placeholder="Search role, domain..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: "0.4rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card-bg)" }}
              />
              <button type="submit" className="btn btn-outline btn-sm">
                <FaMagnifyingGlass />
              </button>
            </form>
          </div>

          {/* Compare Prompt Bar */}
          {selectedForCompare.length > 0 && (
            <div style={{ background: "rgba(26,86,219,0.06)", border: "1.5px solid var(--primary)", padding: "0.75rem 1.25rem", borderRadius: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div><strong>{selectedForCompare.length} careers selected</strong> (Compare side-by-side)</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-outline btn-sm" onClick={() => setSelectedForCompare([])}>Clear</button>
                <button className="btn btn-primary btn-sm" onClick={handleRunComparison} disabled={comparing}>
                  <FaScaleBalanced /> {comparing ? "Analyzing..." : "Compare Now"}
                </button>
              </div>
            </div>
          )}

          {/* Cards */}
          {loading ? (
            <div className="empty"><p>Loading careers...</p></div>
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
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
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

                      <div style={{ background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "0.82rem", display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>Starting Salary:</span>
                          <strong>{formatRealityFact(role.reality?.salaryRange?.starting)}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>Job Demand:</span>
                          <span style={{ color: "var(--primary)", fontWeight: 600 }}>{formatRealityFact(role.reality?.demandLevel)}</span>
                        </div>
                      </div>
                    </div>

                    <button className="btn btn-outline btn-sm" onClick={() => setSelectedRole(role)}>
                      View Reality Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 2. CAREER SWITCHING TAB ── */}
      {activeTab === "switch" && (
        <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.75rem" }}>
          <h2 style={{ fontSize: "1.3rem", margin: "0 0 0.5rem" }}>Career Switching & Skill-Gap Analysis</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", margin: "0 0 1.5rem" }}>
            Identify transferable skills, missing prerequisites, and realistic timelines when pivoting to a new domain.
          </p>

          <form onSubmit={handleRunSwitch} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "flex-end", marginBottom: "1.5rem" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Current Background / Career</label>
              <input type="text" value={switchFrom} onChange={(e) => setSwitchFrom(e.target.value)} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Target Pivot Career</label>
              <input type="text" value={switchTo} onChange={(e) => setSwitchTo(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={analyzingSwitch} style={{ height: 42 }}>
              <FaShuffle /> {analyzingSwitch ? "Analyzing..." : "Analyze Transition"}
            </button>
          </form>

          {switchAnalysis && (
            <div style={{ padding: "1.25rem", background: "rgba(26,86,219,0.06)", borderRadius: "0.75rem", fontSize: "0.92rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {switchAnalysis}
            </div>
          )}
        </div>
      )}

      {/* ── 3. CAREER EXPERIMENTS TAB ── */}
      {activeTab === "experiments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.3rem", margin: "0 0 0.5rem" }}>Hands-on Career Experiments</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", margin: "0 0 1rem" }}>
              Experience a micro version of a career before committing education or finances.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              <div style={{ border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
                <span className="branch-tag">Software / Tech</span>
                <h4 style={{ margin: "0.4rem 0" }}>Build a Responsive Web App</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 1rem" }}>
                  Develop a simple task manager or portfolio page using HTML, CSS, and modern JavaScript.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => handleStartExp("Build a Responsive Web App", "Technology")}>
                  Start Experiment
                </button>
              </div>

              <div style={{ border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
                <span className="branch-tag">Creative / Media</span>
                <h4 style={{ margin: "0.4rem 0" }}>Produce a 60-Second Short Film</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 1rem" }}>
                  Write a 1-page script, shoot on a phone camera, and edit using basic cutting software.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => handleStartExp("Produce a 60-Second Short Film", "Filmmaking")}>
                  Start Experiment
                </button>
              </div>

              <div style={{ border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
                <span className="branch-tag">Design / UI</span>
                <h4 style={{ margin: "0.4rem 0" }}>Figma Mobile App Redesign</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 1rem" }}>
                  Redesign your favorite food ordering or ride-sharing app with improved usability.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => handleStartExp("Figma Mobile App Redesign", "UI/UX Design")}>
                  Start Experiment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. FINANCIAL ROI TAB ── */}
      {activeTab === "financial" && (
        <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.75rem" }}>
          <h2 style={{ fontSize: "1.3rem", margin: "0 0 0.5rem" }}>Career Financial & Payback Estimator</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", margin: "0 0 1.5rem" }}>
            Compare approximate education costs against realistic starting salary projections.
          </p>

          <form onSubmit={handleCalculateRoi} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "flex-end", marginBottom: "1.5rem" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Estimated Total Education Cost (INR)</label>
              <input type="number" value={eduCost} onChange={(e) => setEduCost(e.target.value)} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Expected Starting Salary (INR / year)</label>
              <input type="number" value={startingSal} onChange={(e) => setStartingSal(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 42 }}>
              <FaIndianRupeeSign /> Calculate ROI
            </button>
          </form>

          {roiResult && (
            <div style={{ padding: "1.25rem", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "0.75rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Total Investment:</span>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>₹{roiResult.totalEstimatedInvestment?.toLocaleString()}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Estimated Payback Window:</span>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#10b981" }}>~{roiResult.estimatedPaybackMonths} months</div>
                </div>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>{roiResult.disclaimer}</p>
            </div>
          )}
        </div>
      )}

      {/* ── 5. ALUMNI & OUTCOMES TAB ── */}
      {activeTab === "outcomes" && (
        <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.3rem", margin: "0 0 0.5rem" }}>Verified Alumni & Career Outcomes</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", margin: "0 0 1.5rem" }}>
            Real achievements, admissions, and offers recorded by students on Preyeahh.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {outcomes.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No public outcomes published yet.</p>
            ) : (
              outcomes.map((o) => (
                <div key={o._id} style={{ border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span className="branch-tag">{o.outcomeType}</span>
                    <h4 style={{ margin: "0.3rem 0" }}>{o.title}</h4>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      {o.organizationOrInstitution} • {o.student?.name || "Verified Student"}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {new Date(o.outcomeDate).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── 6. TRUST & SAFETY TAB ── */}
      {activeTab === "safety" && (
        <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.75rem", maxWidth: 650 }}>
          <h2 style={{ fontSize: "1.3rem", margin: "0 0 0.5rem" }}>Trust, Safety & Moderation Center</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", margin: "0 0 1.5rem" }}>
            File a confidential moderation report regarding inappropriate conduct, false advice, or credentials.
          </p>

          <form onSubmit={handleSendReport}>
            <div className="form-group">
              <label>Report Reason</label>
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                <option value="Inappropriate behavior">Inappropriate behavior</option>
                <option value="False or misleading career advice">False or misleading career advice</option>
                <option value="Harassment">Harassment</option>
                <option value="Fraud or fake credentials">Fraud or fake credentials</option>
                <option value="Spam">Spam</option>
              </select>
            </div>

            <div className="form-group">
              <label>Additional Details</label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe the incident objectively..."
                style={{ minHeight: 90 }}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              <FaShieldHalved /> Submit Report to Moderation
            </button>
          </form>
        </div>
      )}

      {/* ── DETAIL REALITY MODAL ── */}
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
                  <div>Entry: <strong>{formatRealityFact(selectedRole.reality?.salaryRange?.starting)}</strong></div>
                  <div>Mid-Level: <strong>{formatRealityFact(selectedRole.reality?.salaryRange?.mid)}</strong></div>
                  <div>Senior: <strong>{formatRealityFact(selectedRole.reality?.salaryRange?.experienced)}</strong></div>
                </div>
              </div>

              <div>
                <strong>Practical Entry Timeline:</strong>
                <p style={{ margin: "0.25rem 0", fontSize: "0.88rem", color: "var(--text-muted)" }}>
                  Estimated ~{selectedRole.reality?.timeToEmployabilityMonths || 48} months of education and skill preparation.
                </p>
              </div>

              <div>
                <strong>Career Risks & Honest Realities:</strong>
                <ul style={{ margin: "0.25rem 0", paddingLeft: "1.25rem", fontSize: "0.88rem" }}>
                  {selectedRole.reality?.careerRisks?.length ? (
                    selectedRole.reality.careerRisks.map((r, i) => <li key={i}>{r}</li>)
                  ) : (
                    <>
                      <li>Continuous technical adaptation required.</li>
                      <li>Competitive market for junior positions requiring strong portfolio proof.</li>
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
