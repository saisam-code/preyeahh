import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaShieldHalved, FaUserGraduate } from "react-icons/fa6";
import { getParentWardDetail, getParentWards, requestParentLink } from "../services/parentService.js";
import "./ParentPortal.css";

export default function ParentPortal() {
  const [links, setLinks] = useState([]);
  const [details, setDetails] = useState({});
  const [studentCode, setStudentCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const currentLinks = await getParentWards();
      setLinks(currentLinks);
      const activeLinks = currentLinks.filter((link) => link.status === "ACTIVE" && link.student?._id);
      const loaded = await Promise.all(activeLinks.map(async (link) => {
        const detail = await getParentWardDetail(link.student._id);
        return [link.student._id, detail];
      }));
      setDetails(Object.fromEntries(loaded));
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load linked student accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const handleLinkRequest = async (event) => {
    event.preventDefault();
    if (!studentCode.trim()) return toast.error("Enter the link code shared by the student");
    setSubmitting(true);
    try {
      await requestParentLink(studentCode.trim());
      setStudentCode("");
      toast.success("Request sent. The student must approve it before you can view their details.");
      await loadLinks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send parent link request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="parent-portal page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">Parent workspace</p>
          <h1>Student connections</h1>
          <p>Connect with a student using their link code and review the information they have chosen to share.</p>
        </div>
      </header>

      <aside className="parent-privacy-notice" role="note">
        <FaShieldHalved aria-hidden="true" />
        <p>Student approval and sharing permissions are required. Chat transcripts and private AI sessions are never shown here.</p>
      </aside>

      <section className="card" aria-labelledby="parent-link-heading">
        <h2 id="parent-link-heading">Connect a student</h2>
        <p>Ask the student to generate a parent link code in their Profile, then enter it here. The code only starts a request; the student still approves access.</p>
        <form onSubmit={handleLinkRequest} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <label className="sr-only" htmlFor="student-link-code">Student link code</label>
          <input
            id="student-link-code"
            autoComplete="off"
            maxLength={24}
            value={studentCode}
            onChange={(event) => setStudentCode(event.target.value.toUpperCase())}
            placeholder="Enter student link code"
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Sending request..." : "Request connection"}
          </button>
        </form>
      </section>

      <section aria-label="Linked student accounts">
        <h2>Connected students</h2>
        {loading ? (
          <p role="status">Loading student connections…</p>
        ) : links.length === 0 ? (
          <div className="empty-state">
            <FaUserGraduate aria-hidden="true" />
            <h3>No student connections yet</h3>
            <p>Enter a student link code above to request a connection.</p>
          </div>
        ) : (
          <ul className="parent-linked-students">
            {links.map((link) => {
              const student = link.student;
              const detail = student?._id ? details[student._id] : null;
              return (
                <li className="card parent-linked-student" key={link.linkId}>
                  {link.status === "PENDING" ? (
                    <div>
                      <h3>Awaiting student approval</h3>
                      <p>The student will appear here after approving your request.</p>
                    </div>
                  ) : (
                    <div style={{ width: "100%" }}>
                      <h3>{student?.name || "Student"}</h3>
                      <p>{student?.branch || "Domain not specified"}{student?.preferences?.educationStage ? ` · ${student.preferences.educationStage}` : ""}</p>
                      {detail?.roles?.length > 0 && (
                        <div style={{ marginTop: "1rem" }}>
                          <strong>Roles and domains</strong>
                          <ul>
                            {detail.roles.map((role, index) => (
                              <li key={`${role.title}-${index}`}>
                                {role.title}{role.domain ? ` · ${role.domain}` : ""} · {role.committed ? "Committed" : "Exploring"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {detail?.performance && (
                        <div style={{ marginTop: "1rem" }}>
                          <strong>Learning performance</strong>
                          <p>
                            Roadmaps: {detail.performance.learning.completedTopics}/{detail.performance.learning.totalTopics} topics
                            {" · "}Quiz average: {detail.performance.quizzes.averageScore}%
                            {" · "}{detail.performance.quizzes.completedQuizzes} quizzes completed
                          </p>
                        </div>
                      )}
                      {!detail && <p role="status">Loading shared progress…</p>}
                    </div>
                  )}
                  <span className={`parent-linked-student-badge ${link.status === "ACTIVE" ? "is-verified" : ""}`}>
                    {link.status === "ACTIVE" ? "Connected" : "Pending"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
