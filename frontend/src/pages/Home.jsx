import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FaCompass, FaChartLine, FaArrowRight, FaLaptopCode, FaSatelliteDish,
  FaBolt, FaGears, FaBuilding, FaGraduationCap, FaUser, FaCrosshairs,
  FaMedal, FaMap, FaEnvelope,
} from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import { useBranch } from "../context/BranchContext.jsx";
import { fetchBranches } from "../services/branchService.js";
import { fetchRoles } from "../services/rolesService.js";
import { fetchBeyond } from "../services/beyondService.js";
import Dashboard from "./Dashboard.jsx";
import preyeahhLogo from "../assets/preyeahh-logo.png";
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

const ADMIN_ACTIONS = [
  { title: "Manage roles", description: "Create and update career paths across branches.", section: "roles", icon: FaCrosshairs },
  { title: "Manage branches", description: "Review the branches available across the platform.", section: "branches", icon: FaBuilding },
  { title: "Beyond opportunities", description: "Maintain non-placement paths and opportunities.", section: "beyond", icon: FaMedal },
  { title: "Guidance", description: "Manage role guidance and learning recommendations.", section: "guidance", icon: FaMap },
  { title: "Role requests", description: "Review requested roles from the community.", section: "requests", icon: FaEnvelope },
  { title: "Guide requests", description: "Review guide applications and approvals.", section: "guides", icon: FaGraduationCap },
  { title: "Role interest", description: "Review student interest across roles.", section: "interest", icon: FaChartLine },
];

function readStoredAdmin() {
  try {
    const raw = localStorage.getItem("pp_admin_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Home() {
  const { user } = useAuth();
  const { setBranch } = useBranch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [adminUser, setAdminUser] = useState(readStoredAdmin);

  // Consume google_error from the URL and show a user-facing message
  useEffect(() => {
    const googleError = searchParams.get("google_error");
    if (!googleError) return;

    const messages = {
      access_denied: "Google sign-in was cancelled or denied.",
      state_mismatch: "Security check failed. Please try signing in with Google again.",
      no_code: "Authentication failed. Please try again.",
      token_exchange: "Could not complete Google sign-in. Please try again.",
      token_invalid: "Google authentication failed. Please try again.",
      email_not_verified: "Your Google email is not verified. Please verify it with Google first.",
      domain_not_allowed: "Only @gmail.com and @nbkrist.org emails are supported.",
      config: "Google sign-in is not configured. Please contact support.",
      server_error: "Something went wrong with Google sign-in. Please try again.",
      session_error: "Could not start your session. Please try again.",
      no_token: "Authentication failed. Please try signing in with Google again.",
      not_found: "Account not found. Please register first.",
      unknown: "Google sign-in failed. Please try again.",
    };

    toast.error(messages[googleError] || messages.unknown);

    const next = new URLSearchParams(searchParams);
    next.delete("google_error");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const [branches, setBranches] = useState([]);
  const [counts, setCounts] = useState({});
  const [totals, setTotals] = useState({ roles: 0, beyond: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => setAdminUser(readStoredAdmin());
    window.addEventListener("admin-auth-changed", sync);
    return () => window.removeEventListener("admin-auth-changed", sync);
  }, []);

  useEffect(() => {
    if (user || adminUser) {
      setLoading(false);
      return undefined;
    }
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
  }, [user, adminUser]);

  const handleSelectBranch = (b) => {
    setBranch(b);
    navigate(`/roles?branch=${b}`);
  };

  if (user?.role === "student" || user?.role === "guide") return <Dashboard />;

  if (adminUser) {
    return (
      <main className="dashboard-shell home-dashboard">
        <section className="home-dashboard-welcome">
          <div>
            <div className="dashboard-role-badge">Admin Workspace</div>
            <h1>Welcome back, <span>{adminUser.name?.split(" ")[0] || "Admin"}</span></h1>
            <p>Choose a management area to continue maintaining Preyeahh.</p>
          </div>
        </section>
        <section className="home-dashboard-section" aria-labelledby="admin-actions-title">
          <div className="home-dashboard-section-heading">
            <div><h2 id="admin-actions-title">Platform management</h2></div>
          </div>
          <div className="dashboard-grid">
            {ADMIN_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.section}
                  type="button"
                  className="dashboard-card"
                  onClick={() => navigate("/admin", { state: { section: action.section } })}
                >
                  <div className="dashboard-card-icon"><Icon /></div>
                  <div><h3>{action.title}</h3><p>{action.description}</p></div>
                  <div className="dashboard-card-footer">Open <FaArrowRight /></div>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  const isStudent = user?.role === "student";

  return (
    <>
      <section className="landing-hero-wrap">
        <div className="landing-hero">
          <div className="hero-left">
            <motion.img
              src={preyeahhLogo}
              alt="PREYEAHH"
              className="hero-logo"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            />

            <motion.div
              className="hero-eyebrow"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <FaCompass /> Your Career Compass
            </motion.div>

            <motion.h1
              className="hero-headline"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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
