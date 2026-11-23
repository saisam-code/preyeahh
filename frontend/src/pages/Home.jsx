import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaCompass,
  FaCalendarCheck,
  FaGraduationCap,
  FaScaleBalanced,
  FaFlask,
  FaBuildingColumns,
  FaUsers,
  FaArrowRight,
  FaBolt,
  FaChartLine,
  FaCheck,
  FaShieldHalved,
  FaBriefcase,
  FaCamera,
  FaFilm,
  FaCode,
  FaPalette,
  FaMicroscope,
  FaPlaneDeparture,
} from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import Dashboard from "./Dashboard.jsx";

const CAREER_ORBITS = [
  { title: "Filmmaking & Cinema", category: "Unconventional", icon: FaFilm, tag: "Creative Media", starting: "₹4 - ₹8 LPA" },
  { title: "AI & Robotics", category: "Emerging", icon: FaCode, tag: "Technology", starting: "₹8 - ₹18 LPA" },
  { title: "Aviation & Aerospace", category: "Unconventional", icon: FaPlaneDeparture, tag: "Aviation", starting: "₹10 - ₹25 LPA" },
  { title: "Digital Product Design", category: "Emerging", icon: FaPalette, tag: "UI/UX", starting: "₹6 - ₹14 LPA" },
  { title: "Scientific Research", category: "Conventional", icon: FaMicroscope, tag: "R&D", starting: "₹5 - ₹12 LPA" },
  { title: "Visual Storytelling", category: "Unconventional", icon: FaCamera, tag: "Arts", starting: "₹4 - ₹10 LPA" },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If student is logged in, show their student workspace dashboard directly
  if (user && user.role === "student") {
    return <Dashboard />;
  }

  return (
    <div className="home-container" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 1.5rem" }}>
      {/* ── EDITORIAL HERO ── */}
      <section style={{ padding: "5rem 1rem 3.5rem", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1.15rem", borderRadius: "2rem", background: "rgba(21,128,61,0.08)", color: "var(--primary)", fontSize: "0.86rem", fontWeight: 700, marginBottom: "1.5rem", border: "1px solid rgba(21,128,61,0.18)" }}>
            <FaBolt /> For Students from Class 6 to PhD & Career Switchers
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.4rem, 6vw, 4.2rem)", fontWeight: 700, lineHeight: 1.08, margin: "0 auto 1.5rem", maxWidth: 960, letterSpacing: "-0.03em", color: "var(--text)" }}>
            Your future is bigger <br />
            <span style={{ color: "var(--primary)" }}>than one single career path.</span>
          </h1>

          <p style={{ color: "var(--text-muted)", fontSize: "clamp(1.05rem, 2vw, 1.25rem)", maxWidth: 720, margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
            Discover conventional & unconventional professions, experience careers before committing, develop verified skills, and schedule your daily progress.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link to="/get-started" className="btn btn-primary" style={{ padding: "0.9rem 2.2rem", fontSize: "1.05rem", borderRadius: "0.6rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--primary)", color: "#fff", textDecoration: "none", fontWeight: 600 }}>
              Start Your Journey <FaArrowRight />
            </Link>
            <Link to="/discovery" className="btn btn-outline" style={{ padding: "0.9rem 2.2rem", fontSize: "1.05rem", borderRadius: "0.6rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", fontWeight: 600 }}>
              Explore Career Universe
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── NARRATIVE JOURNEY STRIP ── */}
      <section style={{ padding: "2rem 1rem", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", margin: "1rem 0 3.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", maxWidth: 1050, margin: "0 auto", fontSize: "0.82rem", fontWeight: 700, letterSpacing: 0.8, color: "var(--primary)" }}>
          {["DISCOVER", "DECIDE", "EXPERIMENT", "ROADMAP", "LEARN", "BUILD", "PROVE", "OPPORTUNITIES", "MENTORSHIP", "CAREER"].map((step, idx) => (
            <span key={step} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>{step}</span>
              {idx < 9 && <span style={{ color: "var(--border)" }}>→</span>}
            </span>
          ))}
        </div>
      </section>

      {/* ── CAREER UNIVERSE ORBIT CARDS ── */}
      <section style={{ marginBottom: "5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: 1.2, color: "var(--primary)", fontWeight: 700 }}>
              Possibility & Exploration
            </span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 700, margin: "0.25rem 0 0" }}>
              Explore the Career Universe
            </h2>
          </div>
          <Link to="/discovery" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            View all 50+ career realities <FaArrowRight />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {CAREER_ORBITS.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "0.75rem", background: "var(--surface-mid)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                      <Icon />
                    </div>
                    <span className="branch-tag">{c.category}</span>
                  </div>
                  <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.25rem", fontFamily: "var(--font-heading)" }}>{c.title}</h3>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Domain: {c.tag}</div>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.85rem", display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Starting Salary Band:</span>
                  <strong style={{ color: "var(--primary)" }}>{c.starting}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4 CONNECTED ECOSYSTEM PILLARS ── */}
      <section style={{ marginBottom: "5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.3rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
            An Integrated Execution Ecosystem
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: 640, margin: "0 auto" }}>
            Connecting real-world market intelligence, micro-experiments, and daily scheduling.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.75rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(21,128,61,0.1)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "1.25rem" }}>
              <FaCompass />
            </div>
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>Career Reality & Risk</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>
              Verified compensation trajectories, entry costs, industry demand, competition, and risk analysis before investing tuition.
            </p>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.75rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(21,128,61,0.1)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "1.25rem" }}>
              <FaCalendarCheck />
            </div>
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>Personal Career Planner</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>
              <em>"Know your destination. Know your next step. Know when to take it."</em> Adaptive daily timetables that respect your workload.
            </p>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.75rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(21,128,61,0.1)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "1.25rem" }}>
              <FaScaleBalanced />
            </div>
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>Compare & Switch</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>
              Side-by-side comparison of 2 to 4 paths simultaneously. Detailed transferable skill mapping when changing directions.
            </p>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.75rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(21,128,61,0.1)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "1.25rem" }}>
              <FaBuildingColumns />
            </div>
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>Campus Ecosystem</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>
              Placement cells, college clubs, campus workshops, and verified faculty guides with secure backend verification.
            </p>
          </div>
        </div>
      </section>

      {/* ── FINAL EDITORIAL CALLOUT ── */}
      <section style={{ background: "var(--surface-mid)", border: "1px solid var(--border)", borderRadius: "1.5rem", padding: "3.5rem 1.5rem", textAlign: "center", marginBottom: "5rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", fontWeight: 700, margin: "0 0 0.75rem" }}>
          Ready to discover what you can become?
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: 560, margin: "0 auto 2rem" }}>
          Join students, parents, and campus cells building verified competence and career proof.
        </p>
        <Link to="/get-started" className="btn btn-primary" style={{ padding: "0.9rem 2.4rem", fontSize: "1.05rem", borderRadius: "0.6rem", textDecoration: "none", fontWeight: 600 }}>
          Get Started Today
        </Link>
      </section>
    </div>
  );
}
