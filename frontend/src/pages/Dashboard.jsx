import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaChartLine,
  FaCommentDots,
  FaCompass,
  FaGraduationCap,
  FaMap,
  FaUser,
  FaBookOpen,
} from "react-icons/fa6";

import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      navigate("/", { replace: true });
      return;
    }
    if (!['student', 'guide'].includes(user.role)) {
      navigate("/", { replace: true });
    }
  }, [initialized, navigate, user]);

  if (!initialized || !user || !['student', 'guide'].includes(user.role)) {
    return null;
  }

  const branchTarget = user.branch ? `?branch=${encodeURIComponent(user.branch)}` : "";

  const studentCards = [
    {
      title: "Explore Branch Roles",
      description: "Start with your branch and compare core career paths before deciding where to focus.",
      icon: FaCompass,
      to: `/roles${branchTarget}`,
      highlight: true,
    },
    {
      title: "Career Chat",
      description: "Ask questions, compare career paths, and get contextual guidance based on your branch and goals.",
      icon: FaCommentDots,
      to: "/chat",
    },
    {
      title: "AI Roadmaps",
      description: "Generate personalized plans and track the next milestones that move you closer to your target role.",
      icon: FaMap,
      to: "/roadmaps",
    },
    {
      title: "AI Quizzes",
      description: "Practice with instant, role-aware quizzes and tighten the weak spots before interviews or exams.",
      icon: FaGraduationCap,
      to: "/quiz",
    },
    {
      title: "Progress",
      description: "Review roadmap completion, recent quiz scores, and learning momentum across your journey.",
      icon: FaChartLine,
      to: "/progress",
    },
    {
      title: "Profile",
      description: "Keep your interests, preferences, and AI profile aligned with the roles that matter to you.",
      icon: FaUser,
      to: "/profile",
    },
  ];

  const guideCards = [
    {
      title: "Role Guidance",
      description: "Review your branch role library, update guidance, and keep your mentoring content relevant.",
      icon: FaBookOpen,
      to: `/roles${branchTarget}`,
      highlight: true,
    },
    {
      title: "Resources",
      description: "Share useful material, learning paths, and practical references across your branch community.",
      icon: FaMap,
      to: "/resources",
    },
    {
      title: "Beyond Paths",
      description: "Help students discover startup, higher-study, and national or international opportunities in your branch.",
      icon: FaCompass,
      to: `/beyond${branchTarget}`,
    },
    {
      title: "Role Library",
      description: "Keep a close eye on your role coverage and help students see the most relevant path for their branch.",
      icon: FaCompass,
      to: `/roles${branchTarget}`,
    },
  ];

  const cards = user.role === "student" ? studentCards : guideCards;

  return (
    <div className="dashboard-shell">
      <div className="dashboard-hero">
        <div>
          <div className="dashboard-role-badge">{user.role === "student" ? "Student" : "Guide"} Workspace</div>
          <h1>
            Welcome back, <span>{user.name?.split(" ")[0] || "there"}</span>
          </h1>
        </div>
        <p>
          {user.role === "student"
            ? "Your learning hub brings together AI coaching, roadmap tracking, quizzes, and role exploration in one place."
            : "Your guide dashboard keeps mentoring tools, role guidance, and branch opportunities within easy reach."}
        </p>
      </div>

      <div className="dashboard-grid">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.title}
              type="button"
              className={`dashboard-card ${card.highlight ? "dashboard-card--highlight" : ""}`}
              onClick={() => navigate(card.to)}
            >
              <div className="dashboard-card-icon"><Icon /></div>
              <div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
              <div className="dashboard-card-footer">
                Open <FaArrowRight />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}