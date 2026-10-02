import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaChartLine,
  FaCommentDots,
  FaCompass,
  FaGraduationCap,
  FaMap,
  FaUser,
  FaComments,
  FaCircleCheck,
  FaBolt,
} from "react-icons/fa6";

import { useAuth } from "../context/AuthContext.jsx";
import GuidePanel from "./GuidePanel.jsx";
import { fetchLearningProgress, fetchQuizProgress, fetchPerformance } from "../services/progressService.js";

const SEVERITY_COLOR = { high: "var(--error)", medium: "var(--warning)", low: "var(--primary)", info: "var(--text-muted)" };

export default function Dashboard() {
  const { user, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [learning, setLearning] = useState(null);
  const [quizProgress, setQuizProgress] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [progressLoading, setProgressLoading] = useState(true);

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

  useEffect(() => {
    if (!initialized || user?.role !== "student") return undefined;
    let current = true;
    Promise.allSettled([fetchLearningProgress(), fetchQuizProgress(), fetchPerformance()])
      .then(([learningResult, quizResult, performanceResult]) => {
        if (!current) return;
        if (learningResult.status === "fulfilled") setLearning(learningResult.value);
        if (quizResult.status === "fulfilled") setQuizProgress(quizResult.value);
        if (performanceResult.status === "fulfilled") setPerformance(performanceResult.value);
      })
      .finally(() => { if (current) setProgressLoading(false); });
    return () => { current = false; };
  }, [initialized, user?.id, user?.role]);

  useEffect(() => {
    if (location.hash === "#student-progress") {
      requestAnimationFrame(() => document.getElementById("student-progress")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [location.hash]);

  if (!initialized || !user || !['student', 'guide'].includes(user.role)) {
    return null;
  }

  if (user.role === "guide") return <GuidePanel />;

  const branchTarget = user.branch ? `?branch=${encodeURIComponent(user.branch)}` : "";
  const roadmapList = learning?.roadmapProgressList || [];
  const nextIncompleteRoadmap = roadmapList.filter((roadmap) => !roadmap.isCompleted).sort((a, b) => a.completionPercentage - b.completionPercentage)[0];
  const weakestTopic = performance?.weakTopics?.[0];

  let nextStep = {
    title: "Explore roles that fit your branch",
    description: "Pick a role to get a tailored roadmap and a clear next step.",
    action: "Browse roles",
    onClick: () => navigate(`/roles${branchTarget}`),
  };
  if (performance && !performance.profileComplete) {
    nextStep = {
      title: "Set up your learning profile",
      description: `Add ${performance.missingProfileFields.map((field) => field.label).join(", ")} so your recommendations fit you.`,
      action: "Complete profile",
      onClick: () => navigate("/profile"),
    };
  } else if (!learning?.totalRoadmaps) {
    nextStep = {
      title: "Build your first roadmap",
      description: `Choose a ${user.branch || "career"} role and turn it into a sequence of manageable milestones.`,
      action: "Explore roles",
      onClick: () => navigate(`/roles${branchTarget}`),
    };
  } else if (weakestTopic) {
    nextStep = {
      title: `Strengthen ${weakestTopic.topic}`,
      description: `Your quiz average is ${weakestTopic.averageScore}% across ${weakestTopic.attempts} attempt${weakestTopic.attempts === 1 ? "" : "s"}. Practice it and compare your next score.`,
      action: "Practice this topic",
      onClick: () => navigate("/quiz", { state: { topic: weakestTopic.topic } }),
    };
  } else if (nextIncompleteRoadmap) {
    nextStep = {
      title: `Continue ${nextIncompleteRoadmap.title}`,
      description: `${nextIncompleteRoadmap.completedTopics} of ${nextIncompleteRoadmap.totalTopics} topics complete. Keep the momentum going with the next milestone.`,
      action: "Open roadmaps",
      onClick: () => navigate("/roadmaps", { state: { roadmapId: nextIncompleteRoadmap.id } }),
    };
  } else if (!quizProgress?.completedQuizzes) {
    nextStep = {
      title: "Check your understanding",
      description: "A short quiz will reveal what to review next and build your learning record.",
      action: "Take a quiz",
      onClick: () => navigate("/quiz"),
    };
  }

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
      title: "Chat with a Guide",
      description: "Message approved guides assigned to roles you have committed to.",
      icon: FaComments,
      to: "/chat?mode=mentor",
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
      title: "Profile",
      description: "Keep your interests, preferences, and AI profile aligned with the roles that matter to you.",
      icon: FaUser,
      to: "/profile",
    },
  ];

  const cards = studentCards;

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

      <section className="dashboard-next-step" aria-labelledby="dashboard-next-step-title">
        <div className="dashboard-next-step-icon"><FaBolt /></div>
        <div className="dashboard-next-step-copy">
          <div className="dashboard-next-step-label">Your next best step</div>
          <h2 id="dashboard-next-step-title">{progressLoading ? "Checking your progress..." : nextStep.title}</h2>
          <p>{progressLoading ? "Loading your roadmap and quiz record." : nextStep.description}</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={nextStep.onClick} disabled={progressLoading}>
          {nextStep.action} <FaArrowRight />
        </button>
      </section>

      <section id="student-progress" className="dashboard-progress" aria-labelledby="student-progress-title">
        <div className="dashboard-section-heading">
          <div>
            <div className="dashboard-role-badge">Learning record</div>
            <h2 id="student-progress-title">Your progress at a glance</h2>
          </div>
          <button className="btn btn-outline btn-sm" type="button" onClick={() => navigate("/roadmaps")}>
            All roadmaps <FaArrowRight />
          </button>
        </div>

        <div className="dashboard-progress-stats">
          <div className="dashboard-progress-stat"><strong>{progressLoading ? "—" : `${learning?.overallProgress ?? 0}%`}</strong><span>Roadmap completion</span></div>
          <div className="dashboard-progress-stat"><strong>{progressLoading ? "—" : `${learning?.completedTopics ?? 0}/${learning?.totalTopics ?? 0}`}</strong><span>Topics completed</span></div>
          <div className="dashboard-progress-stat"><strong>{progressLoading ? "—" : quizProgress?.completedQuizzes ?? 0}</strong><span>Quizzes completed</span></div>
          <div className="dashboard-progress-stat"><strong>{progressLoading ? "—" : `${quizProgress?.averageScore ?? 0}%`}</strong><span>Average quiz score</span></div>
        </div>

        <div className="dashboard-progress-grid">
          <div className="dashboard-progress-panel">
            <div className="dashboard-progress-panel-heading">
              <h3>Roadmap momentum</h3>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => navigate("/roadmaps")}>Open roadmaps</button>
            </div>
            {progressLoading ? <p className="dashboard-progress-empty">Loading roadmaps...</p> : roadmapList.length ? roadmapList.slice(0, 4).map((roadmap) => (
              <button className="dashboard-roadmap-row" type="button" key={roadmap.id} onClick={() => navigate("/roadmaps", { state: { roadmapId: roadmap.id } })}>
                <span className="dashboard-roadmap-title">
                  <strong>{roadmap.title}</strong>
                  <small>{roadmap.roleTitle || roadmap.branch || "Personal roadmap"} · {roadmap.completedTopics}/{roadmap.totalTopics} topics</small>
                </span>
                <span className="dashboard-roadmap-progress">
                  <span className="dashboard-roadmap-track"><span style={{ width: `${roadmap.completionPercentage}%` }} /></span>
                  <strong>{roadmap.completionPercentage}%</strong>
                </span>
                {roadmap.isCompleted && <FaCircleCheck aria-label="Completed" />}
              </button>
            )) : <p className="dashboard-progress-empty">No roadmap yet. Choose a role to create a plan for it.</p>}
          </div>

          <div className="dashboard-progress-panel">
            <div className="dashboard-progress-panel-heading"><h3>Signals to act on</h3></div>
            {progressLoading ? <p className="dashboard-progress-empty">Checking your learning signals...</p> : performance?.suggestions?.length ? performance.suggestions.slice(0, 3).map((suggestion) => (
              <button
                type="button"
                className="dashboard-suggestion"
                key={suggestion.id}
                onClick={() => {
                  if (/profile/i.test(suggestion.title)) navigate("/profile");
                  else if (/quiz|revise|strong in/i.test(suggestion.title)) navigate("/quiz", { state: { topic: weakestTopic?.topic || "" } });
                  else if (/roadmap|resume/i.test(suggestion.title)) navigate("/roadmaps");
                  else navigate(`/roles${branchTarget}`);
                }}
              >
                <span className="dashboard-suggestion-mark" style={{ background: SEVERITY_COLOR[suggestion.severity] || "var(--primary)" }} />
                <span><strong>{suggestion.title}</strong><small>{suggestion.description}</small></span>
                <FaArrowRight />
              </button>
            )) : <p className="dashboard-progress-empty">No urgent gaps showing. Keep your roadmaps moving and check back after your next quiz.</p>}
          </div>
        </div>

        {quizProgress?.recentQuizzes?.length > 0 && (
          <div className="dashboard-progress-panel dashboard-recent-quizzes">
            <div className="dashboard-progress-panel-heading">
              <h3>Recent quiz results</h3>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => navigate("/quiz")}>All quizzes <FaArrowRight /></button>
            </div>
            <div className="dashboard-quiz-list">
              {quizProgress.recentQuizzes.slice(0, 4).map((quiz) => (
                <div key={quiz.id} className="dashboard-quiz-row">
                  <span><strong>{quiz.title}</strong><small>{quiz.topic} · {quiz.difficulty}</small></span>
                  <strong className={quiz.score >= 70 ? "dashboard-score-good" : "dashboard-score-review"}>{quiz.score}%</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="dashboard-section-heading dashboard-tools-heading"><h2>Learning tools</h2></div>
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