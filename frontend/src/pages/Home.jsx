import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  FaBookOpen,
  FaAward,
  FaHandshakeAngle,
  FaLightbulb,
} from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import RolePreviewSection from "../components/RolePreviewSection.jsx";
import preyeahhLogo from "../assets/preyeahh-logo.png";

const JOURNEY_STAGES = [
  { step: "01", name: "DISCOVER", title: "Career Discovery", desc: "Spin through 12 major career domains with radial intelligence and discover emerging specializations." },
  { step: "02", name: "DECIDE", title: "Compare & Filter", desc: "Compare multiple career trajectories side-by-side with transparent salary ranges, risks, and educational costs." },
  { step: "03", name: "EXPERIMENT", title: "Micro-Experiments", desc: "Test small, practical prototypes before making major tuition or academic commitments." },
  { step: "04", name: "ROADMAP", title: "Adaptive Roadmaps", desc: "Generate stage-appropriate year-by-year learning paths customized to your current education stage." },
  { step: "05", name: "LEARN", title: "Skill Acquisition", desc: "Acquire verified industry skills through curated resources, interactive roadmaps, and self-assessments." },
  { step: "06", name: "BUILD", title: "Practical Builds", desc: "Develop real-world software, hardware, creative portfolios, or research projects that demonstrate ability." },
  { step: "07", name: "PROVE", title: "Proof & Verification", desc: "Publish a verified portfolio with live links, repositories, and faculty validations that employers trust." },
  { step: "08", name: "OPPORTUNITIES", title: "Curated Openings", desc: "Access stage-appropriate internships, hackathons, merit scholarships, and competitive challenges." },
  { step: "09", name: "MENTORSHIP", title: "Guide Interaction", desc: "Connect with senior alumni and faculty guides for 1-on-1 industry reviews and career advice." },
  { step: "10", name: "CAREER", title: "Targeted Entry", desc: "Transition confidently into high-impact employment, research fellowships, or entrepreneurial ventures." },
  { step: "11", name: "OUTCOME", title: "Long-term Success", desc: "Track alumni milestones and inspire junior cohorts with verifiable career progression stories." },
];

