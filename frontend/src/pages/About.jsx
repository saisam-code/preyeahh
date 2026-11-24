import { Link } from "react-router-dom";
import {
  FaLightbulb,
  FaArrowRight,
  FaUsers,
  FaGraduationCap,
  FaCompass,
  FaRocket,
  FaMap,
  FaAward,
  FaBuildingColumns,
  FaChalkboardUser,
  FaBolt,
  FaShieldHalved,
  FaScaleBalanced,
  FaClock,
} from "react-icons/fa6";
import preyeahhLogo from "../assets/preyeahh-logo.png";

export default function About() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      {/* ── ABOUT HERO ── */}
      <section style={{ textAlign: "center", marginBottom: "4rem" }}>
        <img
          src={preyeahhLogo}
          alt="PREYEAHH Logo"
          style={{ width: 64, height: 64, objectFit: "contain", margin: "0 auto 1rem", display: "block" }}
        />
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.35rem 1rem",
            borderRadius: "2rem",
            background: "var(--primary-bg)",
            color: "var(--primary)",
            fontSize: "0.84rem",
            fontWeight: 700,
            marginBottom: "1rem",
          }}
        >
          <FaBolt /> The Career Intelligence & Development Architecture
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            margin: "0 auto 1.25rem",
            maxWidth: 900,
            letterSpacing: "-0.02em",
          }}
        >
          Bridging the chasm between education, skills, and meaningful employment.
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.15rem", maxWidth: 740, margin: "0 auto 2rem", lineHeight: 1.6 }}>
          PREYEAHH exists to transform how young minds discover, evaluate, experiment with, and master
          their long-term professional lives.
        </p>
      </section>

      {/* ── VISION & MISSION ── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
          marginBottom: "4.5rem",
        }}
      >
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "1.25rem",
            padding: "2rem",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "0.75rem",
              background: "var(--primary-bg)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              marginBottom: "1rem",
            }}
          >
            <FaRocket />
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.75rem" }}>Our Vision</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.96rem", lineHeight: 1.6, margin: 0 }}>
            A world where no student is forced to pick a lifelong career based on uninformed guesswork,
            superficial societal pressure, or outdated stereotypes. We envision an educational culture
            where career discovery begins early, experiments precede commitments, and every learner builds
            verifiable proof of their abilities.
          </p>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "1.25rem",
            padding: "2rem",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "0.75rem",
              background: "var(--primary-bg)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              marginBottom: "1rem",
            }}
          >
            <FaCompass />
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.75rem" }}>Our Mission</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.96rem", lineHeight: 1.6, margin: 0 }}>
            To engineer an objective, intelligence-driven career execution platform connecting students,
            parents, experienced guides, and educational institutions. We deliver actionable roadmaps,
            adaptive daily planning, verified micro-experiments, and transparent market realities to cultivate
            autonomous, high-competence professionals.
          </p>
        </div>
      </section>

      {/* ── THE CORE PROBLEMS & WHY EARLY AWARENESS MATTERS ── */}
      <section style={{ marginBottom: "4.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>
          The Deep Root Problems in Modern Career Preparation
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1rem",
              padding: "1.75rem",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", margin: "0 0 0.5rem", color: "var(--text)" }}>
              1. The Late Awareness Crisis
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
              Career discussions typically begin in the final year of college or high school—when major
              academic streams, degrees, and expensive tuition investments are already locked in. By introducing
              radial discovery from Class 6 through undergraduate years, PREYEAHH gives students ample runway to
              explore, test, and find their authentic strengths before high-stakes deadlines arrive.
            </p>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1rem",
              padding: "1.75rem",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", margin: "0 0 0.5rem", color: "var(--text)" }}>
              2. The Theory vs. Market Execution Gap
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
              Rote memorization and exam scores no longer equate to professional readiness. Modern employers
              and research institutions evaluate demonstrable evidence: actual software repositories, prototypes,
              creative portfolios, and verified internship projects. PREYEAHH anchors student roadmaps on
              practical builds rather than passive certificate collection.
            </p>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1rem",
              padding: "1.75rem",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", margin: "0 0 0.5rem", color: "var(--text)" }}>
              3. Unrealistic Financial Expectations
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
              Families frequently make significant financial sacrifices based on exaggerated salary rumors or
              misleading promotional material. PREYEAHH surfaces verified entry-level compensation bands,
              actual prerequisite investments, and payback timelines so families can plan realistically.
            </p>
          </div>
        </div>
      </section>

      {/* ── THE 4 PILLARS OF PREYEAHH'S ECOSYSTEM ── */}
      <section style={{ marginBottom: "5rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Four Unified Ecosystem Roles
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: "2rem" }}>
          Real career transformation requires collective alignment between student ambition, family support,
          mentor guidance, and institutional opportunity.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem" }}>
            <div style={{ color: "var(--primary)", fontSize: "1.5rem", marginBottom: "0.75rem" }}><FaGraduationCap /></div>
            <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: "0.4rem" }}>Students</strong>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              The center of the platform. Empowered with adaptive planning, micro-experiments, roadmaps, and
              verified portfolios from Class 6 to PhD.
            </p>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem" }}>
            <div style={{ color: "var(--primary)", fontSize: "1.5rem", marginBottom: "0.75rem" }}><FaUsers /></div>
            <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: "0.4rem" }}>Parents &amp; Guardians</strong>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Informed allies who receive transparent milestone visibility, financial ROI intelligence, and
              peace of mind through privacy controls.
            </p>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem" }}>
            <div style={{ color: "var(--primary)", fontSize: "1.5rem", marginBottom: "0.75rem" }}><FaChalkboardUser /></div>
            <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: "0.4rem" }}>Guides &amp; Mentors</strong>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Senior alumni and industry practitioners who share pragmatic guidance, review projects, and help
              juniors avoid critical career missteps.
            </p>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem" }}>
            <div style={{ color: "var(--primary)", fontSize: "1.5rem", marginBottom: "0.75rem" }}><FaBuildingColumns /></div>
            <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: "0.4rem" }}>Educational Institutions</strong>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Schools, colleges, and placement cells that orchestrate campus recruitment, track cohort readiness,
              and foster thriving technical clubs.
            </p>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section
        style={{
          background: "var(--surface-mid)",
          border: "1.5px solid var(--border)",
          borderRadius: "1.5rem",
          padding: "3rem 1.5rem",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, margin: "0 0 0.75rem" }}>
          Begin Your Career Development Journey
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: 540, margin: "0 auto 1.75rem" }}>
          Choose your role and step into an intelligent, practical career development universe.
        </p>
        <Link to="/get-started" className="btn btn-primary" style={{ padding: "0.8rem 2.2rem", textDecoration: "none", fontWeight: 600 }}>
          Get Started with PREYEAHH <FaArrowRight />
        </Link>
      </section>
    </div>
  );
}
