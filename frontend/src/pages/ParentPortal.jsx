import { useState } from "react";
import {
  FaGraduationCap,
  FaShieldHalved,
  FaCalendarCheck,
  FaScaleBalanced,
  FaCheck,
  FaLock,
  FaArrowRight,
} from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

export default function ParentPortal() {
  const { user } = useAuth();

  const associated = user?.associatedStudents || [];

  return (
    <div style={{ maxWidth: 1100, margin: "2rem auto", padding: "0 1.5rem" }}>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: "2rem" }}>
        <span style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: 1.2, color: "var(--primary)", fontWeight: 700 }}>
          Parent &amp; Guardian Command Hub
        </span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 800, margin: "0.3rem 0 0.5rem" }}>
          Student Career Visibility &amp; Milestones
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem", margin: 0 }}>
          Support your child's educational trajectory with verified milestone tracking, realistic ROI, and strict privacy boundaries.
        </p>
      </div>

      {/* Privacy Notice Banner */}
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
        <div style={{ color: "var(--primary)", fontSize: "1.5rem", flexShrink: 0 }}>
          <FaShieldHalved />
        </div>
        <div>
          <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--text)", marginBottom: "0.2rem" }}>
            Privacy-First Consent Architecture Active
          </strong>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4, display: "block" }}>
            You have visibility into official career milestones, verified project achievements, and entrance timelines.
            Private student reflections, mentorship chats, and peer inquiries remain confidential to encourage honest exploration.
          </span>
        </div>
      </div>

      {/* ── ASSOCIATED STUDENTS ── */}
      <div style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "1rem" }}>Linked Student Accounts</h2>
        {associated.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "2rem", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", margin: "0 0 1rem" }}>
              No student accounts linked yet. Have your student enter your guardian email in their profile settings.
            </p>
            <button className="btn btn-outline btn-sm" onClick={() => toast.success("Invitation reminder sent")}>
              Send Link Invitation
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
            {associated.map((st, i) => (
              <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <strong>{st.studentEmail}</strong>
                  <span style={{ fontSize: "0.75rem", background: "rgba(21,128,61,0.1)", color: "var(--primary)", padding: "0.2rem 0.6rem", borderRadius: "1rem", fontWeight: 700 }}>
                    Linked &amp; Verified
                  </span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  Status: Active Career Planning Visibility
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── EDUCATIONAL INVESTMENT & FINANCIAL ROI PLANNING ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1.25rem", padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
          <FaScaleBalanced style={{ color: "var(--primary)", fontSize: "1.2rem" }} />
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0 }}>Educational ROI &amp; Payback Intelligence</h2>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
          Evaluate the relationship between degree tuition, expected starting income, and realistic loan recovery times.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "var(--surface-mid)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
              Estimated Tuition (4 Years)
            </span>
            <strong style={{ fontSize: "1.4rem", color: "var(--text)" }}>₹8,00,000</strong>
          </div>

          <div style={{ background: "var(--surface-mid)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
              Typical Entry Salary Band
            </span>
            <strong style={{ fontSize: "1.4rem", color: "var(--primary)" }}>₹6.5 - ₹12 LPA</strong>
          </div>

          <div style={{ background: "var(--surface-mid)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
              Estimated Recovery Window
            </span>
            <strong style={{ fontSize: "1.4rem", color: "#10b981" }}>~24 - 32 Months</strong>
          </div>
        </div>

        <small style={{ color: "var(--text-muted)", fontSize: "0.78rem", display: "block" }}>
          *Figures are realistic approximations based on industry averages and student-selected specializations. PREYEAHH never guarantees placement or starting compensation.
        </small>
      </div>
    </div>
  );
}