const PROBLEMS_SOLVED = [
  {
    q: "Students choose careers based on guesswork or social pressure",
    a: "PREYEAHH introduces radial discovery across conventional, unconventional, and emerging domains from Class 6 onwards.",
  },
  {
    q: "Tuition is spent without knowing the day-to-day reality of the job",
    a: "Micro-experiments allow students to complete a small practical assignment in 1–2 weeks to test actual interest first.",
  },
  {
    q: "Academic curricula lag behind industry and emerging skill demands",
    a: "Adaptive roadmaps bridge the gap between classroom theory and practical verified portfolio projects.",
  },
  {
    q: "Lack of daily structure leaves students overwhelmed with tasks",
    a: "The Personal Career Planner schedules study, practical building, and rest into an achievable weekly timetable.",
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const dest =
        user.role === "institution" ? "/institution-portal" :
        user.role === "guide" ? "/guide-panel" :
        user.role === "parent" ? "/parent-portal" :
        user.role === "admin" ? "/admin" :
        "/dashboard";
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="home-container" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 1.5rem" }}>
      {/* ── EDITORIAL HERO ── */}
      <section style={{ padding: "4.5rem 1rem 3rem", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.4rem 1.15rem",
              borderRadius: "var(--radius)",
              background: "var(--primary-bg)",
              color: "var(--primary)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 700,
              marginBottom: "1.5rem",
              border: "1px solid color-mix(in srgb, var(--info) 20%, transparent)",
            }}
          >
            <FaBolt /> For Students from Class 6 to PhD, Independent Learners & Career Switchers
          </div>

          <h1
            style={{
              fontFamily: "var(--font-public-heading)",
              fontSize: "clamp(var(--font-size-3xl), 5.5vw, var(--font-size-4xl))",
              fontWeight: 800,
              lineHeight: 1.1,
              margin: "0 auto 1.5rem",
              maxWidth: 960,
              letterSpacing: "-0.03em",
              color: "var(--text)",
            }}
          >
            Discover what you can become. <br />
            <span style={{ color: "var(--primary)" }}>Build the path to get there.</span>
          </h1>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "clamp(var(--font-size-md), 2vw, var(--font-size-lg))",
              maxWidth: 720,
              margin: "0 auto 2.5rem",
              lineHeight: 1.6,
            }}
          >
            PREYEAHH is a long-term career development platform. Discover conventional and unconventional
            disciplines, test careers before committing, develop verified skills, and schedule your daily progress.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link
              to="/get-started"
              className="btn btn-primary"
              style={{
                padding: "0.9rem 2.2rem",
                fontSize: "var(--font-size-md)",
                borderRadius: "var(--radius)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Start Your Journey <FaArrowRight />
            </Link>
            <Link
              to="/about"
              className="btn btn-outline"
              style={{
                padding: "0.9rem 2.2rem",
                fontSize: "var(--font-size-md)",
                borderRadius: "var(--radius)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Learn About PREYEAHH
            </Link>
            <Link
              to="/explore-careers"
              className="btn btn-outline"
              style={{
                padding: "0.9rem 2.2rem",
                fontSize: "var(--font-size-md)",
                borderRadius: "var(--radius)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Explore Careers <FaCompass />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── THE 11-STAGE PREYEAHH JOURNEY ── */}
      <section style={{ margin: "3rem 0 5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              textTransform: "uppercase",
              letterSpacing: 1.4,
              color: "var(--primary)",
              fontWeight: 700,
            }}
          >
            The Continuous Career Architecture
          </span>
          <h2
            style={{
              fontFamily: "var(--font-public-heading)",
              fontSize: "var(--font-size-3xl)",
              fontWeight: 800,
              margin: "0.3rem 0 0.5rem",
            }}
          >
            The Complete PREYEAHH Journey
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-md)", maxWidth: 640, margin: "0 auto" }}>
            Career development is not a one-off placement decision. It is an intentional, iterative lifecycle.
          </p>
        </div>

        {/* Narrative Flow Bar */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
            fontSize: "var(--font-size-xs)",
            fontWeight: 700,
            color: "var(--primary)",
          }}
        >
          {JOURNEY_STAGES.map((s, idx) => (
            <span key={s.name} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <span>{s.name}</span>
              {idx < JOURNEY_STAGES.length - 1 && <span style={{ color: "var(--border)" }}>→</span>}
            </span>
          ))}
        </div>

        {/* Stage Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {JOURNEY_STAGES.map((st) => (
            <div
              key={st.step}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "1.5rem",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "var(--font-size-xs)",
                  fontWeight: 800,
                  color: "var(--primary)",
                  letterSpacing: 1.2,
                  marginBottom: "0.4rem",
                }}
              >
                PHASE {st.step} · {st.name}
              </div>
              <h3 style={{ fontSize: "var(--font-size-lg)", margin: "0 0 0.4rem" }}>{st.title}</h3>
              <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROLE PREVIEWS (EXACTLY 4 PUBLIC ROLES) ── */}
      <RolePreviewSection />

      {/* ── CORE PROBLEMS WE SOLVE ── */}
      <section style={{ margin: "5rem 0" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              textTransform: "uppercase",
              letterSpacing: 1.4,
              color: "var(--primary)",
              fontWeight: 700,
            }}
          >
            Real Career Challenges
          </span>
          <h2
            style={{
              fontFamily: "var(--font-public-heading)",
              fontSize: "var(--font-size-3xl)",
              fontWeight: 800,
              margin: "0.3rem 0 0.5rem",
            }}
          >
            The Gaps in Conventional Career Counselling
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-md)", maxWidth: 640, margin: "0 auto" }}>
            Why superficial aptitude tests and generic search advice fail modern students.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {PROBLEMS_SOLVED.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "1.75rem",
              }}
            >
              <div style={{ color: "var(--danger)", fontWeight: 700, fontSize: "var(--font-size-md)", marginBottom: "0.5rem" }}>
                Problem: {item.q}
              </div>
              <div
                style={{
                  color: "var(--text)",
                  fontSize: "var(--font-size-sm)",
                  lineHeight: 1.5,
                  paddingTop: "0.5rem",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <strong style={{ color: "var(--primary)" }}>PREYEAHH Solution: </strong>
                {item.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section
        style={{
          background: "var(--surface-mid)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "3.5rem 1.5rem",
          textAlign: "center",
          marginBottom: "5rem",
        }}
      >
        <img
          src={preyeahhLogo}
          alt="PREYEAHH Logo"
          style={{ width: 56, height: 56, objectFit: "contain", margin: "0 auto 1rem", display: "block" }}
        />
        <h2 style={{ fontFamily: "var(--font-public-heading)", fontSize: "var(--font-size-3xl)", fontWeight: 800, margin: "0 0 0.75rem" }}>
          Ready to discover what you can become?
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-md)", maxWidth: 580, margin: "0 auto 2rem" }}>
          Join students, parents, guides, and educational institutions on the modern career development universe.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Link
            to="/get-started"
            className="btn btn-primary"
            style={{
              padding: "0.85rem 2.2rem",
              fontSize: "var(--font-size-md)",
              borderRadius: "var(--radius)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Get Started Now
          </Link>
          <Link
            to="/login"
            className="btn btn-outline"
            style={{
              padding: "0.85rem 2.2rem",
              fontSize: "var(--font-size-md)",
              borderRadius: "var(--radius)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Sign In to Workspace
          </Link>
        </div>
      </section>
    </div>
  );
}
