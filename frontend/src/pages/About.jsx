import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaLightbulb, FaCircleCheck, FaCircleQuestion, FaArrowRight, FaUsers,
  FaGraduationCap, FaCompass, FaRocket, FaMap, FaBookmark, FaTrophy,
  FaLayerGroup, FaCirclePlus, FaFileLines, FaCircleInfo, FaWrench,
  FaCommentDots, FaTriangleExclamation, FaLink, FaCalendarDays,
  FaSignsPost, FaLock, FaHeart, FaUserTie, FaUserGraduate, FaBriefcase,
  FaBuildingColumns, FaCodeBranch,
} from "react-icons/fa6";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const revealSection = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.34, 1.2, 0.64, 1] } },
};
const staggerGroup = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const staggerChild = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.34, 1.3, 0.64, 1] } },
};

function Section({ icon: Icon, title, sub, children }) {
  return (
    <motion.div
      className="about-section"
      variants={revealSection}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
    >
      <motion.div className="about-section-header" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="about-section-icon"><Icon /></div>
        <div>
          <h2>{title}</h2>
          <p className="about-section-sub">{sub}</p>
        </div>
      </motion.div>
      {children}
    </motion.div>
  );
}

const PROBLEMS = [
  { q: "\u201cI don't know what roles exist\u201d", a: "Browse roles filtered by your branch" },
  { q: "\u201cI don't know what skills to learn\u201d", a: "Each role shows required skills" },
  { q: "\u201cI don't know when to start\u201d", a: "Year-by-year roadmap from day one" },
  { q: "\u201cI don't know who to ask\u201d", a: "Real advice from seniors and alumni" },
  { q: "\u201cI'm scared of choosing wrong\u201d", a: "Explore freely before committing" },
  { q: "\u201cGeneric internet advice doesn't help\u201d", a: "College-specific, branch-specific guidance" },
];

const FEATURES = [
  { icon: FaCodeBranch, title: "Branch-Filtered Roles", desc: "Your registered branch is your default view. Explore others freely, but commit only within your stream." },
  { icon: FaMap, title: "Role Detail & Roadmaps", desc: "Full breakdown per role — overview, skills, curated resources, and a year-by-year roadmap." },
  { icon: FaBookmark, title: "Commitment Tracking", desc: "Mark a role as committed or exploring. Your choice is recorded — changing it triggers a warning so it stays meaningful." },
  { icon: FaTrophy, title: "Leadership Opportunities", desc: "Clubs, competitions, and positions filtered to your branch — build your profile beyond academics." },
  { icon: FaLayerGroup, title: "Core vs Non-Core Clarity", desc: "Know which roles align directly with your branch and which are open to all streams." },
  { icon: FaCirclePlus, title: "Request a Role", desc: "Can't find a role? Submit a request with a name and summary — the admin reviews and adds it for everyone." },
];

const ROLE_INSIDE = [
  { icon: FaCircleInfo, text: "Role overview — what this job actually involves" },
  { icon: FaWrench, text: "Required skills — technical and soft skills you need" },
  { icon: FaGraduationCap, text: "Learning path — what to learn in each year of college" },
  { icon: FaCommentDots, text: "Real advice — from seniors and alumni who've been there" },
  { icon: FaTriangleExclamation, text: "Common mistakes — what to avoid based on real experiences" },
  { icon: FaLink, text: "Resources — YouTube playlists, PDFs, websites, courses" },
  { icon: FaCalendarDays, text: "Year-by-year roadmap — what to do in 1st, 2nd, 3rd, and 4th year" },
];

