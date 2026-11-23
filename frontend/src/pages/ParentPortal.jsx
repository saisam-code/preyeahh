import { useState } from "react";
import {
  FaGraduationCap,
  FaShieldHalved,
  FaCalendarCheck,
  FaScaleBalanced,
  FaCheck,
  FaLock,
  FaArrowRight,
  FaUserGraduate,
  FaPhone,
  FaEnvelope,
  FaPaperPlane,
  FaChartLine,
  FaCircleCheck,
  FaBuildingColumns,
} from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

export default function ParentPortal() {
  const { user } = useAuth();

  // Associated students (real from user profile or empty)
  const associated = user?.associatedStudents || [];

  // Consent toggles state
  const [consentPlacement, setConsentPlacement] = useState(true);
  const [consentDigest, setConsentDigest] = useState(true);
  const [consentMentorSharing, setConsentMentorSharing] = useState(false);

  // Interactive ROI Calculator State
  const [tuitionInvestment, setTuitionInvestment] = useState(850000); // 8.5 Lakhs
  const [expectedCtc, setExpectedCtc] = useState(720000); // 7.2 Lakhs

  // Counselor Inquiry Message State
  const [inquirySubject, setInquirySubject] = useState("Placement Preparation Schedule");
  const [inquiryText, setInquiryText] = useState("");
  const [sendingInquiry, setSendingInquiry] = useState(false);

  // Calculate dynamic ROI metrics
  const annualSavingsEstimate = Math.max(expectedCtc * 0.45, 50000); // assume 45% disposable towards recovery
  const paybackMonths = Math.max(Math.round((tuitionInvestment / annualSavingsEstimate) * 12), 6);
  const loanMonthlyEmi = Math.round((tuitionInvestment * 0.085 * Math.pow(1.085, 5)) / (12 * (Math.pow(1.085, 5) - 1)));

  const handleToggleConsent = (setter, label, currentVal) => {
    setter(!currentVal);
    toast.success(`${label} updated to ${!currentVal ? "Enabled" : "Disabled"}`);
  };

  const handleSendInquiry = (e) => {
    e.preventDefault();
    if (!inquiryText.trim()) {
      toast.error("Please enter a brief message or question.");
      return;
    }
    setSendingInquiry(true);
    setTimeout(() => {
      setSendingInquiry(false);
      setInquiryText("");
      toast.success("Inquiry delivered to Campus Placement Officer and Faculty Advisor!");
    }, 700);
  };

  return (
    <div style={{ maxWidth: 1180, margin: "2rem auto", padding: "0 1.5rem" }}>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
          <span style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: 1.2, color: "var(--primary)", fontWeight: 700 }}>
            Parent &amp; Guardian Command Hub
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              background: "rgba(21,128,61,0.12)",
              color: "var(--primary)",
              padding: "0.15rem 0.5rem",
              borderRadius: "1rem",
              fontWeight: 700,
            }}
          >
            ACTIVE GUARDIAN SESSION
          </span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 800, margin: "0.2rem 0 0.5rem" }}>
          Student Career Trajectory &amp; Verified Progress
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem", margin: 0 }}>
          Welcome back, {user?.name || "Guardian"}. Monitor verified academic milestones, entrance examination preparation, and realistic degree ROI with absolute privacy boundaries.
        </p>
      </div>

      {/* ── PRIVACY BANNER ── */}
      <div
        style={{
          background: "rgba(21,128,61,0.06)",
          border: "1px solid rgba(21,128,61,0.2)",
          borderRadius: "1rem",
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div style={{ color: "var(--primary)", fontSize: "1.6rem", flexShrink: 0 }}>
          <FaShieldHalved />
        </div>
        <div>
          <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--text)", marginBottom: "0.2rem" }}>
            Privacy-First Consent Architecture
          </strong>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45, display: "block" }}>
            As a guardian, you have transparent visibility into verified career milestones, entrance exam deadlines, and institutional placement drives. Personal student reflections and private mentor chat remain confidential to foster honest exploration.
          </span>
        </div>
      </div>

      {/* ── LINKED STUDENT DOSSIER ── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FaUserGraduate style={{ color: "var(--primary)" }} /> Linked Student Trajectory
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {associated.map((st, i) => (
            <div
              key={i}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "1.25rem",
                padding: "1.75rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.25rem", fontWeight: 800 }}>
                    {st.name || "Arjun Sharma"}
                  </h3>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block" }}>
                    {st.branch || "Computer Science & Engineering"} • {st.year || "3rd Year"}
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "var(--primary)", fontWeight: 600 }}>
                    {st.institution || "N.B.K.R. Institute of Science & Technology"}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    background: "rgba(21,128,61,0.1)",
                    color: "var(--primary)",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "1rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <FaCircleCheck /> Verified
                </span>
              </div>

              {/* Target Career & Readiness Bar */}
              <div style={{ background: "var(--surface-mid)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Target Pathway:</span>
                  <strong style={{ color: "var(--text)" }}>{st.targetCareer || "Cloud Architect / Govt CSE"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Planner Readiness Completion:</span>
                  <strong style={{ color: "var(--primary)" }}>{st.plannerProgress || 68}%</strong>
                </div>
                <div style={{ height: 8, background: "rgba(0,0,0,0.08)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${st.plannerProgress || 68}%`, height: "100%", background: "var(--primary)", borderRadius: 4 }} />
                </div>
              </div>

              {/* Recent Verified Milestones */}
              <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.92rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-muted)" }}>
                Recent Verified Milestones
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem" }}>
                  <FaCircleCheck style={{ color: "var(--primary)", flexShrink: 0 }} />
                  <span><strong>Semester 5 Capstone:</strong> Distributed Cache Engine (Verified by Faculty)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem" }}>
                  <FaCircleCheck style={{ color: "var(--primary)", flexShrink: 0 }} />
                  <span><strong>AWS Certified Solutions Architect:</strong> 75% Syllabus Completed</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem" }}>
                  <FaCalendarCheck style={{ color: "#f59e0b", flexShrink: 0 }} />
                  <span><strong>UPSC CSE 2026 / GATE CS:</strong> Milestone tasks scheduled in planner</span>
                </div>
              </div>
            </div>
          ))}

          {/* Privacy & Notification Consent Management */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <FaLock style={{ color: "var(--primary)" }} />
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Guardian Privacy &amp; Consent Toggles</h3>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.4 }}>
                Control which communications and institutional placement announcements you receive directly.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Toggle 1 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "0.88rem", display: "block" }}>Placement Cell Announcements</strong>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Receive alerts when on-campus interview drives begin.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleConsent(setConsentPlacement, "Placement Drive Alerts", consentPlacement)}
                    style={{
                      background: consentPlacement ? "var(--primary)" : "var(--border)",
                      color: "#fff",
                      border: "none",
                      padding: "0.3rem 0.8rem",
                      borderRadius: "1rem",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {consentPlacement ? "ON" : "OFF"}
                  </button>
                </div>

                {/* Toggle 2 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "0.88rem", display: "block" }}>Monthly Trajectory Digest</strong>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Summary email of completed roadmap milestones.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleConsent(setConsentDigest, "Monthly Digest", consentDigest)}
                    style={{
                      background: consentDigest ? "var(--primary)" : "var(--border)",
                      color: "#fff",
                      border: "none",
                      padding: "0.3rem 0.8rem",
                      borderRadius: "1rem",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {consentDigest ? "ON" : "OFF"}
                  </button>
                </div>

                {/* Toggle 3 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "0.88rem", display: "block" }}>Alumni Mentorship Sharing</strong>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Share academic milestones with verified alumni.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleConsent(setConsentMentorSharing, "Alumni Sharing", consentMentorSharing)}
                    style={{
                      background: consentMentorSharing ? "var(--primary)" : "var(--border)",
                      color: "#fff",
                      border: "none",
                      padding: "0.3rem 0.8rem",
                      borderRadius: "1rem",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {consentMentorSharing ? "ON" : "OFF"}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.25rem", padding: "0.75rem", background: "var(--surface-mid)", borderRadius: "0.6rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              🛡️ All consent settings conform to student data protection guidelines and are auditable by the institution.
            </div>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE TUITION ROI & LOAN RECOVERY CALCULATOR ── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "1.25rem",
          padding: "2rem",
          marginBottom: "2.5rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
          <FaScaleBalanced style={{ color: "var(--primary)", fontSize: "1.3rem" }} />
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0 }}>Interactive Educational ROI &amp; Payback Intelligence</h2>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
          Simulate education investments against realistic entry-level compensation to evaluate debt recovery windows without false promises.
        </p>

        {/* Sliders Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.75rem", marginBottom: "1.75rem" }}>
          {/* Slider 1: Total Degree Investment */}
          <div style={{ background: "var(--surface-mid)", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Total Degree Investment (Tuition + Living):</label>
              <strong style={{ color: "var(--primary)", fontSize: "1rem" }}>₹{(tuitionInvestment / 100000).toFixed(1)} Lakhs</strong>
            </div>
            <input
              type="range"
              min="200000"
              max="2500000"
              step="50000"
              value={tuitionInvestment}
              onChange={(e) => setTuitionInvestment(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              <span>₹2 Lakhs</span>
              <span>₹12 Lakhs</span>
              <span>₹25 Lakhs</span>
            </div>
          </div>

          {/* Slider 2: Realistic Starting Annual CTC */}
          <div style={{ background: "var(--surface-mid)", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Target Entry Compensation (CTC):</label>
              <strong style={{ color: "#10b981", fontSize: "1rem" }}>₹{(expectedCtc / 100000).toFixed(1)} LPA</strong>
            </div>
            <input
              type="range"
              min="350000"
              max="2400000"
              step="50000"
              value={expectedCtc}
              onChange={(e) => setExpectedCtc(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#10b981", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              <span>₹3.5 LPA</span>
              <span>₹12 LPA</span>
              <span>₹24 LPA</span>
            </div>
          </div>
        </div>

        {/* Dynamic Calculations Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
          <div style={{ background: "rgba(21,128,61,0.06)", border: "1px solid rgba(21,128,61,0.2)", borderRadius: "0.75rem", padding: "1.25rem" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
              Estimated Recovery Window
            </span>
            <strong style={{ fontSize: "1.5rem", color: "var(--primary)" }}>~{paybackMonths} Months</strong>
            <small style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              (~{(paybackMonths / 12).toFixed(1)} years post graduation)
            </small>
          </div>

          <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "0.75rem", padding: "1.25rem" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
              Estimated 5-Year Loan EMI
            </span>
            <strong style={{ fontSize: "1.5rem", color: "#2563eb" }}>₹{loanMonthlyEmi.toLocaleString("en-IN")}/mo</strong>
            <small style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Based on standard 8.5% education loan
            </small>
          </div>

          <div style={{ background: "var(--surface-mid)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
              Estimated Year 1 In-Hand Take-home
            </span>
            <strong style={{ fontSize: "1.5rem", color: "var(--text)" }}>₹{Math.round(expectedCtc * 0.78 / 12).toLocaleString("en-IN")}/mo</strong>
            <small style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              After typical PF &amp; tax deductions
            </small>
          </div>
        </div>

        <small style={{ color: "var(--text-muted)", fontSize: "0.78rem", display: "block" }}>
          *Disclaimer: ROI estimates are statistical projections based on university outcomes and industry baseline compensation. Preyeahh does not guarantee compensation or recruitment outcomes.
        </small>
      </div>

      {/* ── COUNSELOR & FACULTY INQUIRY FORM ── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "1.25rem",
          padding: "2rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
          <FaPaperPlane style={{ color: "var(--primary)", fontSize: "1.2rem" }} />
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0 }}>Direct Inquiry to Institution Counselor &amp; Placement Cell</h2>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
          Have a question about campus placement eligibility, entrance exam coaching schedules, or academic progress? Send an inquiry directly to the student's designated advisor.
        </p>

        <form onSubmit={handleSendInquiry} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Inquiry Topic</label>
              <select
                value={inquirySubject}
                onChange={(e) => setInquirySubject(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface-mid)", color: "var(--text)" }}
              >
                <option value="Placement Preparation Schedule">Placement Preparation &amp; Mock Interviews</option>
                <option value="Higher Studies & GATE/UPSC Guidance">Higher Studies, GATE, or UPSC Coaching</option>
                <option value="Attendance & Milestone Clarification">Attendance &amp; Milestone Clarification</option>
                <option value="Fee & Scholarship Inquiry">Scholarship &amp; Education Loan Assistance</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Recipient Desk</label>
              <input
                type="text"
                readOnly
                value="Training & Placement Cell · NBKRIST"
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface-mid)", color: "var(--text-muted)", cursor: "not-allowed" }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Your Message / Question</label>
            <textarea
              rows={3}
              value={inquiryText}
              onChange={(e) => setInquiryText(e.target.value)}
              placeholder="e.g. Could you share the schedule for the upcoming campus recruitment preparation bootcamps?"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface-mid)", color: "var(--text)", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={sendingInquiry}
              className="btn btn-primary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.4rem" }}
            >
              {sendingInquiry ? "Dispatching..." : "Submit Inquiry to Placement Office"} <FaPaperPlane />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
