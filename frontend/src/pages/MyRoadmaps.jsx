import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp, FaCircleCheck, FaMap } from "react-icons/fa6";
import {
  generateRoadmap, fetchRoadmaps, fetchRoadmap, setTopicCompleted, deleteRoadmap,
} from "../services/aiRoadmapService.js";
import { useBranch } from "../context/BranchContext.jsx";

const idOf = (x) => x?._id || x?.id;

const percentDone = (rm) => {
  let total = 0, done = 0;
  rm.sections?.forEach((s) => s.topics?.forEach((t) => { total += 1; if (t.isCompleted) done += 1; }));
  return total ? Math.round((done / total) * 100) : 0;
};

export default function MyRoadmaps() {
  const { branch } = useBranch();
  const location = useLocation();
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRoadmaps({ limit: 50 });
      setRoadmaps(res.data || []);
    } catch {
      toast.error("Failed to load roadmaps");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const roadmapId = location.state?.roadmapId;
    if (!roadmapId) return;
    fetchRoadmap(roadmapId)
      .then((rm) => { setSelected(rm); setExpanded({ 0: true }); })
      .catch(() => {});
  }, [location.state?.roadmapId]);

  const selectCard = async (rm) => {
    const id = idOf(rm);
    if (idOf(selected) === id) { setSelected(null); setExpanded({}); return; }
    try {
      const full = await fetchRoadmap(id);
      setSelected(full);
      setExpanded({ 0: true });
    } catch {
      toast.error("Failed to load roadmap");
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error("Enter a role or topic first");
    setGenerating(true);
    try {
      const rm = await generateRoadmap({ topic: topic.trim() });
      setRoadmaps((prev) => [rm, ...prev]);
      setSelected(rm);
      setExpanded({ 0: true });
      setTopic("");
      toast.success("Roadmap generated!");
    } catch (err) {
      toast.error(err.response?.status === 429 ? "AI is busy — try again in a moment" : err.response?.data?.message || "Failed to generate roadmap");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTopic = async (topicId, current) => {
    if (!selected) return;
    try {
      const rm = await setTopicCompleted(idOf(selected), topicId, !current);
      setSelected(rm);
      setRoadmaps((prev) => prev.map((r) => (idOf(r) === idOf(rm) ? rm : r)));
    } catch {
      toast.error("Failed to update progress");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this roadmap?")) return;
    try {
      await deleteRoadmap(id);
      setRoadmaps((prev) => prev.filter((r) => idOf(r) !== id));
      if (idOf(selected) === id) { setSelected(null); setExpanded({}); }
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div>
      <div className="page-hero">
        <h1>My <span>Roadmaps</span></h1>
        <p>AI-generated learning paths personalised to your branch and profile</p>
      </div>

      <div className="section">
        {/* Generate box */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ fontWeight: 700, marginBottom: "0.75rem", color: "var(--text)" }}>Generate a new roadmap</div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <input
              className="search-input"
              style={{ flex: 1, minWidth: 220 }}
              placeholder={`e.g. Software Engineer, Data Scientist${branch ? ` (${branch})` : ""}`}
              value={topic}
              maxLength={120}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              <FaPlus /> {generating ? "Generating..." : "Generate"}
            </button>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            Tip: open any role on the Roles page and use "Generate AI Roadmap" to base it on that role's curated guidance.
          </p>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: selected ? "320px 1fr" : "1fr", gap: "1.5rem", alignItems: "start" }}>

          {/* LEFT: roadmap cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.85rem" }}>
            {loading ? (
              <div className="empty" style={{ gridColumn: "1 / -1" }}><p>Loading...</p></div>
            ) : roadmaps.length === 0 ? (
              <div className="empty" style={{ gridColumn: "1 / -1" }}><p>No roadmaps yet — generate one above</p></div>
            ) : (
              roadmaps.map((rm) => {
                const id = idOf(rm);
                const pct = percentDone(rm);
                const active = idOf(selected) === id;
                return (
                  <div
                    key={id}
                    onClick={() => selectCard(rm)}
                    style={{
                      background: active ? "var(--primary-bg)" : "var(--surface)",
                      border: `1.5px solid ${active ? "var(--primary)" : "var(--border)"}`,
                      borderRadius: "12px",
                      padding: "1rem",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                      position: "relative",
                    }}
                  >
                    {/* Delete button */}
                    <button
                      className="btn btn-sm"
                      style={{ position: "absolute", top: "8px", right: "8px", background: "transparent", color: "var(--text-muted)", padding: "2px 6px" }}
                      onClick={(e) => { e.stopPropagation(); handleDelete(id); }}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>

                    {/* Level badge */}
                    <span className="type-badge badge-core" style={{ alignSelf: "flex-start", fontSize: "0.65rem" }}>{rm.level}</span>

                    {/* Title */}
                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text)", lineHeight: 1.3, paddingRight: "1.5rem" }}>{rm.title}</div>

                    {/* Meta */}
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{rm.branch || "General"} · {rm.estimatedWeeks} weeks</div>

                    {/* Progress */}
                    <div style={{ marginTop: "auto" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                        <span>Progress</span><span>{pct}%</span>
                      </div>
                      <div style={{ height: 5, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--primary)", transition: "width 0.3s" }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT: selected roadmap detail */}
          {selected && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--text)", margin: 0 }}>{selected.title}</h2>
                <button
                  className="btn btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "1rem" }}
                  onClick={() => navigate(`/roadmap/${idOf(selected)}`)}
                >
                  <FaMap /> Visual Roadmap
                </button>
              </div>

              {selected.description && (
                <p style={{ color: "var(--text-dim)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{selected.description}</p>
              )}

              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.25rem" }}>
                <span className="branch-tag">{selected.branch || "General"}</span>
                <span className="type-badge badge-core">{selected.level}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{selected.estimatedWeeks} weeks</span>
              </div>

              {/* Fit snapshot */}
              {(selected.fitSnapshot?.whyThisFits?.length || selected.fitSnapshot?.whyNotAlternatives?.length) ? (
                <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "1rem 0", marginBottom: "1.25rem" }}>
                  <h3 style={{ fontSize: "0.9rem", color: "var(--text)", marginBottom: "0.65rem" }}>Personalised fit snapshot</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                    {selected.fitSnapshot.whyThisFits?.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: "0.8rem", color: "var(--primary-dim)", marginBottom: "0.3rem" }}>Why this roadmap fits</h4>
                        <ul style={{ paddingLeft: "1.1rem", color: "var(--text-dim)", fontSize: "0.78rem" }}>
                          {selected.fitSnapshot.whyThisFits.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                    <div>
                      <h4 style={{ fontSize: "0.8rem", color: "var(--text)", marginBottom: "0.3rem" }}>Why this path over alternatives</h4>
                      {selected.fitSnapshot.whyNotAlternatives?.length > 0 ? (
                        <ul style={{ paddingLeft: "1.1rem", color: "var(--text-dim)", fontSize: "0.78rem" }}>
                          {selected.fitSnapshot.whyNotAlternatives.map((a, i) => (
                            <li key={i}><strong>{a.path}:</strong> {a.tradeoff}</li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>No alternative comparison available.</p>
                      )}
                    </div>
                  </div>
                  {selected.fitSnapshot.basedOn?.length > 0 && (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "0.65rem" }}>
                      Based on: {selected.fitSnapshot.basedOn.join(" · ")}
                    </p>
                  )}
                </section>
              ) : null}

              {/* Timeline sections */}
              <div className="roadmap-timeline">
                {selected.sections?.map((section, si) => (
                  <div key={idOf(section) || si} className="roadmap-node">
                    <div className="roadmap-node-marker"></div>
                    <div className="roadmap-node-content" onClick={() => setExpanded((p) => ({ ...p, [si]: !p[si] }))}>
                      <div className="roadmap-node-header">
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>{section.title}</div>
                        {expanded[si] ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                      {expanded[si] && (
                        <div className="roadmap-node-topics">
                          {section.topics?.map((tp) => (
                            <div
                              key={idOf(tp)}
                              className={`roadmap-topic-card ${tp.isCompleted ? "completed" : ""}`}
                              onClick={(e) => { e.stopPropagation(); handleToggleTopic(idOf(tp), tp.isCompleted); }}
                            >
                              <FaCircleCheck className="roadmap-topic-icon" />
                              <div>
                                <div className="roadmap-topic-title">{tp.title}</div>
                                <div className="roadmap-topic-desc">{tp.description}</div>
                                {tp.resources?.length > 0 && (
                                  <div className="roadmap-resources">
                                    {tp.resources.map((r, ri) =>
                                      r.url ? (
                                        <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer" className="resource-link" onClick={(e) => e.stopPropagation()}>{r.title} ↗</a>
                                      ) : (
                                        <span key={ri} className="resource-text">{r.title}</span>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
