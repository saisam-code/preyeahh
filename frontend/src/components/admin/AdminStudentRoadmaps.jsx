import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft, FaMap, FaCheck, FaCircle, FaChevronDown, FaChevronUp, FaLink } from "react-icons/fa6";
import { fetchStudentRoadmaps } from "../../services/adminService.js";

function ProgressBar({ completed, total }) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.3rem" }}>
        <span>{completed}/{total} topics</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "var(--surface-2, rgba(255,255,255,0.08))", borderRadius: 99 }}>
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            background: pct === 100 ? "#10b981" : "linear-gradient(90deg,#6366f1,#8b5cf6)",
            width: `${pct}%`,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function AdminStudentRoadmaps({ student, onBack }) {
  const [data, setData] = useState(null); // { student, roadmaps }
  const [loading, setLoading] = useState(true);
  const [openRoadmap, setOpenRoadmap] = useState(null);
  const [openSection, setOpenSection] = useState(null);

  useEffect(() => {
    if (!student?._id) return;
    setLoading(true);
    setOpenRoadmap(null);
    setOpenSection(null);
    fetchStudentRoadmaps(student._id)
      .then((r) => setData(r.data))
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load roadmaps"))
      .finally(() => setLoading(false));
  }, [student]);

  if (loading) {
    return (
      <div className="empty" style={{ padding: "4rem 0" }}>
        <div className="icon"><i className="fa fa-spinner fa-spin" /></div>
        <p>Loading roadmaps…</p>
      </div>
    );
  }

  const roadmaps = data?.roadmaps || [];
  const studentInfo = data?.student || student;

  return (
    <div>
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button className="btn btn-outline btn-sm" onClick={onBack}>
            <FaArrowLeft /> Back
          </button>
          <div>
            <h2 style={{ margin: 0 }}>
              <FaMap style={{ marginRight: "0.5rem", color: "var(--accent)" }} />
              AI Roadmaps — {studentInfo?.name}
            </h2>
            <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
              {studentInfo?.email} · {roadmaps.length} roadmap{roadmaps.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {!roadmaps.length ? (
        <div className="empty" style={{ padding: "4rem 0" }}>
          <div className="icon"><FaMap /></div>
          <p>This student hasn't generated any roadmaps yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {roadmaps.map((roadmap) => {
            const allTopics = roadmap.sections?.flatMap((s) => s.topics) || [];
            const completedTopics = allTopics.filter((t) => t.isCompleted).length;
            const isOpen = openRoadmap === roadmap._id;

            return (
              <div key={roadmap._id} className="roadmap-card-admin">
                <div className="roadmap-card-header" onClick={() => setOpenRoadmap(isOpen ? null : roadmap._id)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "1rem" }}>{roadmap.title}</strong>
                      {roadmap.isCompleted && (
                        <span style={{ fontSize: "0.75rem", background: "#10b981", color: "#fff", padding: "0.15rem 0.5rem", borderRadius: 99 }}>
                          <FaCheck /> Complete
                        </span>
                      )}
                      <span className={`type-badge badge-${roadmap.level}`} style={{ fontSize: "0.72rem" }}>
                        {roadmap.level}
                      </span>
                    </div>
                    {roadmap.description && (
                      <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.83rem" }}>{roadmap.description}</p>
                    )}
                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                      {roadmap.branch && <span className="branch-tag" style={{ fontSize: "0.72rem" }}>{roadmap.branch}</span>}
                      {roadmap.roleId && (
                        <span className="type-badge badge-core" style={{ fontSize: "0.72rem" }}>
                          {roadmap.roleId.title}
                        </span>
                      )}
                      <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                        ~{roadmap.estimatedWeeks}w · {roadmap.sections?.length || 0} sections
                      </span>
                    </div>
                    <ProgressBar completed={completedTopics} total={allTopics.length} />
                  </div>
                  <div style={{ paddingLeft: "1rem" }}>
                    {isOpen ? <FaChevronUp style={{ color: "var(--muted)" }} /> : <FaChevronDown style={{ color: "var(--muted)" }} />}
                  </div>
                </div>

                {isOpen && (
                  <div className="roadmap-sections-admin">
                    {/* Fit Snapshot */}
                    {roadmap.fitSnapshot?.whyThisFits?.length > 0 && (
                      <div className="fit-snapshot-admin">
                        <div className="fit-title">Why this fits</div>
                        <ul>
                          {roadmap.fitSnapshot.whyThisFits.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                        {roadmap.fitSnapshot.basedOn?.length > 0 && (
                          <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.4rem" }}>
                            Based on: {roadmap.fitSnapshot.basedOn.join(", ")}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sections */}
                    {(roadmap.sections || []).map((section) => {
                      const sKey = section._id;
                      const isSectionOpen = openSection === sKey;
                      const sectionCompleted = section.topics.filter((t) => t.isCompleted).length;

                      return (
                        <div key={sKey} className="roadmap-section-admin">
                          <div
                            className="roadmap-section-header"
                            onClick={() => setOpenSection(isSectionOpen ? null : sKey)}
                          >
                            <div>
                              <strong>{section.title}</strong>
                              <span style={{ marginLeft: "0.75rem", fontSize: "0.78rem", color: "var(--muted)" }}>
                                {sectionCompleted}/{section.topics.length} done
                              </span>
                            </div>
                            {isSectionOpen ? <FaChevronUp /> : <FaChevronDown />}
                          </div>

                          {isSectionOpen && (
                            <div className="roadmap-topics-admin">
                              {section.topics.map((topic) => (
                                <div key={topic._id} className={`roadmap-topic-admin ${topic.isCompleted ? "completed" : ""}`}>
                                  <div className="topic-check">
                                    {topic.isCompleted ? <FaCheck style={{ color: "#10b981" }} /> : <FaCircle style={{ color: "var(--muted)", fontSize: "0.5rem" }} />}
                                  </div>
                                  <div className="topic-body">
                                    <strong className={topic.isCompleted ? "line-through" : ""}>{topic.title}</strong>
                                    {topic.description && <p>{topic.description}</p>}
                                    {topic.resources?.length > 0 && (
                                      <div className="topic-resources">
                                        {topic.resources.map((res, ri) => (
                                          <a
                                            key={ri}
                                            href={res.url || "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="resource-chip"
                                            title={res.url}
                                          >
                                            <FaLink /> {res.title}
                                            {res.type && <em> ({res.type})</em>}
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.75rem", textAlign: "right" }}>
                      Generated {new Date(roadmap.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