const STEPS = [
  { title: "Register or Log In", body: "Click Login in the navigation. On the Register tab, choose Student and fill in your name, email (Gmail or @nbkrist.org), password, and branch. Your branch becomes your default view across the app." },
  { title: "Pick Your Branch on the Home Page", body: 'Your registered branch is highlighted with a "Your Branch" badge. Tap it to go straight to your roles. You can tap any other branch to explore it too — no restrictions on browsing.' },
  { title: "Explore Roles", body: "Browse roles for your branch. Use filters to see Core or Non-Core only, or search by name. Tap any card — you'll be asked if you're committed or just exploring before the full details open." },
  { title: "Explore Other Branches Freely", body: "You can browse and read roles from any branch. But committing to a role outside your registered branch is blocked — your interest profile stays focused on your stream." },
  { title: "Check Leadership Opportunities", body: "Head to the Leadership tab to find clubs, competitions, and positions relevant to your branch. Tap any card to see how to get involved." },
  { title: "Request a Missing Role", body: 'Scroll to the bottom of the Roles page and tap "Request a Role". Fill in the role name and a brief summary — the admin will review it.' },
  { title: "Come Back as You Grow", body: "Pre-Yeah is most useful when revisited each year. Your roadmap evolves — check back each semester to see what's next and adjust your focus." },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <>
      <div className="about-hero">
        <div className="about-hero-inner">
          <motion.div className="hero-badge" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            About Pre-Yeah
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            Built for <span>NBKRIST Students</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            A career guidance platform made for engineering students at NBKRIST — giving you a clear,
            branch-specific roadmap from day one of college to placement day.
          </motion.p>
          <motion.div className="about-hero-pills" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <span><FaSignsPost /> Branch-Specific</span>
            <span><FaRocket /> Year-by-Year Roadmaps</span>
            <span><FaUsers /> Built by Students</span>
          </motion.div>
        </div>
      </div>

      <div className="about-wrap">
        <Section icon={FaLightbulb} title="Why Pre-Yeah Exists" sub="The problem we set out to solve">
          <p>
            Most engineering students spend their first two years unsure of what career path to take,
            which skills to build, or even what roles exist in their field. By the time placements
            arrive, it feels too late to course-correct.
          </p>
          <p>
            Pre-Yeah was built to fix that — give every NBKRIST student a clear picture of where you can
            go, what it takes to get there, and how to start building toward it from year one. No fluff,
            no generic advice. Just branch-specific, role-specific guidance that actually applies to you.
          </p>
        </Section>

        <Section icon={FaCircleCheck} title="What Pre-Yeah Gives You" sub="Every problem, solved">
          <motion.div className="about-problems-grid" variants={staggerGroup} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {PROBLEMS.map((p) => (
              <motion.div className="apg-item" key={p.q} variants={staggerChild}>
                <div className="apg-problem"><FaCircleQuestion /> {p.q}</div>
                <div className="apg-solution"><FaArrowRight /> {p.a}</div>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        <Section icon={FaUsers} title="Who Is It For" sub="Three types of users, one platform">
          <motion.div className="about-user-cards" variants={staggerGroup} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.div className="about-user-card" variants={staggerChild}>
              <div className="auc-icon"><FaGraduationCap /></div>
              <div className="auc-body">
                <strong>Students</strong>
                <span>Register with your Gmail or NBKRIST email, pick your branch, and get a personalised career hub. Explore roles, track your interests, and discover leadership opportunities.</span>
              </div>
            </motion.div>
            <motion.div className="about-user-card" variants={staggerChild}>
              <div className="auc-icon auc-icon--guide"><FaCompass /></div>
              <div className="auc-body">
                <strong>Guides</strong>
                <span>Senior students or alumni from NBKRIST who mentor others. Share your experiences, add guidance for roles in your branch, and help juniors find their path.</span>
              </div>
            </motion.div>
          </motion.div>
        </Section>

        <Section icon={FaRocket} title="What Pre-Yeah Offers" sub="Everything you need, nothing you don't">
          <motion.div className="about-features-grid" variants={staggerGroup} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {FEATURES.map((f) => (
              <motion.div className="about-feature-card" key={f.title} variants={staggerChild} whileHover={{ y: -4 }}>
                <f.icon />
                <strong>{f.title}</strong>
                <span>{f.desc}</span>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        <Section icon={FaFileLines} title="What You'll Find Inside Each Role" sub="Every role card opens a detailed page">
          <motion.div className="about-role-inside" variants={staggerGroup} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {ROLE_INSIDE.map((item) => (
              <motion.div className="ari-item" key={item.text} variants={staggerChild} whileHover={{ x: 4 }}>
                <item.icon /><span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        <Section icon={FaSignsPost} title="How to Use Pre-Yeah" sub="Seven steps to get started">
          <motion.div className="steps-list" variants={staggerGroup} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {STEPS.map((s, i) => (
              <motion.div className="step-item" key={s.title} variants={staggerChild}>
                <div className="step-num">{i + 1}</div>
                <div className="step-body">
                  <strong>{s.title}</strong>
                  <span>{s.body}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        <Section icon={FaLock} title="Accounts & Access" sub="How to get in and what you can do">
          <div className="about-access-table">
            <div className="aat-row aat-head">
              <span>Account Type</span><span>How to Get Access</span><span>What You Can Do</span>
            </div>
            <div className="aat-row">
              <span><FaGraduationCap /> Student</span>
              <span>Register with any Gmail or @nbkrist.org email. Instant access.</span>
              <span>Explore roles, track commitment, request new roles, view roadmaps.</span>
            </div>
            <div className="aat-row">
              <span><FaCompass /> Guide</span>
              <span>Must use @nbkrist.org email. Submitted for admin review.</span>
              <span>Add guidance, manage role content, contribute roadmaps for your branch.</span>
            </div>
          </div>
        </Section>

        <motion.div
          className="about-section about-built-by"
          variants={revealSection}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <div className="about-section-header">
            <div className="about-section-icon"><FaHeart /></div>
            <div>
              <h2>Built by NBKRIST Students, For NBKRIST Students</h2>
              <p className="about-section-sub">Community-driven, college-specific</p>
            </div>
          </div>
          <p>
            Pre-Yeah is created by students, for students — under the guidance of HODs, faculty, seniors,
            alumni, and industry experts. Every piece of advice comes from people who know your college,
            your curriculum, and your challenges.
          </p>
          <div className="about-built-tags">
            <span><FaUserTie /> HODs &amp; Faculty</span>
            <span><FaUserGraduate /> Seniors &amp; Alumni</span>
            <span><FaBriefcase /> Industry Experts</span>
            <span><FaBuildingColumns /> NBKRIST Community</span>
          </div>
        </motion.div>

        <motion.div className="about-cta" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="about-cta-inner">
            <p className="about-cta-label">Your career clarity starts here</p>
            <h2>Ready to find your <span>path?</span></h2>
            <p>Pick your branch and start exploring roles, roadmaps, and leadership opportunities built for NBKRIST students.</p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Get Started <FaArrowRight />
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
