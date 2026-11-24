import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUserGraduate,
  FaUsers,
  FaChalkboardUser,
  FaBuildingColumns,
  FaArrowRight,
  FaCheck,
  FaCompass,
  FaCalendarCheck,
  FaMap,
  FaFileCode,
  FaAward,
  FaShieldHalved,
  FaHandshake,
  FaBullhorn,
  FaLock,
  FaEye,
  FaClock,
} from "react-icons/fa6";

const ROLE_PREVIEWS = [
  {
    id: "student",
    title: "Student",
    subtitle: "Class 6 to PhD & Career Switchers",
    icon: FaUserGraduate,
    badge: "Student Experience",
    headline: "Know your destination. Know your next step. Know when to take it.",
    description:
      "Explore 12 career domains with radial intelligence, test careers through micro-experiments before tuition investment, generate personalized year-by-year roadmaps, and balance study with adaptive daily timetables.",
    capabilities: [
      "Interactive 12-domain radial career wheel with real salary & barrier data",
      "Career reality intelligence: verified compensation bands, risks & hidden costs",
      "Micro-experiments: validate interest with small practical builds before committing",
      "Adaptive career planner: dynamic daily scheduling calibrated to your weekly hours",
      "Public verified portfolio: showcase actual projects, repositories & proof of skill",
      "Curated opportunities: stage-appropriate scholarships, hackathons & internships",
    ],
    demoInterface: {
      type: "student",
      mockName: "Aarav Sharma",
      mockBranch: "Computer Science & Engineering",
      mockStage: "3rd Year Undergraduate",
      mockTarget: "Autonomous Robotics & AI Engineer",
      metric1: { label: "Weekly Progress", val: "84%" },
      metric2: { label: "Completed Experiments", val: "4 of 5" },
      metric3: { label: "Verified Projects", val: "3 Active" },
      sampleItemTitle: "ROS2 & SLAM Autonomous Navigation Prototype",
      sampleItemSub: "Experiment Phase 2 · Verified with GitHub repo & video demonstration",
    },
    ctaText: "Get Started as a Student",
    ctaLink: "/get-started?role=student",
  },
  {
    id: "parent",
    title: "Parent / Guardian",
    subtitle: "Family Career Alignment & Clarity",
    icon: FaUsers,
    badge: "Parent / Guardian Experience",
    headline: "Understand educational ROI and support your child's journey safely.",
    description:
      "Stay connected to your student's career trajectory without micromanaging. Access permission-based milestone visibility, transparent education cost & payback calculators, and privacy-first consent controls.",
    capabilities: [
      "Consent-based progress visibility: view high-level milestones and career goals",
      "Financial ROI & cost breakdown: realistic educational investment payback estimates",
      "Roadmap milestones: understand semester-by-semester academic & skill objectives",
      "Safe boundary enforcement: no intrusive surveillance of private student notes or chats",
      "Verified opportunities awareness: discover scholarships and recognized entrance timelines",
    ],
    demoInterface: {
      type: "parent",
      mockName: "Sunita & Rajesh Sharma (Parents)",
      mockBranch: "Linked to: Aarav Sharma",
      mockStage: "Parent Access Verified",
      mockTarget: "Current Track: Robotics & Autonomous Systems",
      metric1: { label: "Semester Goal Track", val: "On Schedule" },
      metric2: { label: "Tuition ROI Window", val: "~22 Months" },
      metric3: { label: "Privacy Status", val: "Consent Active" },
      sampleItemTitle: "Upcoming Milestone: Industrial Summer Internship Drive",
      sampleItemSub: "College Placement & Career Development Cell Timeline · Starts June 2027",
    },
    ctaText: "Get Started as a Parent",
    ctaLink: "/get-started?role=parent",
  },
  {
    id: "guide",
    title: "Guide / Mentor",
    subtitle: "Alumni, Faculty & Industry Mentors",
    icon: FaChalkboardUser,
    badge: "Guide Experience",
    headline: "Mentor students and share honest, experience-backed career guidance.",
    description:
      "Guide junior students through real-world industry requirements. Review authorized portfolios, host structured mentorship sessions, share branch-tested roadmaps, and shape the next generation of engineers and professionals.",
    capabilities: [
      "Mentorship inbox: manage incoming 1-on-1 guidance requests and student inquiries",
      "Authorized student track records: inspect verified roadmap progress before giving advice",
      "Curate guidance & resources: share tested playlists, books, and common industry pitfalls",
      "Verified badge: credential verification via institutional affiliation (@nbkrist.org)",
      "Campus & alumni networks: connect high-performing students to industry openings",
    ],
    demoInterface: {
      type: "guide",
      mockName: "Priya Nair, M.Tech",
      mockBranch: "Senior Embedded AI Systems Architect",
      mockStage: "Verified Guide · NBKRIST Alumni",
      mockTarget: "Domain: Embedded Systems & Edge AI",
      metric1: { label: "Mentees Guided", val: "48 Students" },
      metric2: { label: "Pending Requests", val: "3 New" },
      metric3: { label: "Published Roadmaps", val: "6 Guides" },
      sampleItemTitle: "Mentorship Inquiry: Transitioning from Web Dev to Embedded Firmware",
      sampleItemSub: "Student Aarav requested feedback on RTOS project architecture",
    },
    ctaText: "Apply as a Guide",
    ctaLink: "/get-started?role=guide",
  },
  {
    id: "institution",
    title: "Institution",
    subtitle: "Schools, Colleges & Training Cells",
    icon: FaBuildingColumns,
    badge: "Campus & Institutional Experience",
    headline: "Unify campus placement cells, student clubs, and career outcomes.",
    description:
      "Equip your college or high school with a centralized command center. Monitor collective cohort readiness, dispatch campus hackathons and recruitment notices, and connect departmental faculty guides.",
    capabilities: [
      "Institutional command center: overview of all associated student cohorts by branch",
      "Official association codes: easily onboard enrolled students to your college cell",
      "Campus notices & events: dispatch hackathons, symposiums, and placement deadlines",
      "Outcome & accreditation evidence: export verified student achievements & project track records",
      "Departmental faculty alignment: assign verified mentors across academic streams",
    ],
    demoInterface: {
      type: "institution",
      mockName: "NBKR Institute of Science & Technology",
      mockBranch: "Training & Placement Cell (T&P)",
      mockStage: "Institution Code: NBKR-7821",
      mockTarget: "Campus Career Development Center",
      metric1: { label: "Enrolled Students", val: "1,248 Active" },
      metric2: { label: "Faculty Mentors", val: "36 Guides" },
      metric3: { label: "Placement Readiness", val: "79% Score" },
      sampleItemTitle: "Campus Recruitment Drive: Core Embedded & Autonomous Mobility",
      sampleItemSub: "Association window open · 42 students submitted verified portfolios",
    },
    ctaText: "Register Your Institution",
    ctaLink: "/get-started?role=institution",
  },
];

