import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaBuildingColumns,
  FaShieldHalved,
  FaScaleBalanced,
  FaCalendarDays,
  FaBookOpen,
  FaAward,
  FaMagnifyingGlass,
  FaFilter,
  FaFileLines,
  FaCheck,
  FaArrowRight,
  FaXmark,
  FaGraduationCap,
  FaMoneyBillWave,
  FaPlaneDeparture,
  FaTrain,
  FaUserTie,
  FaUserNurse,
  FaWrench,
  FaLandmark,
  FaCircleCheck,
  FaArrowUpRightFromSquare,
  FaPlus,
} from "react-icons/fa6";
import {
  getGovernmentJobs,
  getGovernmentJobBySlug,
  getGovernmentExams,
  getGovernmentNotifications,
  compareGovernmentJobs,
  addExamToPlanner,
} from "../services/governmentCareersService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { EDUCATION_STAGES as CANONICAL_EDUCATION_STAGES } from "../constants/educationStages.js";

const CATEGORIES = [
  { id: "all", label: "All Sectors", icon: FaBuildingColumns },
  { id: "Civil Services & Administration", label: "Civil Services (IAS/IPS)", icon: FaLandmark },
  { id: "Banking & Finance", label: "Banking & Finance (RBI/SBI)", icon: FaMoneyBillWave },
  { id: "Railways", label: "Railways (RRB NTPC/JE)", icon: FaTrain },
  { id: "Defence & Paramilitary", label: "Defence (NDA/CDS/CAPF)", icon: FaShieldHalved },
  { id: "Staff Selection Commission", label: "SSC (CGL/CHSL)", icon: FaFileLines },
  { id: "Engineering & Technical", label: "Engineering (IES/GATE PSU)", icon: FaWrench },
  { id: "Education & Research", label: "Education (UGC NET/TET)", icon: FaGraduationCap },
  { id: "Medical & Healthcare", label: "Medical & Healthcare", icon: FaUserNurse },
  { id: "Public Sector Undertakings", label: "PSUs (ONGC/IOCL/BHEL)", icon: FaBuildingColumns },
  { id: "State Government Jobs", label: "State PSC & Revenue", icon: FaUserTie },
];

const QUALIFICATIONS = [
  "all",
  "Class 10",
  "Class 12",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "B.Tech / B.E.",
  "Any Graduate",
];

const EDUCATION_STAGES = ["all", ...CANONICAL_EDUCATION_STAGES];

