import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus, FaTrash, FaCircleCheck, FaCircleXmark } from "react-icons/fa6";
import { generateQuiz, fetchQuizzes, fetchQuiz, submitQuiz, deleteQuiz } from "../services/quizService.js";
import { fetchRoles } from "../services/rolesService.js";
import { useBranch } from "../context/BranchContext.jsx";

const selectStyle = {
  padding: "0.5rem 1rem", background: "var(--surface)", border: "1.5px solid var(--border)",
  borderRadius: "999px", color: "var(--text)", fontFamily: "var(--font-display)", fontWeight: 600,
};

export default function Quiz() {
  const location = useLocation();
  const { branch } = useBranch();
  const [quizzes, setQuizzes] = useState([]);
  const [active, setActive] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [roleId, setRoleId] = useState(location.state?.roleId || "");
  const [roles, setRoles] = useState([]);
  const [difficulty, setDifficulty] = useState("beginner");

  const load = useCallback(async () => {
    try {
      const res = await fetchQuizzes({ limit: 50 });
      setQuizzes(res.data || []);
    } catch {
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!branch) { setRoles([]); return; }
    fetchRoles({ branch, limit: 100 }).then((res) => setRoles(res.data || [])).catch(() => setRoles([]));
  }, [branch]);

  const open = async (id) => {
    try {
      const q = await fetchQuiz(id);
      setActive(q);
      setAnswers(new Array(q.questions.length).fill(null));
    } catch {
      toast.error("Failed to load quiz");
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim() && !roleId) return toast.error("Enter a topic or pick a role");
    setGenerating(true);
    try {
      const q = await generateQuiz({ topic: topic.trim() || undefined, roleId: roleId || undefined, difficulty });
      setTopic("");
      setRoleId("");
      setActive(q);
      setAnswers(new Array(q.questions.length).fill(null));
      toast.success("Quiz generated!");
      load();
    } catch (err) {
      toast.error(err.response?.status === 429 ? "AI is busy — try again shortly" : err.response?.data?.message || "Failed to generate quiz");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) return toast.error("Answer all questions first");
    try {
      const graded = await submitQuiz(active.id, answers);
      setActive(graded);
      toast.success(`Score: ${graded.score}%`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit quiz");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz?")) return;
    try {
      await deleteQuiz(id);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
      if (active?.id === id) setActive(null);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const submitted = !!active?.isCompleted;

  return (
    <div>
      <div className="page-hero">
        <h1>AI <span>Quizzes</span></h1>
        <p>Test yourself on any topic or role relevant to your branch</p>
      </div>

      <div className="section">
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ fontWeight: 700, marginBottom: "0.75rem", color: "var(--text)" }}>Generate a new quiz</div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <input
              className="search-input"
              style={{ flex: 1, minWidth: 200 }}
              placeholder="Topic — e.g. React Hooks, Circuit Theory, DSA"
              value={topic}
              maxLength={120}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} style={selectStyle}>
              <option value="">{branch ? "…or pick a role" : "No branch selected"}</option>
              {roles.map((r) => <option key={r._id} value={r._id}>{r.title}</option>)}
            </select>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={selectStyle}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              <FaPlus /> {generating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: active ? "260px 1fr" : "1fr", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {loading ? (
              <div className="empty"><p>Loading...</p></div>
            ) : quizzes.length === 0 ? (
              <div className="empty"><p>No quizzes yet</p></div>
            ) : (
              quizzes.map((q) => (
                <div
                  key={q.id}
                  onClick={() => open(q.id)}
                  style={{
                    background: active?.id === q.id ? "var(--primary-bg)" : "var(--surface)",
                    border: `1px solid ${active?.id === q.id ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: 10, padding: "0.875rem 1rem", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text)" }}>{q.title}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      {q.difficulty} {q.isCompleted ? `· ${q.score}%` : "· Not taken"}
                    </div>
                  </div>
                  <button className="btn btn-sm" style={{ background: "transparent", color: "var(--text-muted)" }} onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }} title="Delete"><FaTrash /></button>
                </div>
              ))
            )}
          </div>

          {active && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--text)", marginBottom: "0.5rem" }}>{active.title}</h2>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <span className="type-badge badge-core">{active.difficulty}</span>
                {submitted && <span className="branch-tag">Score: {active.score}%</span>}
              </div>

              {active.questions.map((q, qi) => {
                const userAnswer = submitted ? active.userAnswers?.[qi] : answers[qi];
                return (
                  <div key={q.id} style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--surface-mid)", borderRadius: 10 }}>
                    <div style={{ fontWeight: 600, marginBottom: "0.75rem", color: "var(--text)" }}>{qi + 1}. {q.questionText}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {q.options.map((opt) => {
                        let bg = "var(--surface)";
                        let border = "var(--border)";
                        if (!submitted && answers[qi] === opt) { bg = "var(--primary-bg)"; border = "var(--primary)"; }
                        if (submitted && opt === q.correctAnswer) { bg = "rgba(22,163,74,0.15)"; border = "var(--primary)"; }
                        if (submitted && opt === userAnswer && opt !== q.correctAnswer) { bg = "var(--error-bg)"; border = "var(--error)"; }
                        return (
                          <div
                            key={opt}
                            onClick={() => !submitted && setAnswers((prev) => prev.map((a, i) => (i === qi ? opt : a)))}
                            style={{ padding: "0.6rem 1rem", background: bg, border: `1.5px solid ${border}`, borderRadius: 8, cursor: submitted ? "default" : "pointer", fontSize: "0.875rem", color: "var(--text)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                          >
                            {opt}
                            {submitted && opt === q.correctAnswer && <FaCircleCheck style={{ color: "var(--primary)" }} />}
                            {submitted && opt === userAnswer && opt !== q.correctAnswer && <FaCircleXmark style={{ color: "var(--error)" }} />}
                          </div>
                        );
                      })}
                    </div>
                    {submitted && q.explanation && (
                      <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "var(--primary-bg)", borderRadius: 8, fontSize: "0.8rem", color: "var(--text-dim)" }}>{q.explanation}</div>
                    )}
                  </div>
                );
              })}

              {!submitted && <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleSubmit}>Submit Quiz</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
