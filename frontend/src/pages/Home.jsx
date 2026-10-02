import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaCompass, FaChartLine, FaArrowRight, FaLaptopCode, FaSatelliteDish,
  FaBolt, FaGears, FaBuilding, FaGraduationCap, FaUser,
  FaCommentDots, FaMap, FaBookmark,
} from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import { useBranch } from "../context/BranchContext.jsx";
import { fetchBranches } from "../services/branchService.js";
import { fetchRoles } from "../services/rolesService.js";
import { fetchBeyond } from "../services/beyondService.js";

const BRANCH_META = {
  CSE: { icon: FaLaptopCode, color: "#1a56db", desc: "Computer Science & Engineering" },
  ECE: { icon: FaSatelliteDish, color: "#7c3aed", desc: "Electronics & Communication" },
  EEE: { icon: FaBolt, color: "#d97706", desc: "Electrical & Electronics" },
  MECH: { icon: FaGears, color: "#059669", desc: "Mechanical Engineering" },
  CIVIL: { icon: FaBuilding, color: "#dc2626", desc: "Civil Engineering" },
};
function getBranchMeta(b) {
  return BRANCH_META[b] || { icon: FaGraduationCap, color: "var(--primary)", desc: `${b} Engineering` };
}

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

export default function Home() {
  const { user } = useAuth();
  const { setBranch } = useBranch();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [counts, setCounts] = useState({});
  const [totals, setTotals] = useState({ roles: 0, beyond: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const branchList = await fetchBranches();
        if (cancelled) return;
        setBranches(branchList);

        const [rolesTotal, beyondTotal, perBranch] = await Promise.all([
  fetchRoles({ limit: 1 }).then((r) => r?.meta?.total ?? 0),
  fetchBeyond({ limit: 1 }).then((r) => r?.meta?.total ?? 0),
  Promise.all(
    branchList.map(async (b) => {
      const [roles, beyond] = await Promise.all([
        fetchRoles({ branch: b, limit: 1 }).then((r) => r?.meta?.total ?? 0),
        fetchBeyond({ branch: b, limit: 1 }).then((r) => r?.meta?.total ?? 0),
      ]);
      return [b, { roles, beyond }];
    })
  ),
]);

        if (cancelled) return;
        setTotals({ roles: rolesTotal, beyond: beyondTotal });
        setCounts(Object.fromEntries(perBranch));
      } catch {
        // Stats are supplementary — page still works without them.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSelectBranch = (b) => {
    setBranch(b);
    navigate(`/roles?branch=${b}`);
  };

  const isStudent = user?.role === "student";

  if (user?.role === "student" || user?.role === "guide") {
    const branchQuery = user.branch ? `?branch=${encodeURIComponent(user.branch)}` : "";
    const dashboardActions = user.role === "student"
      ? [
          {
            title: "Explore core roles",
            description: `Start with the core career paths for ${user.branch || "your branch"}. Compare roles and open one to see its guidance.`,
            icon: FaCompass,
            to: `/roles${branchQuery}`,
            primary: true,
          },
          {
            title: "Build a role roadmap",
            description: "Open a role and generate a learning plan based on its skills, resources, and guidance.",
            icon: FaMap,
            to: `/roles${branchQuery}`,
          },
          {
            title: "Ask career chat",
            description: "Get branch-aware help comparing paths, skills, and your next steps.",
            icon: FaCommentDots,
            to: "/chat",
          },
          {
            title: "Practice a topic",
            description: "Create an AI quiz for a topic or select a role to focus your practice.",
            icon: FaGraduationCap,
            to: "/quiz",
          },
          {
            title: "Track your progress",
            description: "Review completed roadmap topics and your recent quiz performance.",
            icon: FaChartLine,
            to: "/dashboard#student-progress",
          },
          {
            title: "Learning resources",
            description: "Browse curated resources relevant to your learning and career goals.",
            icon: FaBookmark,
            to: "/resources",
          },
        ]
      : [
          {
            title: "Your branch roles",
            description: `Review core and non-core career paths for ${user.branch || "your branch"} and open role guidance.`,
            icon: FaCompass,
            to: `/roles${branchQuery}`,
            primary: true,
          },
          {
            title: "Branch opportunities",
            description: "Review beyond-placement opportunities and guidance for students in your branch.",
            icon: FaChartLine,
            to: `/beyond${branchQuery}`,
          },
          {
            title: "Learning resources",
            description: "Browse the resources students can use to build skills and prepare for their goals.",
            icon: FaBookmark,
            to: "/resources",
          },
        ];

    return (
      <main className="dashboard-shell home-dashboard">
        <section className="home-dashboard-welcome">
          <div>
            <div className="dashboard-role-badge">
              {user.role === "student" ? "Student Workspace" : "Guide Workspace"}
            </div>
            <h1>Welcome back, <span>{user.name?.split(" ")[0] || "there"}</span></h1>
            <p>
              {user.role === "student"
                ? "You’re signed in. Start with your branch’s core roles, then use guidance and AI tools when you need them."
                : "You’re signed in. Your branch guidance and student resources are ready to review."}
            </p>
          </div>
          <div className="home-dashboard-branch">
            <span>Your branch</span>
            <strong>{user.branch || "Not set"}</strong>
          </div>
        </section>

        <section className="home-dashboard-section" aria-labelledby="home-actions-title">
          <div className="home-dashboard-section-heading">
            <div>
              <h2 id="home-actions-title">{user.role === "student" ? "Pick up where you want to go" : "Your guide workspace"}</h2>
              <p>{user.role === "student" ? "Career paths first. Learning tools are here when they fit your next step." : "Branch-first links to the areas students use most."}</p>
            </div>
          </div>
          <div className="dashboard-grid">
            {dashboardActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  type="button"
                  className={`dashboard-card ${action.primary ? "dashboard-card--highlight" : ""}`}
                  onClick={() => navigate(action.to)}
                >
                  <div className="dashboard-card-icon"><Icon /></div>
                  <div>
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>
                  <div className="dashboard-card-footer">Open <FaArrowRight /></div>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <section className="landing-hero-wrap">
        <div className="landing-hero">
          <div className="hero-left">
            <motion.div
              className="hero-eyebrow"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <FaCompass /> Your Career Compass
            </motion.div>

            <motion.h1
              className="hero-headline"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {isStudent ? (
                <>Welcome back, <span>{user.name.split(" ")[0]}</span></>
              ) : (
                <>Welcome to <span>Preyeahh</span></>
              )}
            </motion.h1>

            <motion.p
              className="hero-subtext"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {isStudent
                ? `Here's your ${user.branch} career hub. Jump straight in or explore other branches.`
                : "Discover roles, leadership opportunities, and career guidance tailored to your engineering branch. Pick your branch below to explore everything in one place."}
            </motion.p>

            <motion.div
              className="hero-cta-row"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <button
                className="btn btn-primary"
                onClick={() => document.querySelector(".branch-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                <FaCompass /> Explore Branches
              </button>
              {!user && (
                <button className="btn btn-outline" onClick={() => navigate("/?login=1")}>
                  <FaUser /> Sign In
                </button>
              )}
            </motion.div>
          </div>

          <div className="hero-right">
            <div className="hero-glow" />
            <div className="hero-stats-bento">
              {[
                { label: "Branches", value: branches.length },
                { label: "Roles", value: totals.roles },
                { label: "Beyond Paths", value: totals.beyond },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  className="hero-stat-card"
                  initial={{ opacity: 0, scale: 0.9, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <div className="hero-stat-value">{loading ? "—" : s.value}</div>
                  <div className="hero-stat-label">{s.label}</div>
                </motion.div>
              ))}
            </div>
            <motion.div className="hero-ticker" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <div className="hero-ticker-icon"><FaChartLine /></div>
              <div className="hero-ticker-text"><strong>Here:</strong> career options made easy</div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="branch-section">
        <div className="section-label">{isStudent ? "Your Branch & More" : "Select Your Branch"}</div>
        <motion.div className="branch-grid" variants={gridVariants} initial="hidden" animate="show">
          {branches.map((b) => {
            const meta = getBranchMeta(b);
            const Icon = meta.icon;
            const isOwn = isStudent && b === user.branch;
            const c = counts[b] || { roles: 0, beyond: 0 };
            return (
              <motion.div
                key={b}
                variants={cardVariants}
                whileHover={{ y: -8 }}
                className={`branch-card ${isOwn ? "branch-card-own" : ""}`}
                style={{ "--bcolor": meta.color, cursor: "pointer" }}
                onClick={() => handleSelectBranch(b)}
              >
                {isOwn && <div className="branch-own-badge">Your Branch</div>}
                <div className="branch-icon"><Icon /></div>
                <div className="branch-name">{b}</div>
                <div className="branch-desc">{meta.desc}</div>
                <div className="branch-counts">
                  <span>{c.roles} roles</span>
                  <span>{c.beyond} leadership</span>
                </div>
                <div className="branch-arrow"><FaArrowRight /></div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </>
  );
}
