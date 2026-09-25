import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaCompass, FaChartLine, FaArrowRight, FaLaptopCode, FaSatelliteDish,
  FaBolt, FaGears, FaBuilding, FaGraduationCap, FaUser,
} from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";
import { fetchBranches } from "../services/branchService";
import { fetchRoles } from "../services/rolesService";
import { fetchBeyond } from "../services/beyondService";

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
                <>Welcome to <span>Pre-Yeah</span></>
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