export default function GovernmentCareers() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State: "jobs", "syllabus", "notifications", "compare"
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "jobs");

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedQualification, setSelectedQualification] = useState("all");
  const [selectedStage, setSelectedStage] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Data State
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Selected Job for Detailed Modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [targetExamDate, setTargetExamDate] = useState("");
  const [addingToPlanner, setAddingToPlanner] = useState(false);

  // Compare State
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [comparing, setComparing] = useState(false);

  // Load Jobs
  useEffect(() => {
    setLoading(true);
    getGovernmentJobs({
      category: selectedCategory,
      qualification: selectedQualification,
      stage: selectedStage,
      search: searchQuery,
    })
      .then(setJobs)
      .catch(() => toast.error("Could not load government jobs"))
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedQualification, selectedStage, searchQuery]);

  // Load Exams on tab switch
  useEffect(() => {
    if (activeTab === "syllabus" && exams.length === 0) {
      getGovernmentExams().then(setExams).catch(() => {});
    } else if (activeTab === "notifications" && notifications.length === 0) {
      getGovernmentNotifications().then(setNotifications).catch(() => {});
    }
  }, [activeTab, exams.length, notifications.length]);

  // Open Detailed Job Profile
  const handleOpenJobProfile = async (slug) => {
    try {
      const data = await getGovernmentJobBySlug(slug);
      setSelectedJob(data.job);
      setTargetExamDate("");
    } catch {
      toast.error("Failed to load details for this post");
    }
  };

  // Add Exam to Career Planner
  const handleAddToPlanner = async () => {
    if (!user || user.role !== "student") {
      toast.error("Please sign in as a student to integrate exam pathways into your planner");
      return;
    }
    setAddingToPlanner(true);
    try {
      await addExamToPlanner(selectedJob.slug, targetExamDate);
      toast.success(`${selectedJob.title} added to your Career Planner milestones and deadlines!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add to planner");
    } finally {
      setAddingToPlanner(false);
    }
  };

  // Toggle selection for comparison
  const handleToggleCompare = (slug) => {
    if (selectedForCompare.includes(slug)) {
      setSelectedForCompare(selectedForCompare.filter((s) => s !== slug));
    } else {
      if (selectedForCompare.length >= 4) {
        toast.error("You can compare up to 4 roles simultaneously");
        return;
      }
      setSelectedForCompare([...selectedForCompare, slug]);
    }
  };

  // Run Comparison
  const handleRunComparison = async () => {
    if (selectedForCompare.length < 2) {
      toast.error("Select at least 2 roles to compare");
      return;
    }
    setComparing(true);
    try {
      const data = await compareGovernmentJobs(selectedForCompare);
      setComparisonData(data);
      setActiveTab("compare");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to compare roles");
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="government-careers-page" style={{ maxWidth: 1260, margin: "1.5rem auto", padding: "0 1.25rem" }}>
      {/* ── BREADCRUMB & HEADER ── */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: "0.4rem" }}>
          DISCOVER → CAREER PATHS → GOVERNMENT CAREERS
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(var(--font-size-2xl), 4vw, var(--font-size-3xl))", fontWeight: 800, margin: "0.2rem 0 0.5rem" }}>
          India Government Careers &amp; Public Service Intelligence
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-md)", maxWidth: 840, margin: 0, lineHeight: 1.5 }}>
          Explore official central and state government posts, pay matrix scales, multi-stage examination patterns,
          verified syllabus libraries, and integrate competitive preparation into your Personal Career Planner.
        </p>
      </div>

      {/* ── TOP NAV TABS ── */}
      <div className="tabs" style={{ marginBottom: "2rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          className={`tab ${activeTab === "jobs" ? "active" : ""}`}
          onClick={() => { setActiveTab("jobs"); setSearchParams({ tab: "jobs" }); }}
        >
          <FaBuildingColumns /> Government Posts &amp; Careers ({jobs.length})
        </button>
        <button
          className={`tab ${activeTab === "syllabus" ? "active" : ""}`}
          onClick={() => { setActiveTab("syllabus"); setSearchParams({ tab: "syllabus" }); }}
        >
          <FaBookOpen /> Examination &amp; Syllabus Library
        </button>
        <button
          className={`tab ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => { setActiveTab("notifications"); setSearchParams({ tab: "notifications" }); }}
        >
          <FaCalendarDays /> Recruitment Notifications
        </button>
        <button
          className={`tab ${activeTab === "compare" ? "active" : ""}`}
          onClick={() => { setActiveTab("compare"); setSearchParams({ tab: "compare" }); }}
        >
          <FaScaleBalanced /> Career Comparison {selectedForCompare.length > 0 && `(${selectedForCompare.length})`}
        </button>
      </div>

      {/* ── TAB 1: ALL GOVERNMENT CAREERS & POSTS ── */}
      {activeTab === "jobs" && (
        <div>
          {/* Category Chips Bar */}
          <div style={{ display: "flex", gap: "0.6rem", overflowX: "auto", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.5rem 0.9rem",
                    borderRadius: "var(--radius)",
                    border: isSelected ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                    background: isSelected ? "var(--primary-bg)" : "var(--surface)",
                    color: isSelected ? "var(--primary)" : "var(--text)",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon /> {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search & Sub-Filters Row */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1.25rem",
              marginBottom: "1.75rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            {/* Search */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search job title, ministry, exam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.8rem 0.6rem 2.2rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg)" }}
              />
              <FaMagnifyingGlass style={{ position: "absolute", left: 10, top: 13, color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }} />
            </div>

            {/* Minimum Education Filter */}
            <div>
              <label style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem", fontWeight: 600 }}>
                MINIMUM QUALIFICATION
              </label>
              <select
                value={selectedQualification}
                onChange={(e) => setSelectedQualification(e.target.value)}
                style={{ width: "100%", padding: "0.55rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg)" }}
              >
                {QUALIFICATIONS.map((q) => (
                  <option key={q} value={q}>{q === "all" ? "All Qualifications" : q}</option>
                ))}
              </select>
            </div>

            {/* Stage Awareness */}
            <div>
              <label style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem", fontWeight: 600 }}>
                STUDENT STAGE AWARENESS
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                style={{ width: "100%", padding: "0.55rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg)" }}
              >
                {EDUCATION_STAGES.map((s) => (
                  <option key={s} value={s}>{s === "all" ? "All Stages (Class 6 to PhD)" : s}</option>
                ))}
              </select>
            </div>

            {/* Compare Trigger Button */}
            {selectedForCompare.length > 0 && (
              <button
                className="btn btn-primary"
                onClick={handleRunComparison}
                disabled={comparing}
                style={{ height: 42, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              >
                <FaScaleBalanced /> Compare Selected ({selectedForCompare.length})
              </button>
            )}
          </div>

          {/* Jobs List Grid */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>Loading verified government careers...</div>
          ) : jobs.length === 0 ? (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "3rem", textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)" }}>No government posts found matching the selected filters.</p>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => { setSelectedCategory("all"); setSelectedQualification("all"); setSearchQuery(""); }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="government-careers-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: "1.25rem" }}>
              {jobs.map((job) => {
                const isCompared = selectedForCompare.includes(job.slug);
                return (
                  <div
                    key={job._id}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      padding: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", gap: "0.5rem" }}>
                        <span style={{ fontSize: "var(--font-size-xs)", background: "var(--primary-bg)", color: "var(--primary)", padding: "0.2rem 0.6rem", borderRadius: "var(--radius)", fontWeight: 700 }}>
                          {job.category}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontSize: "var(--font-size-xs)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.15rem 0.5rem", color: "var(--text-muted)" }}>
                            {job.group} · {job.gazettedStatus}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 style={{ fontSize: "var(--font-size-lg)", margin: "0 0 0.35rem", fontWeight: 800 }}>
                        {job.title}
                      </h3>
                      <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", marginBottom: "1rem" }}>
                        {job.department}
                      </div>

                      {/* Key Metrics Strip */}
                      <div style={{ background: "var(--surface-mid)", borderRadius: "var(--radius)", padding: "0.75rem 1rem", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", fontSize: "var(--font-size-sm)", marginBottom: "1rem" }}>
                        <div>
                          <span style={{ color: "var(--text-muted)", display: "block" }}>Pay Level &amp; Scale</span>
                          <strong style={{ color: "var(--primary)" }}>{job.salary?.payLevel || "Level 7"}</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-muted)", display: "block" }}>Est. In-Hand Monthly</span>
                          <strong>₹{job.salary?.approxInHandMonthly?.min?.toLocaleString("en-IN")} - ₹{job.salary?.approxInHandMonthly?.max?.toLocaleString("en-IN")}</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-muted)", display: "block" }}>Min Education</span>
                          <strong>{job.eligibility?.minimumEducation}</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-muted)", display: "block" }}>Age Window</span>
                          <strong>{job.eligibility?.minAge} - {job.eligibility?.maxAge} Yrs</strong>
                        </div>
                      </div>

                      <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <FaCircleCheck style={{ color: "var(--primary)" }} />
                        <span>Recruitment Exam: <strong>{job.examination?.examName}</strong> ({job.examination?.conductingBody})</span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleToggleCompare(job.slug)}
                        style={{
                          background: isCompared ? "var(--primary)" : "transparent",
                          color: isCompared ? "var(--on-primary)" : "var(--text)",
                          border: isCompared ? "none" : "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          padding: "0.4rem 0.75rem",
                          fontSize: "var(--font-size-xs)",
                          cursor: "pointer",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                        }}
                      >
                        {isCompared ? <FaCheck /> : <FaPlus />} Compare
                      </button>

                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenJobProfile(job.slug)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 1rem" }}
                      >
                        Detailed Profile <FaArrowRight style={{ fontSize: "var(--font-size-xs)" }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: EXAMINATION & SYLLABUS LIBRARY ── */}
      {activeTab === "syllabus" && (
        <div>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 800, margin: "0 0 0.4rem" }}>
              Multi-Level Examination Syllabus Library
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-md)", margin: 0 }}>
              Examination outlines appear here when verified source records are available.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {exams.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No verified examination syllabus records have been published yet.</p>
            ) : exams.map((ex) => (
              <div key={ex._id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <span style={{ fontSize: "var(--font-size-xs)", background: "var(--primary-bg)", color: "var(--primary)", padding: "0.2rem 0.6rem", borderRadius: "var(--radius)", fontWeight: 700 }}>
                      {ex.examination?.conductingBody}
                    </span>
                    <h3 style={{ fontSize: "var(--font-size-lg)", margin: "0.3rem 0 0.2rem", fontWeight: 800 }}>{ex.examination?.examName}</h3>
                    <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>Target Post: {ex.title} · {ex.department}</div>
                  </div>

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleOpenJobProfile(ex.slug)}
                  >
                    View Full Profile &amp; Strategy
                  </button>
                </div>

                {/* Papers Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
                  {ex.syllabus?.papers?.map((paper, pi) => (
                    <div key={pi} style={{ background: "var(--surface-mid)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <strong style={{ fontSize: "var(--font-size-md)" }}>{paper.paperName}</strong>
                        <span style={{ fontSize: "var(--font-size-xs)", background: "var(--badge-bg)", padding: "0.15rem 0.5rem", borderRadius: "var(--radius)", fontWeight: 700 }}>
                          {paper.totalMarks} Marks
                        </span>
                      </div>
                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                        Type: {paper.questionType} · Negative: {paper.negativeMarking}
                      </div>

                      {/* Subjects & Topics */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {paper.subjects?.map((sub, si) => (
                          <div key={si} style={{ fontSize: "var(--font-size-sm)", borderTop: "1px solid var(--border)", paddingTop: "0.4rem" }}>
                            <span style={{ fontWeight: 600, color: "var(--primary)" }}>{sub.subjectName}</span>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.25rem" }}>
                              {sub.topics?.map((top, ti) => (
                                <span key={ti} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.1rem 0.4rem", fontSize: "var(--font-size-xs)" }}>
                                  {top.topicName}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: ACTIVE & UPCOMING RECRUITMENT NOTIFICATIONS ── */}
      {activeTab === "notifications" && (
        <div>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 800, margin: "0 0 0.4rem" }}>
              Verified Recruitment Notifications &amp; Schedules
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-md)", margin: 0 }}>
              Recruitment notices appear here when current official records have been verified.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
            {notifications.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No verified recruitment notifications have been published yet.</p>
            ) : notifications.map((notif) => (
              <div key={notif._id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", background: "var(--primary-bg)", color: "var(--primary)", padding: "0.2rem 0.6rem", borderRadius: "var(--radius)", fontWeight: 700 }}>
                    {notif.conductingBody}
                  </span>
                  <span style={{ fontSize: "var(--font-size-xs)", background: notif.status === "APPLICATIONS_OPEN" ? "var(--success)" : "var(--warning)", color: "var(--on-success)", padding: "0.2rem 0.6rem", borderRadius: "var(--radius)", fontWeight: 700 }}>
                    {notif.status.replace(/_/g, " ")}
                  </span>
                </div>

                <h3 style={{ fontSize: "var(--font-size-lg)", margin: "0 0 0.4rem", fontWeight: 800 }}>{notif.title}</h3>
                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  Notification No: {notif.notificationNumber || "Official Gazette"} · Year: {notif.recruitmentYear}
                </div>

                {/* Dates Box */}
                <div style={{ background: "var(--surface-mid)", borderRadius: "var(--radius)", padding: "0.75rem", fontSize: "var(--font-size-sm)", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <div><strong>Application Window:</strong> {new Date(notif.importantDates?.applicationStartDate).toLocaleDateString()} to {new Date(notif.importantDates?.applicationEndDate).toLocaleDateString()}</div>
                  <div><strong>Exam Date:</strong> {new Date(notif.importantDates?.examDate).toLocaleDateString()}</div>
                  {notif.totalVacancies && <div><strong>Total Vacancies:</strong> {notif.totalVacancies.toLocaleString("en-IN")} Posts</div>}
                </div>

                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  <strong>Eligibility:</strong> {notif.eligibilitySummary}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                  <a
                    href={notif.officialWebsiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "var(--font-size-xs)", color: "var(--primary)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem", textDecoration: "none" }}
                  >
                    Official Portal <FaArrowUpRightFromSquare style={{ fontSize: "var(--font-size-xs)" }} />
                  </a>

                  {notif.applyOnlineUrl && (
                    <a
                      href={notif.applyOnlineUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: "var(--font-size-xs)", textDecoration: "none" }}
                    >
                      Apply Online
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: SIDE-BY-SIDE CAREER COMPARISON ── */}
      {activeTab === "compare" && (
        <div>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 800, margin: "0 0 0.4rem" }}>
              Side-by-Side Government Career Comparison
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-md)", margin: 0 }}>
              Compare pay matrix scales, examination difficulty, posting stability, and promotional ladders across sectors.
            </p>
          </div>

          {!comparisonData ? (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "3rem", textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)", margin: "0 0 1rem" }}>
                Select 2 to 4 roles from the Government Posts tab to generate a side-by-side analytical comparison.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab("jobs")}>
                Browse Roles to Compare
              </button>
            </div>
          ) : (
            <div>
              {/* Comparison Matrix Table */}
              <div className="government-comparison-table" style={{ overflowX: "auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: "2rem" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-sm)", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border)", background: "var(--surface-mid)" }}>
                      <th style={{ padding: "1rem", width: "20%" }}>Criterion</th>
                      {comparisonData.jobs?.map((j) => (
                        <th key={j.slug} style={{ padding: "1rem" }}>
                          <strong style={{ fontSize: "var(--font-size-md)", display: "block" }}>{j.title}</strong>
                          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>{j.department}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>Cadre Group &amp; Status</td>
                      {comparisonData.jobs?.map((j) => (
                        <td key={j.slug} style={{ padding: "1rem" }}>{j.group} ({j.gazettedStatus})</td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>Pay Level &amp; Basic Pay</td>
                      {comparisonData.jobs?.map((j) => (
                        <td key={j.slug} style={{ padding: "1rem" }}>
                          <strong style={{ color: "var(--primary)" }}>{j.salary?.payLevel}</strong>
                          <div>₹{j.salary?.basicPay?.toLocaleString("en-IN")} Basic</div>
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>In-Hand Monthly Estimate</td>
                      {comparisonData.jobs?.map((j) => (
                        <td key={j.slug} style={{ padding: "1rem" }}>
                          ₹{j.salary?.approxInHandMonthly?.min?.toLocaleString("en-IN")} - ₹{j.salary?.approxInHandMonthly?.max?.toLocaleString("en-IN")}
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>Minimum Qualification</td>
                      {comparisonData.jobs?.map((j) => (
                        <td key={j.slug} style={{ padding: "1rem" }}>{j.eligibility?.minimumEducation}</td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>Age Window (General)</td>
                      {comparisonData.jobs?.map((j) => (
                        <td key={j.slug} style={{ padding: "1rem" }}>{j.eligibility?.minAge} to {j.eligibility?.maxAge} Years</td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>Selection Stages</td>
                      {comparisonData.jobs?.map((j) => (
                        <td key={j.slug} style={{ padding: "1rem" }}>
                          <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                            {j.examination?.selectionStages?.map((st, i) => <li key={i}>{st}</li>)}
                          </ul>
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>Posting &amp; Transfer Liability</td>
                      {comparisonData.jobs?.map((j) => (
                        <td key={j.slug} style={{ padding: "1rem" }}>{j.transferPolicy}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AI Comparative Insights */}
              {comparisonData.aiAnalysis && (
                <div style={{ background: "var(--primary-bg)", border: "1px solid color-mix(in srgb, var(--info) 20%, transparent)", borderRadius: "var(--radius)", padding: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "var(--primary)", fontWeight: 700 }}>
                    <FaScaleBalanced /> AI Career Trade-off Analysis
                  </div>
                  <p style={{ margin: 0, fontSize: "var(--font-size-sm)", lineHeight: 1.6, color: "var(--text)" }}>
                    {comparisonData.aiAnalysis}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── DETAILED JOB PROFILE MODAL ── */}
      {selectedJob && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ position: "absolute", inset: 0, background: "color-mix(in srgb, var(--ink-900) 60%, transparent)" }} onClick={() => setSelectedJob(null)} />
          <div
            style={{
              position: "relative",
              maxWidth: 950,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "var(--surface)",
              borderRadius: "var(--radius)",
              padding: "2rem",
              boxShadow: "0 20px 60px color-mix(in srgb, var(--ink-900) 30%, transparent)",
              zIndex: 1001,
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", background: "var(--primary-bg)", color: "var(--primary)", padding: "0.2rem 0.6rem", borderRadius: "var(--radius)", fontWeight: 700 }}>
                    {selectedJob.category}
                  </span>
                  <span style={{ fontSize: "var(--font-size-xs)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.15rem 0.5rem" }}>
                    {selectedJob.group} · {selectedJob.gazettedStatus}
                  </span>
                  <span style={{ fontSize: "var(--font-size-xs)", background: "var(--success)", color: "var(--on-success)", padding: "0.15rem 0.5rem", borderRadius: "var(--radius)", fontWeight: 700 }}>
                    VERIFIED OFFICIAL
                  </span>
                </div>
                <h2 style={{ fontSize: "var(--font-size-2xl)", margin: "0 0 0.2rem", fontWeight: 800 }}>{selectedJob.title}</h2>
                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>{selectedJob.department} · {selectedJob.ministry}</div>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                style={{ background: "transparent", border: "none", fontSize: "var(--font-size-lg)", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <FaXmark />
              </button>
            </div>

            {/* Overview */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: 700, marginBottom: "0.4rem" }}>Role Overview &amp; Mandate</h3>
              <p style={{ color: "var(--text)", fontSize: "var(--font-size-md)", lineHeight: 1.6, margin: 0 }}>
                {selectedJob.overview}
              </p>
            </div>

            {/* Salary Breakdown Card */}
            <div style={{ background: "var(--surface-mid)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <strong style={{ fontSize: "var(--font-size-md)", color: "var(--primary)" }}>
                  7th CPC Pay Structure: {selectedJob.salary?.payLevel}
                </strong>
                <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>Scale: {selectedJob.salary?.payScale}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", fontSize: "var(--font-size-sm)", marginBottom: "0.8rem" }}>
                <div><strong>Basic Pay:</strong> ₹{selectedJob.salary?.basicPay?.toLocaleString("en-IN")}</div>
                <div><strong>In-Hand Monthly:</strong> ₹{selectedJob.salary?.approxInHandMonthly?.min?.toLocaleString("en-IN")} - ₹{selectedJob.salary?.approxInHandMonthly?.max?.toLocaleString("en-IN")}</div>
                <div><strong>Class X City Gross:</strong> ₹{selectedJob.salary?.approxGrossMonthly?.classXCity?.toLocaleString("en-IN")}</div>
                <div><strong>Class Z City Gross:</strong> ₹{selectedJob.salary?.approxGrossMonthly?.classZCity?.toLocaleString("en-IN")}</div>
              </div>

              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: "0.6rem" }}>
                <strong>Allowances &amp; Benefits:</strong> {selectedJob.salary?.allowances?.join(" • ")}
              </div>
            </div>

            {/* Eligibility & Exam Procedure */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "var(--font-size-md)", color: "var(--primary)" }}>Statutory Eligibility</h4>
                <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "var(--font-size-sm)", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <li><strong>Education:</strong> {selectedJob.eligibility?.minimumEducation} ({selectedJob.eligibility?.requiredSpecialization})</li>
                  <li><strong>Age Limit:</strong> {selectedJob.eligibility?.minAge} to {selectedJob.eligibility?.maxAge} years</li>
                  <li><strong>Final Year Students:</strong> {selectedJob.eligibility?.finalYearEligible ? "Eligible to appear" : "Degree required at application"}</li>
                  <li><strong>Nationality:</strong> {selectedJob.eligibility?.nationality}</li>
                </ul>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "var(--font-size-md)", color: "var(--primary)" }}>Selection Stages ({selectedJob.examination?.conductingBody})</h4>
                <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "var(--font-size-sm)", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {selectedJob.examination?.selectionStages?.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Career Progression Ladder */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: 700, marginBottom: "0.6rem" }}>Promotion Hierarchy</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {selectedJob.careerProgression?.map((p) => (
                  <div key={p.levelOrder} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-mid)", padding: "0.5rem 0.8rem", borderRadius: "var(--radius)", fontSize: "var(--font-size-sm)" }}>
                    <span><strong>Stage {p.levelOrder}:</strong> {p.designation}</span>
                    <span style={{ color: "var(--text-muted)" }}>{p.typicalTimeYears} · {p.payLevel}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Source & Verification Citation */}
            <div style={{ background: "color-mix(in srgb, var(--ink-900) 3%, transparent)", borderRadius: "var(--radius)", padding: "0.75rem 1rem", fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Verified Source: <a href={selectedJob.verification?.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>{selectedJob.verification?.sourceName}</a> · Recruitment Year: {selectedJob.verification?.recruitmentYear} · Verified By: {selectedJob.verification?.verifiedByAdmin}
            </div>

            {/* Action Bar: Add to Planner */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <label style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>Target Exam Date (Optional):</label>
                <input
                  type="date"
                  value={targetExamDate}
                  onChange={(e) => setTargetExamDate(e.target.value)}
                  style={{ padding: "0.4rem 0.6rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: "var(--font-size-sm)" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button className="btn btn-outline" onClick={() => setSelectedJob(null)}>
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddToPlanner}
                  disabled={addingToPlanner}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <FaCalendarDays /> {addingToPlanner ? "Integrating..." : "Add to Career Planner"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
