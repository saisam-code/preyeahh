import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaUsers, FaBullseye, FaCompass, FaBookOpen, FaEnvelope, FaChartLine, FaEye, FaEyeSlash } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchGuideBranchOverview, fetchGuideStudentActivity } from "../services/guideService.js";
import AdminRoles from "../components/admin/AdminRoles.jsx";
import AdminBeyond from "../components/admin/AdminBeyond.jsx";
import AdminGuidance from "../components/admin/AdminGuidance.jsx";
import GuideResources from "../components/admin/GuideResources.jsx";

export default function GuidePanel() {
  const { user, initialized } = useAuth();
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState(null);
  const [activityStudentId, setActivityStudentId] = useState(null);
  const [activityLoadingId, setActivityLoadingId] = useState(null);

  useEffect(() => {
    if (!initialized || !user || user.role !== "guide") return;
    fetchGuideBranchOverview().then((data) => setOverview(data)).catch(() => setOverview(null));
  }, [initialized, user]);

  if (!initialized || !user || user.role !== "guide") return null;

  const jumpTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const toggleActivity = async (studentId) => {
    if (activityStudentId === studentId) {
      setActivityStudentId(null);
      setActivity(null);
      return;
    }
    setActivityLoadingId(studentId);
    setActivityStudentId(studentId);
    try {
      setActivity(await fetchGuideStudentActivity(studentId));
    } catch (error) {
      setActivityStudentId(null);
      toast.error(error.response?.data?.message || "Could not load shared student activity");
    } finally {
      setActivityLoadingId(null);
    }
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-hero">
        <div>
          <div className="dashboard-role-badge">Guide Workspace</div>
          <h1>
            Branch management for <span>{user.branch}</span>
          </h1>
        </div>
        <p>
          Manage your branch roles, guidance, beyond opportunities, and resources while staying close to students who are following your path.
        </p>
      </div>

      {overview && (
        <div className="dashboard-grid" style={{ marginBottom: "1.5rem" }}>
          <button type="button" className="dashboard-card dashboard-card--highlight" onClick={() => jumpTo("guide-students")}>
            <div className="dashboard-card-icon"><FaUsers /></div>
            <div>
              <h3>{overview.totalInterestedStudents}</h3>
              <p>Students following your roles</p>
            </div>
          </button>
          <button type="button" className="dashboard-card" onClick={() => jumpTo("guide-students")}>
            <div className="dashboard-card-icon"><FaEye /></div>
            <div>
              <h3>{overview.totalActivitySharedStudents}</h3>
              <p>Students sharing AI activity</p>
            </div>
          </button>
          <button type="button" className="dashboard-card" onClick={() => jumpTo("guide-roles")}>
            <div className="dashboard-card-icon"><FaCompass /></div>
            <div>
              <h3>{overview.totalRoles}</h3>
              <p>Role entries</p>
            </div>
          </button>
          <button type="button" className="dashboard-card" onClick={() => jumpTo("guide-guidance")}>
            <div className="dashboard-card-icon"><FaBookOpen /></div>
            <div>
              <h3>{overview.totalGuidance}</h3>
              <p>Guidance entries</p>
            </div>
          </button>
          <button type="button" className="dashboard-card" onClick={() => jumpTo("guide-beyond")}>
            <div className="dashboard-card-icon"><FaBullseye /></div>
            <div>
              <h3>{overview.totalBeyond}</h3>
              <p>Beyond entries</p>
            </div>
          </button>
        </div>
      )}

      {overview && (
        <section id="guide-students" style={{ marginBottom: "2rem", scrollMarginTop: "5rem" }}>
          <div className="admin-header">
            <h2>Students following your roles</h2>
            <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{overview.students?.length || 0} tracked</span>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Current</th>
                <th>Target</th>
                <th>Interests</th>
                <th>AI activity</th>
              </tr>
            </thead>
            <tbody>
              {overview.students?.map((student) => (
                <>
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.contactShared ? <a href={`mailto:${student.email}`}><FaEnvelope /> {student.email}</a> : <span style={{ color: "var(--text-muted)" }}>Not shared</span>}</td>
                    <td>{student.currentRole || "—"}</td>
                    <td>{student.targetRole || "—"}</td>
                    <td>{student.interests.length ? student.interests.map((item) => item.role).join(", ") : "No tracked interests"}</td>
                    <td>
                      {student.activityShared ? (
                        <button className="btn btn-outline btn-sm" onClick={() => toggleActivity(student.id)}>
                          {activityLoadingId === student.id ? "Loading..." : activityStudentId === student.id ? <><FaEyeSlash /> Hide</> : <><FaEye /> View shared activity</>}
                        </button>
                      ) : <span style={{ color: "var(--text-muted)" }}>Not shared</span>}
                    </td>
                  </tr>
                  {activityStudentId === student.id && (
                    <tr key={`${student.id}-activity`}>
                      <td colSpan={6}>
                        {activityLoadingId === student.id ? <p>Loading shared activity...</p> : activity && (
                          <div style={{ display: "grid", gap: "1rem", padding: "0.75rem 0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                              <FaEye /> Shared by the student · view-only
                            </div>
                            <section>
                              <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Roadmap progress</h3>
                              {activity.roadmaps.length ? activity.roadmaps.map((roadmap) => (
                                <p key={roadmap.id} style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>
                                  {roadmap.title} · {roadmap.completedTopics}/{roadmap.totalTopics} topics · {roadmap.estimatedWeeks} weeks
                                </p>
                              )) : <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No roadmaps saved.</p>}
                            </section>
                            <section>
                              <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Shared AI chats</h3>
                              {activity.chats.length ? activity.chats.map((chat) => (
                                <div key={chat.id} style={{ borderTop: "1px solid var(--border)", padding: "0.65rem 0" }}>
                                  <strong style={{ fontSize: "0.85rem" }}>{chat.title}</strong>
                                  <div style={{ display: "grid", gap: "0.4rem", marginTop: "0.5rem" }}>
                                    {chat.messages.map((message, index) => (
                                      <p key={`${chat.id}-${index}`} style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                                        <strong>{message.role === "user" ? student.name : "AI"}:</strong> {message.content}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )) : <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No active shared chats.</p>}
                            </section>
                            <section>
                              <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Shared AI quizzes</h3>
                              {activity.quizzes.length ? activity.quizzes.map((quiz) => (
                                <details key={quiz.id} style={{ borderTop: "1px solid var(--border)", padding: "0.65rem 0" }}>
                                  <summary style={{ cursor: "pointer", fontSize: "0.85rem" }}>
                                    {quiz.title} · {quiz.isCompleted ? `${quiz.score}%` : "In progress"}
                                  </summary>
                                  {quiz.questions.map((question, index) => (
                                    <div key={`${quiz.id}-${index}`} style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text-dim)" }}>
                                      <p>{question.questionText}</p>
                                      {question.selectedAnswer && <p>Student answer: {question.selectedAnswer}</p>}
                                      {question.correctAnswer && <p>Correct answer: {question.correctAnswer}. {question.explanation}</p>}
                                    </div>
                                  ))}
                                </details>
                              )) : <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No active shared quizzes.</p>}
                            </section>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {!overview.students?.length && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>No students are following your assigned roles yet.</td></tr>}
            </tbody>
          </table>
        </section>
      )}

      <div style={{ display: "grid", gap: "2rem" }}>
        <section id="guide-roles" style={{ scrollMarginTop: "5rem" }}><AdminRoles fixedBranch={user.branch} /></section>
        <section id="guide-guidance" style={{ scrollMarginTop: "5rem" }}><AdminGuidance fixedBranch={user.branch} /></section>
        <section id="guide-beyond" style={{ scrollMarginTop: "5rem" }}><AdminBeyond fixedBranch={user.branch} /></section>
        <GuideResources branch={user.branch} />
      </div>
    </div>
  );
}
