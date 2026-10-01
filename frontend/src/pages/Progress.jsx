import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchLearningProgress, fetchQuizProgress, fetchPerformance } from "../services/progressService.js";

const SEVERITY_COLOR = { high: "var(--error)", medium: "var(--warning)", low: "var(--primary)", info: "var(--text-muted)" };
const card = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem" };
const h3 = { fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "1rem", color: "var(--text)" };

export default function Progress() {
  const [learning, setLearning] = useState(null);
  const [quizzes, setQuizzes] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchLearningProgress(), fetchQuizProgress(), fetchPerformance()])
      .then(([l, q, p]) => { setLearning(l); setQuizzes(q); setPerformance(p); })
      .catch(() => toast.error("Failed to load progress"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-hero"><h1>My <span>Progress</span></h1></div>
        <div className="empty"><div className="icon"><i className="fa fa-spinner fa-spin" /></div><p>Loading...</p></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-hero">
        <h1>My <span>Progress</span></h1>
        <p>Track your roadmaps and quiz results</p>
      </div>

      <div className="section">
        <div className="stats" style={{ marginBottom: "2rem" }}>
          <div className="stat-card"><div className="num">{learning?.overallProgress ?? 0}%</div><div className="label">Roadmap Completion</div></div>
          <div className="stat-card"><div className="num">{learning?.completedTopics ?? 0}</div><div className="label">Topics Completed</div></div>
          <div className="stat-card"><div className="num">{quizzes?.completedQuizzes ?? 0}</div><div className="label">Quizzes Completed</div></div>
          <div className="stat-card"><div className="num">{quizzes?.averageScore ?? 0}%</div><div className="label">Avg Quiz Score</div></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          <div style={card}>
            <h3 style={h3}>Roadmap Breakdown</h3>
            {!learning?.roadmapProgressList?.length ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No roadmaps yet</p>
            ) : (
              learning.roadmapProgressList.map((rm) => (
                <div key={rm.id} style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>{rm.title}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{rm.completionPercentage}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${rm.completionPercentage}%`, height: "100%", background: rm.completionPercentage >= 80 ? "var(--primary)" : rm.completionPercentage >= 40 ? "var(--warning)" : "var(--error)" }} />
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{rm.completedTopics}/{rm.totalTopics} topics</div>
                </div>
              ))
            )}
          </div>

          <div style={card}>
            <h3 style={h3}>Suggestions</h3>
            {!performance?.suggestions?.length ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No suggestions yet</p>
            ) : (
              performance.suggestions.map((s) => (
                <div key={s.id} style={{ marginBottom: "0.875rem", padding: "0.875rem", background: "var(--surface-mid)", borderRadius: 8, borderLeft: `3px solid ${SEVERITY_COLOR[s.severity] || "var(--primary)"}` }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text)", marginBottom: "0.3rem" }}>{s.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", lineHeight: 1.5 }}>{s.description}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {quizzes?.recentQuizzes?.length > 0 && (
          <div style={{ ...card, marginTop: "1.5rem" }}>
            <h3 style={h3}>Recent Quizzes</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {quizzes.recentQuizzes.map((q) => (
                <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "var(--surface-mid)", borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text)" }}>{q.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{q.difficulty} · {q.topic}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: q.score >= 70 ? "var(--primary)" : q.score >= 50 ? "var(--warning)" : "var(--error)" }}>{q.score}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
