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
} from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import Dashboard from "./Dashboard.jsx";
import preyeahhLogo from "../assets/preyeahh-logo.png";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If student is logged in, show their student workspace dashboard directly
  if (user && user.role === "student") {
    return <Dashboard />;
  }

  return (
    <div className="home-container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
      {/* ── HERO SECTION ── */}
      <section style={{ textAlign: "center", padding: "4rem 1rem 3rem" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 1rem", borderRadius: "2rem", background: "rgba(26,86,219,0.08)", color: "var(--primary)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "1.25rem" }}>
            <FaBolt /> For Students from Class 6 to PhD & Career Switchers
          </div>

          <h1 style={{ fontSize: "3.2rem", fontWeight: 800, lineHeight: 1.15, margin: "0 auto 1.25rem", maxWidth: 880, letterSpacing: "-0.02em" }}>
            Discover what you can become. <br />
            <span style={{ color: "var(--primary)" }}>Build the skills to get there.</span>
          </h1>

          <p style={{ color: "var(--text-muted)", fontSize: "1.2rem", maxWidth: 680, margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
            From exploring conventional & unconventional careers to planning your daily actions, Preyeahh turns career ambitions into a practical, verified development journey.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link to="/get-started" className="btn btn-primary" style={{ padding: "0.85rem 2rem", fontSize: "1.05rem", borderRadius: "0.6rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              Get Started <FaArrowRight />
            </Link>
            <Link to="/discovery" className="btn btn-outline" style={{ padding: "0.85rem 2rem", fontSize: "1.05rem", borderRadius: "0.6rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              Explore Careers
            </Link>
            <Link to="/get-started" className="btn btn-outline" style={{ padding: "0.85rem 1.75rem", fontSize: "1.05rem", borderRadius: "0.6rem" }}>
              For Institutions
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── CORE JOURNEY PROGRESSION ── */}
      <section style={{ padding: "2.5rem 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 1.2, color: "var(--text-muted)", fontWeight: 700 }}>
            The Preyeahh Career Journey
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", maxWidth: 1000, margin: "0 auto", fontSize: "0.82rem", fontWeight: 700, color: "var(--primary)" }}>
          {["DISCOVER", "DECIDE", "EXPERIMENT", "ROADMAP", "LEARN", "BUILD", "PROVE", "OPPORTUNITIES", "MENTORSHIP", "CAREER"].map((step, idx) => (
            <span key={step} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>{step}</span>
              {idx < 9 && <span style={{ color: "var(--border)" }}>→</span>}
            </span>
          ))}
        </div>
      </section>

      {/* ── 4 CORE PILLARS ── */}
      <section style={{ padding: "4rem 0" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, margin: "0 0 0.5rem" }}>
            A Complete Career Development Ecosystem
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: 600, margin: "0 auto" }}>
            Not an AI chatbot or simple job board — an execution platform connecting daily actions to your future.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
          <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.75rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(26,86,219,0.1)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "1rem" }}>
              <FaCompass />
            </div>
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>Career Reality & Discovery</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.5, margin: 0 }}>
              Conventional & unconventional careers with verified salary ranges, real industry demand, competition, and education entry costs.
            </p>
          </div>

          <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.75rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(16,185,129,0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "1rem" }}>
              <FaCalendarCheck />
            </div>
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>Personal Career Planner</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.5, margin: 0 }}>
              <em>"Know your destination. Know your next step. Know when to take it."</em> Connects long-term milestones with realistic daily timetables.
            </p>
          </div>

          <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.75rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(245,158,11,0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "1rem" }}>
              <FaScaleBalanced />
            </div>
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>Experiments & Compare</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.5, margin: 0 }}>
              Compare 2 to 4 careers simultaneously. Experience mini career experiments before committing time or educational finances.
            </p>
          </div>

          <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.75rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(139,92,246,0.1)", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "1rem" }}>
              <FaBuildingColumns />
            </div>
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>Institution Ecosystem</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.5, margin: 0 }}>
              Schools and colleges connect placement cells, clubs, workshops, and verified faculty guides with secure backend association.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER CALLOUT ── */}
      <section style={{ background: "var(--primary-bg, rgba(26,86,219,0.06))", border: "1px solid var(--border)", borderRadius: "1.5rem", padding: "3rem 1.5rem", textAlign: "center", marginBottom: "4rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.75rem" }}>
          Ready to discover your potential?
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: 540, margin: "0 auto 1.75rem" }}>
          Join thousands of learners discovering what they can become and building proof of their competence.
        </p>
        <Link to="/get-started" className="btn btn-primary" style={{ padding: "0.85rem 2.2rem", fontSize: "1.05rem", borderRadius: "0.6rem" }}>
          Get Started Today
        </Link>
      </section>
    </div>
  );
}