export default function RolePreviewSection() {
  const [activeTab, setActiveTab] = useState(ROLE_PREVIEWS[0]);

  return (
    <section style={{ margin: "5rem 0", padding: "0 0.5rem" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <span
          style={{
            fontSize: "0.82rem",
            textTransform: "uppercase",
            letterSpacing: 1.4,
            color: "var(--primary)",
            fontWeight: 700,
          }}
        >
          Explore the PREYEAHH Experience
        </span>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 4vw, 2.8rem)",
            fontWeight: 800,
            margin: "0.4rem 0 0.75rem",
            letterSpacing: "-0.02em",
          }}
        >
          Four Roles. One Unified Career Ecosystem.
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: 680, margin: "0 auto" }}>
          Select a persona below to preview how PREYEAHH delivers tailored tools, safety boundaries,
          and real-world clarity for each stakeholder.
        </p>
      </div>

      {/* ── 4 ROLE TABS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.75rem",
          marginBottom: "2.5rem",
          maxWidth: 1040,
          margin: "0 auto 2.5rem",
        }}
      >
        {ROLE_PREVIEWS.map((role) => {
          const Icon = role.icon;
          const isActive = activeTab.id === role.id;
          return (
            <button
              key={role.id}
              onClick={() => setActiveTab(role)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem 1.25rem",
                borderRadius: "1rem",
                border: isActive ? "2px solid var(--primary)" : "1px solid var(--border)",
                background: isActive ? "var(--surface)" : "var(--surface-mid)",
                boxShadow: isActive ? "0 8px 24px var(--primary-bg)" : "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "0.6rem",
                  background: isActive ? "var(--primary)" : "rgba(0,0,0,0.05)",
                  color: isActive ? "#fff" : "var(--text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.15rem",
                  flexShrink: 0,
                }}
              >
                <Icon />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--text)" }}>
                  {role.title}
                </strong>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {role.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── INTERACTIVE PREVIEW CARD ── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "1.5rem",
          padding: "2.5rem",
          boxShadow: "0 12px 40px rgba(0,0,0,0.04)",
          maxWidth: 1120,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "2.5rem",
          alignItems: "center",
        }}
      >
        {/* Left: Role Explanation & Capabilities */}
        <div>
          <span
            style={{
              display: "inline-block",
              background: "var(--primary-bg)",
              color: "var(--primary)",
              padding: "0.3rem 0.85rem",
              borderRadius: "2rem",
              fontSize: "0.8rem",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            {activeTab.badge}
          </span>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.75rem",
              fontWeight: 800,
              margin: "0 0 1rem",
              lineHeight: 1.25,
            }}
          >
            {activeTab.headline}
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.98rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            {activeTab.description}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "2rem" }}>
            {activeTab.capabilities.map((cap, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "0.88rem" }}>
                <div style={{ color: "var(--primary)", marginTop: "0.15rem", flexShrink: 0 }}>
                  <FaCheck />
                </div>
                <span>{cap}</span>
              </div>
            ))}
          </div>

          <Link
            to={activeTab.ctaLink}
            className="btn btn-primary"
            style={{
              padding: "0.8rem 1.8rem",
              fontSize: "0.96rem",
              borderRadius: "0.6rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {activeTab.ctaText} <FaArrowRight />
          </Link>
        </div>

        {/* Right: Simulated Demonstration Screen */}
        <div
          style={{
            background: "var(--surface-mid)",
            border: "1px solid var(--border)",
            borderRadius: "1.25rem",
            padding: "1.75rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Demonstration Watermark Banner */}
          <div
            style={{
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              color: "#b45309",
              borderRadius: "0.5rem",
              padding: "0.4rem 0.75rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              marginBottom: "1.25rem",
            }}
          >
            <FaShieldHalved /> Simulated Demonstration Content · Live Protected Platform
          </div>

          {/* Mock Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
            <div>
              <strong style={{ fontSize: "1.1rem", display: "block" }}>{activeTab.demoInterface.mockName}</strong>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                {activeTab.demoInterface.mockBranch}
              </span>
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                background: "var(--primary-bg)",
                color: "var(--primary)",
                padding: "0.25rem 0.6rem",
                borderRadius: "1rem",
                fontWeight: 700,
              }}
            >
              {activeTab.demoInterface.mockStage}
            </span>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "0.75rem",
              padding: "0.85rem 1rem",
              fontSize: "0.82rem",
              marginBottom: "1.25rem",
              fontWeight: 600,
              color: "var(--primary)",
            }}
          >
            {activeTab.demoInterface.mockTarget}
          </div>

          {/* 3 Metrics Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem", marginBottom: "1.25rem" }}>
            {[activeTab.demoInterface.metric1, activeTab.demoInterface.metric2, activeTab.demoInterface.metric3].map(
              (m, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 0.6rem",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>
                    {m.label}
                  </span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--text)" }}>{m.val}</strong>
                </div>
              )
            )}
          </div>

          {/* Sample Activity Card */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "0.75rem",
              padding: "1rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "0.5rem",
                background: "var(--primary-bg)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                flexShrink: 0,
                marginTop: "0.15rem",
              }}
            >
              <FaAward />
            </div>
            <div>
              <strong style={{ fontSize: "0.88rem", display: "block", marginBottom: "0.2rem" }}>
                {activeTab.demoInterface.sampleItemTitle}
              </strong>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                {activeTab.demoInterface.sampleItemSub}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
