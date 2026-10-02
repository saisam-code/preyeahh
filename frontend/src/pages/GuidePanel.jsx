import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaBullseye, FaCompass, FaBookOpen, FaEnvelope, FaUser, FaComments } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchGuideBranchOverview } from "../services/guideService.js";
import AdminRoles from "../components/admin/AdminRoles.jsx";
import AdminBeyond from "../components/admin/AdminBeyond.jsx";
import AdminGuidance from "../components/admin/AdminGuidance.jsx";
import GuideResources from "../components/admin/GuideResources.jsx";

export default function GuidePanel() {
  const { user, initialized } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [activeSection, setActiveSection] = useState("students");

  useEffect(() => {
    if (!initialized || !user || user.role !== "guide") return;
    fetchGuideBranchOverview().then((data) => setOverview(data)).catch(() => setOverview(null));
  }, [initialized, user]);

  if (!initialized || !user || user.role !== "guide") return null;

  const jumpTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="dashboard-shell">
      <div className="dashboard-hero">
        <div>
          <div className="dashboard-role-badge">Guide Workspace</div>
          <h1>
            Branch management for <span>{user.branch}</span>
          </h1>
        </div>
        <p>Keep student management separate from your branch content duties.</p>
      </div>

      <div className="type-tabs" role="tablist" aria-label="Guide dashboard sections" style={{ margin: "0 0 1.5rem" }}>
        <button type="button" role="tab" aria-selected={activeSection === "students"} className={`tab ${activeSection === "students" ? "active" : ""}`} onClick={() => setActiveSection("students")}>
          <FaUsers /> Student management
        </button>
        <button type="button" role="tab" aria-selected={activeSection === "duties"} className={`tab ${activeSection === "duties" ? "active" : ""}`} onClick={() => setActiveSection("duties")}>
          <FaCompass /> Content duties
        </button>
      </div>

      {activeSection === "students" && overview && (
        <>
          <div className="dashboard-grid" style={{ marginBottom: "1.5rem" }}>
            <button type="button" className="dashboard-card dashboard-card--highlight" onClick={() => jumpTo("guide-students")}>
              <div className="dashboard-card-icon"><FaUsers /></div>
              <div><h3>{overview.totalInterestedStudents}</h3><p>Students following your roles</p></div>
            </button>
            <button type="button" className="dashboard-card" onClick={() => jumpTo("guide-students")}>
              <div className="dashboard-card-icon"><FaEnvelope /></div>
              <div><h3>{overview.totalContactSharedStudents}</h3><p>Students sharing email</p></div>
            </button>
            <button type="button" className="dashboard-card" onClick={() => jumpTo("guide-students")}>
              <div className="dashboard-card-icon"><FaUser /></div>
              <div><h3>{overview.totalProfileSharedStudents}</h3><p>Students sharing profile and progress</p></div>
            </button>
          </div>
        <section id="guide-students" style={{ marginBottom: "2rem", scrollMarginTop: "5rem" }}>
          <div className="admin-header">
            <h2>Students following your roles</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{overview.students?.length || 0} tracked</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate("/chat")}><FaComments /> Open chat</button>
            </div>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Current</th>
                <th>Target</th>
                <th>Interests</th>
                <th>Progress snapshot</th>
              </tr>
            </thead>
            <tbody>
              {overview.students?.map((student) => (
                <tr key={student.id}>
                  <td>
                    <strong>{student.name}</strong>
                    {student.profile && (
                      <details style={{ marginTop: "0.35rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        <summary style={{ cursor: "pointer" }}>Profile basics</summary>
                        <div style={{ marginTop: "0.35rem" }}>
                          <p>Skills: {student.profile.skills?.join(", ") || "Not listed"}</p>
                          <p>Goals: {student.profile.goals?.join(", ") || "Not listed"}</p>
                          <p>Interests: {student.profile.interests?.join(", ") || "Not listed"}</p>
                          <p>Level: {student.profile.experienceLevel || "Not listed"} · Style: {student.profile.learningStyle || "Not listed"}</p>
                        </div>
                      </details>
                    )}
                  </td>
                  <td>{student.contactShared ? <a href={`mailto:${student.email}`}><FaEnvelope /> {student.email}</a> : <span style={{ color: "var(--text-muted)" }}>Not shared</span>}</td>
                  <td>{student.profile?.currentRole || <span style={{ color: "var(--text-muted)" }}>Not shared</span>}</td>
                  <td>{student.profile?.targetRole || <span style={{ color: "var(--text-muted)" }}>Not shared</span>}</td>
                  <td>{student.interests.length ? student.interests.map((item) => item.role).join(", ") : "No tracked interests"}</td>
                  <td>{student.trackRecord ? `${student.trackRecord.completedRoadmapTopics}/${student.trackRecord.totalRoadmapTopics} roadmap topics · ${student.trackRecord.completedQuizzes} completed quizzes · ${student.trackRecord.averageQuizScore ?? "—"}% average` : <span style={{ color: "var(--text-muted)" }}>Not shared</span>}</td>
                </tr>
              ))}
              {!overview.students?.length && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>No students are following your assigned roles yet.</td></tr>}
            </tbody>
          </table>
        </section>
        </>
      )}

      {activeSection === "duties" && overview && (
        <>
          <div className="dashboard-grid" style={{ marginBottom: "1.5rem" }}>
            <button type="button" className="dashboard-card dashboard-card--highlight" onClick={() => jumpTo("guide-roles")}>
              <div className="dashboard-card-icon"><FaCompass /></div>
              <div><h3>{overview.totalRoles}</h3><p>Role entries</p></div>
            </button>
            <button type="button" className="dashboard-card" onClick={() => jumpTo("guide-guidance")}>
              <div className="dashboard-card-icon"><FaBookOpen /></div>
              <div><h3>{overview.totalGuidance}</h3><p>Guidance entries</p></div>
            </button>
            <button type="button" className="dashboard-card" onClick={() => jumpTo("guide-beyond")}>
              <div className="dashboard-card-icon"><FaBullseye /></div>
              <div><h3>{overview.totalBeyond}</h3><p>Beyond entries</p></div>
            </button>
          </div>
          <div style={{ display: "grid", gap: "2rem" }}>
            <section id="guide-roles" style={{ scrollMarginTop: "5rem" }}><AdminRoles fixedBranch={user.branch} currentUserId={user.id} /></section>
            <section id="guide-guidance" style={{ scrollMarginTop: "5rem" }}><AdminGuidance fixedBranch={user.branch} currentUserId={user.id} /></section>
            <section id="guide-beyond" style={{ scrollMarginTop: "5rem" }}><AdminBeyond fixedBranch={user.branch} currentUserId={user.id} /></section>
            <GuideResources branch={user.branch} currentUserId={user.id} />
          </div>
        </>
      )}
    </div>
  );
}
