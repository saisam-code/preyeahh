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
} from "react-icons/fa6";
import {
  discoverCareers,
  compareCareers,
  analyzeCareerSwitch,
  calculateFinancialRoi,
  getPublicOutcomes,
  getCareerReality,
  startExperiment,
  getStudentExperiments,
  completeExperiment,
  submitReport,
} from "../services/careerIntelligenceService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { CAREER_DOMAINS } from "../data/careerWheelData.js";
import { EDUCATION_STAGES } from "../constants/educationStages.js";

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("discovery");
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("all");
  const [stage, setStage] = useState("all");
  const [currentSkills, setCurrentSkills] = useState(() =>
    (user?.preferences?.skills || []).map((skill) => typeof skill === "string" ? skill : skill?.name).filter(Boolean).join(", ")
  );
  const [wantedSkills, setWantedSkills] = useState(() =>
    (user?.preferences?.strengths || []).join(", ")
  );

  // Compare mode
  const [selectedForCompare, setSelectedForCompare] = useState([]);
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
  const [studentExperiments, setStudentExperiments] = useState([]);
  const [experimentReflection, setExperimentReflection] = useState({});

  // Report state
  const [reportReason, setReportReason] = useState("Inappropriate behavior");
  const [reportDetails, setReportDetails] = useState("");

  const loadCareers = async () => {
    try {
      setLoading(true);
      const data = await discoverCareers({
        category,
        search,
        skills: currentSkills,
        wantedSkills,
        domain,
        stage,
      });
      setRoles(data || []);
    } catch {
      toast.error("Failed to fetch careers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCareers();
    // Structured filters trigger automatically; search is submitted explicitly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, domain, stage]);

  useEffect(() => {
    if (activeTab === "outcomes") {
      getPublicOutcomes().then(setOutcomes).catch(() => {});
    }
    if (activeTab === "experiments" && user) {
      getStudentExperiments().then(setStudentExperiments).catch(() => {});
    }
  }, [activeTab, user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCareers();
  };

  const openCareerReality = async (role) => {
    try {
      const reality = await getCareerReality(role._id);
      setSelectedRole(reality);
    } catch {
      setSelectedRole(role);
      toast.error("Full verified details could not be loaded; showing the discovery record.");
    }
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
      await compareCareers(selectedForCompare);
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
      const res = await analyzeCareerSwitch({
        currentCareer: switchFrom,
        targetCareer: switchTo,
        currentSkills: currentSkills ? currentSkills.split(",").map((skill) => skill.trim()).filter(Boolean) : [],
      });
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
      if (user) {
        getStudentExperiments().then(setStudentExperiments).catch(() => {});
      }
      toast.success("Experiment added to your active planner!");
    } catch {
      toast.error("Please login as a student to start career experiments");
    }
  };

  const handleCompleteExperiment = async (experimentId) => {
    const reflection = experimentReflection[experimentId] || {};
    try {
      const updated = await completeExperiment(experimentId, {
        evidenceUrl: reflection.evidenceUrl || "",
        reflectionNotes: reflection.reflectionNotes || "",
        skillsGained: (reflection.skillsGained || "").split(",").map((skill) => skill.trim()).filter(Boolean),
        rating: reflection.rating ? Number(reflection.rating) : undefined,
        enjoyed: reflection.enjoyed || "",
        difficultyNotes: reflection.difficultyNotes || "",
        wouldContinue: reflection.wouldContinue || "",
        nextStepRecommendation: reflection.nextStepRecommendation || "",
      });
      setStudentExperiments((current) => current.map((item) => item._id === experimentId ? updated : item));
      toast.success("Experiment reflection saved.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not complete the experiment.");
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
        <span style={{ fontSize: "var(--font-size-xs)", textTransform: "uppercase", letterSpacing: 1, color: "var(--primary)", fontWeight: 700 }}>
          PREYEAHH CAREER INTELLIGENCE SUITE
        </span>
        <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: 800, margin: "0.2rem 0" }}>
          Explore Careers & Reality Intelligence
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "var(--font-size-md)" }}>
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
          <div className="career-filter-row" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
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

            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              aria-label="Career domain"
              style={{ minWidth: 210, padding: "0.45rem 0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text)" }}
            >
              <option value="all">All domains</option>
              {CAREER_DOMAINS.map((item) => (
                <option key={item.id} value={item.title}>{item.title}</option>
              ))}
            </select>

            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              aria-label="Education stage"
              style={{ minWidth: 180, padding: "0.45rem 0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text)" }}
            >
              <option value="all">All education stages</option>
              {EDUCATION_STAGES.filter((item) => !item.includes(" / ")).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <form className="career-search-form" onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder="Search role, domain..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: "0.4rem 0.8rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--card-bg)" }}
              />
              <button type="submit" className="btn btn-outline btn-sm">
                <FaMagnifyingGlass />
              </button>
            </form>
            <form className="career-skills-form" onSubmit={handleSearchSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", flexBasis: "100%" }}>
              <input
                type="text"
                value={currentSkills}
                onChange={(e) => setCurrentSkills(e.target.value)}
                placeholder="Current skills: Python, Mathematics"
                aria-label="Current skills"
                style={{ padding: "0.4rem 0.8rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--card-bg)" }}
              />
              <input
                type="text"
                value={wantedSkills}
                onChange={(e) => setWantedSkills(e.target.value)}
                placeholder="Skills you want to learn"
                aria-label="Skills to learn"
                style={{ padding: "0.4rem 0.8rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--card-bg)" }}
              />
            </form>
          </div>

          {/* Compare Prompt Bar */}
          {selectedForCompare.length > 0 && (
            <div style={{ background: "var(--primary-bg)", border: "1.5px solid var(--primary)", padding: "0.75rem 1.25rem", borderRadius: "var(--radius)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
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
                      background: "var(--surface)",
                      border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                      borderRadius: "var(--radius)",
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
                            color: isSelected ? "var(--on-primary)" : "var(--text-muted)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius)",
                            padding: "0.2rem 0.5rem",
                            fontSize: "var(--font-size-xs)",
                            cursor: "pointer",
                          }}
                        >
                          {isSelected ? "Selected" : "+ Compare"}
                        </button>
                      </div>

                      <h3 style={{ margin: "0.2rem 0", fontSize: "var(--font-size-lg)" }}>{role.title}</h3>
                      <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                        {role.domain || "Engineering & Tech"}
                      </div>

                      <div style={{ background: "color-mix(in srgb, var(--ink-900) 2%, transparent)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.75rem", fontSize: "var(--font-size-sm)", display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>Starting Salary:</span>
                          <strong>{formatRealityFact(role.reality?.salaryRange?.starting)}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>Job Demand:</span>
                          <span style={{ color: "var(--primary)", fontWeight: 600 }}>{formatRealityFact(role.reality?.demandLevel)}</span>
                        </div>
                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.35rem" }}>
                          <span style={{ color: "var(--text-muted)" }}>Why this may fit:</span>{" "}
                          <strong>{role.skillMatch?.explanation || "No structured skill match is available yet."}</strong>
                        </div>
                        {role.skillMatch?.missingSkills?.length > 0 && (
                          <div>
                            <span style={{ color: "var(--text-muted)" }}>Skills to develop:</span>{" "}
                            {role.skillMatch.missingSkills.slice(0, 3).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>

                    <button className="btn btn-outline btn-sm" onClick={() => openCareerReality(role)}>
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
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.75rem" }}>
          <h2 style={{ fontSize: "var(--font-size-lg)", margin: "0 0 0.5rem" }}>Career Switching & Skill-Gap Analysis</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", margin: "0 0 1.5rem" }}>
            Identify transferable skills, missing prerequisites, and realistic timelines when pivoting to a new domain.
          </p>

          <form className="career-switch-form" onSubmit={handleRunSwitch} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "flex-end", marginBottom: "1.5rem" }}>
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
            <div style={{ padding: "1.25rem", background: "var(--primary-bg)", borderRadius: "var(--radius)", fontSize: "var(--font-size-sm)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {switchAnalysis}
            </div>
          )}
        </div>
      )}

      {/* ── 3. CAREER EXPERIMENTS TAB ── */}
      {activeTab === "experiments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "var(--font-size-lg)", margin: "0 0 0.5rem" }}>Hands-on Career Experiments</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", margin: "0 0 1rem" }}>
              Experience a micro version of a career before committing education or finances.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem" }}>
                <span className="branch-tag">Software / Tech</span>
                <h4 style={{ margin: "0.4rem 0" }}>Build a Responsive Web App</h4>
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", margin: "0 0 1rem" }}>
                  Develop a simple task manager or portfolio page using HTML, CSS, and modern JavaScript.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => handleStartExp("Build a Responsive Web App", "Technology")}>
                  Start Experiment
                </button>
              </div>

              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem" }}>
                <span className="branch-tag">Creative / Media</span>
                <h4 style={{ margin: "0.4rem 0" }}>Produce a 60-Second Short Film</h4>
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", margin: "0 0 1rem" }}>
                  Write a 1-page script, shoot on a phone camera, and edit using basic cutting software.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => handleStartExp("Produce a 60-Second Short Film", "Filmmaking")}>
                  Start Experiment
                </button>
              </div>

              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem" }}>
                <span className="branch-tag">Design / UI</span>
                <h4 style={{ margin: "0.4rem 0" }}>Figma Mobile App Redesign</h4>
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", margin: "0 0 1rem" }}>
                  Redesign your favorite food ordering or ride-sharing app with improved usability.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => handleStartExp("Figma Mobile App Redesign", "UI/UX Design")}>
                  Start Experiment
                </button>
              </div>
            </div>

            {user && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem" }}>
                <h2 style={{ fontSize: "var(--font-size-lg)", margin: "0 0 0.75rem" }}>My experiment reflections</h2>
                {studentExperiments.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>No experiments started yet.</p>
                ) : (
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {studentExperiments.map((experiment) => {
                      const reflection = experimentReflection[experiment._id] || {};
                      const setReflection = (field, value) => setExperimentReflection((current) => ({
                        ...current,
                        [experiment._id]: { ...current[experiment._id], [field]: value },
                      }));
                      return (
                        <div key={experiment._id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                            <strong>{experiment.experimentTitle}</strong>
                            <span className="branch-tag">{experiment.status.replaceAll("_", " ")}</span>
                          </div>
                          {experiment.status !== "completed" ? (
                            <div style={{ display: "grid", gap: "0.65rem", marginTop: "0.75rem" }}>
                              <input value={reflection.evidenceUrl || ""} onChange={(e) => setReflection("evidenceUrl", e.target.value)} placeholder="Evidence URL (optional)" />
                              <input value={reflection.skillsGained || ""} onChange={(e) => setReflection("skillsGained", e.target.value)} placeholder="Skills gained (comma separated)" />
                              <textarea value={reflection.reflectionNotes || ""} onChange={(e) => setReflection("reflectionNotes", e.target.value)} placeholder="What did you learn?" style={{ minHeight: 70 }} />
                              <input value={reflection.difficultyNotes || ""} onChange={(e) => setReflection("difficultyNotes", e.target.value)} placeholder="What was difficult?" />
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.5rem" }}>
                                <select value={reflection.enjoyed || ""} onChange={(e) => setReflection("enjoyed", e.target.value)}>
                                  <option value="">Did you enjoy it?</option><option value="yes">Yes</option><option value="unsure">Unsure</option><option value="no">No</option>
                                </select>
                                <select value={reflection.wouldContinue || ""} onChange={(e) => setReflection("wouldContinue", e.target.value)}>
                                  <option value="">Would you continue?</option><option value="yes">Yes</option><option value="unsure">Unsure</option><option value="no">No</option>
                                </select>
                                <select value={reflection.rating || ""} onChange={(e) => setReflection("rating", e.target.value)}>
                                  <option value="">Rating</option>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value}/5</option>)}
                                </select>
                              </div>
                              <input value={reflection.nextStepRecommendation || ""} onChange={(e) => setReflection("nextStepRecommendation", e.target.value)} placeholder="Recommended next step (optional)" />
                              <button type="button" className="btn btn-primary btn-sm" style={{ justifySelf: "start" }} onClick={() => handleCompleteExperiment(experiment._id)}>Save reflection & complete</button>
                            </div>
                          ) : (
                            <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", marginTop: "0.65rem" }}>
                              {experiment.reflectionNotes || "Completed"}{experiment.wouldContinue ? ` · Continue: ${experiment.wouldContinue}` : ""}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. FINANCIAL ROI TAB ── */}
      {activeTab === "financial" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.75rem" }}>
          <h2 style={{ fontSize: "var(--font-size-lg)", margin: "0 0 0.5rem" }}>Career Financial & Payback Estimator</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", margin: "0 0 1.5rem" }}>
            Compare approximate education costs against realistic starting salary projections.
          </p>

          <form className="career-roi-form" onSubmit={handleCalculateRoi} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "flex-end", marginBottom: "1.5rem" }}>
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
            <div style={{ padding: "1.25rem", background: "color-mix(in srgb, var(--success) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--success) 20%, transparent)", borderRadius: "var(--radius)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <span style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>Total Investment:</span>
                  <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 700 }}>₹{roiResult.totalEstimatedInvestment?.toLocaleString()}</div>
                </div>
                <div>
                  <span style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>Estimated Payback Window:</span>
                  <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--success)" }}>~{roiResult.estimatedPaybackMonths} months</div>
                </div>
              </div>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", margin: 0 }}>{roiResult.disclaimer}</p>
            </div>
          )}
        </div>
      )}

      {/* ── 5. ALUMNI & OUTCOMES TAB ── */}
      {activeTab === "outcomes" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "var(--font-size-lg)", margin: "0 0 0.5rem" }}>Verified Alumni & Career Outcomes</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", margin: "0 0 1.5rem" }}>
            Real achievements, admissions, and offers recorded by students on Preyeahh.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {outcomes.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No public outcomes published yet.</p>
            ) : (
              outcomes.map((o) => (
                <div key={o._id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span className="branch-tag">{o.outcomeType}</span>
                    <h4 style={{ margin: "0.3rem 0" }}>{o.title}</h4>
                    <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>
                      {o.organizationOrInstitution} • {o.student?.name || "Verified Student"}
                    </div>
                  </div>
                  <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>
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
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.75rem", maxWidth: 650 }}>
          <h2 style={{ fontSize: "var(--font-size-lg)", margin: "0 0 0.5rem" }}>Trust, Safety & Moderation Center</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", margin: "0 0 1.5rem" }}>
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
          <div className="modal-card career-reality-modal" style={{ maxWidth: 650, padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>Career Reality: {selectedRole.title}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedRole(null)}>Close</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ padding: "0.85rem", background: "var(--primary-bg)", borderRadius: "var(--radius)" }}>
                <strong>Salary & Income Trajectory (Estimated INR):</strong>
                <div style={{ marginTop: "0.35rem", fontSize: "var(--font-size-sm)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  <div>Entry: <strong>{formatRealityFact(selectedRole.reality?.salaryRange?.starting)}</strong></div>
                  <div>Mid-Level: <strong>{formatRealityFact(selectedRole.reality?.salaryRange?.mid)}</strong></div>
                  <div>Senior: <strong>{formatRealityFact(selectedRole.reality?.salaryRange?.experienced)}</strong></div>
                </div>
              </div>

              <div>
                <strong>Practical Entry Timeline:</strong>
                <p style={{ margin: "0.25rem 0", fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>
                  {selectedRole.reality?.timeToEmployabilityMonths
                    ? `Approximately ${selectedRole.reality.timeToEmployabilityMonths} months in published records.`
                    : "No verified entry timeline is available yet."}
                </p>
              </div>

              <div>
                <strong>Verification:</strong>
                <p style={{ margin: "0.25rem 0", fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>
                  {selectedRole.verification?.status || "UNVERIFIED"}
                  {selectedRole.verification?.sourceName ? ` · ${selectedRole.verification.sourceName}` : ""}
                </p>
                {selectedRole.verification?.sourceUrl && (
                  <a href={selectedRole.verification.sourceUrl} target="_blank" rel="noopener noreferrer" className="resource-link">
                    View source
                  </a>
                )}
              </div>

              {selectedRole.pathwaySkills?.length > 0 && (
                <div>
                  <strong>Skills in this pathway:</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                    {selectedRole.pathwaySkills.map((skill) => (
                      <span key={skill} className="branch-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedRole.learningResources?.length > 0 && (
                <div>
                  <strong>Learning resources:</strong>
                  <ul style={{ margin: "0.25rem 0", paddingLeft: "1.25rem", fontSize: "var(--font-size-sm)" }}>
                    {selectedRole.learningResources.slice(0, 6).map((resource) => (
                      <li key={resource._id}>
                        {resource.url
                          ? <a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.title}</a>
                          : resource.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedRole.experiments?.length > 0 && (
                <div>
                  <strong>Small career experiments:</strong>
                  <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.5rem" }}>
                    {selectedRole.experiments.slice(0, 4).map((experiment) => (
                      <div key={experiment._id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.65rem" }}>
                        <strong style={{ fontSize: "var(--font-size-sm)" }}>{experiment.title}</strong>
                        <div style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>
                          {experiment.objective}
                          {experiment.estimatedHours ? ` · ~${experiment.estimatedHours} hours` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRole.opportunities?.length > 0 && (
                <div>
                  <strong>Relevant opportunities:</strong>
                  <ul style={{ margin: "0.25rem 0", paddingLeft: "1.25rem", fontSize: "var(--font-size-sm)" }}>
                    {selectedRole.opportunities.slice(0, 6).map((opportunity) => (
                      <li key={opportunity._id}>
                        {opportunity.officialUrl
                          ? <a href={opportunity.officialUrl} target="_blank" rel="noopener noreferrer">{opportunity.title}</a>
                          : opportunity.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <strong>Career Risks & Honest Realities:</strong>
                <ul style={{ margin: "0.25rem 0", paddingLeft: "1.25rem", fontSize: "var(--font-size-sm)" }}>
                  {selectedRole.reality?.careerRisks?.length ? (
                    selectedRole.reality.careerRisks.map((r, i) => <li key={i}>{r}</li>)
                  ) : (
                    <li>No verified career risks have been published yet.</li>
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
