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
  const [selected, setSelected] = useState(null);   // expanded card
  const [expanded, setExpanded] = useState({});      // section accordion state inside card
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
    // If navigated here with a specific roadmap, auto-expand it
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
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
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
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>
            Tip: open any role on the Roles page and use "Generate AI Roadmap" to base it on that role's curated guidance.
          </p>
        </div>

        {/* Roadmap cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loading ? (
            <div className="empty"><p>Loading...</p></div>
          ) : roadmaps.length === 0 ? (
            <div className="empty"><p>No roadmaps yet — generate one above</p></div>
          ) : (
            roadmaps.map((rm) => {
              const id = idOf(rm);
              const pct = percentDone(rm);
              const isOpen = idOf(selected) === id;

              return (
                <div
                  key={id}
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${isOpen ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: "12px",
                    overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Card header — click to expand */}
                  <div
                    onClick={() => selectCard(rm)}
                    style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem" }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>{rm.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                        {rm.branch || "General"} · {rm.level} · {rm.estimatedWeeks} weeks
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: 100, flexShrink: 0 }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "3px", textAlign: "right" }}>{pct}%</div>
                      <div style={{ height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--primary)", transition: "width 0.3s" }} />
                      </div>
                    </div>

                    {/* Visual Roadmap button */}
                    <button
                      className="btn btn-sm"
                      style={{ background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/roadmap/${id}`); }}
                      title="Open visual roadmap"
                    >
                      <FaMap /> Visual
                    </button>

                    {/* Delete */}
                    <button
                      className="btn btn-sm"
                      style={{ background: "transparent", color: "var(--text-muted)", flexShrink: 0 }}
                      onClick={(e) => { e.stopPropagation(); handleDelete(id); }}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>

                    {isOpen ? <FaChevronUp style={{ color: "var(--text-muted)", flexShrink: 0 }} /> : <FaChevronDown style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
                  </div>

                  {/* Expanded: sections accordion */}
                  {isOpen && selected && (
                    <div style={{ borderTop: "1px solid var(--border)", padding: "1rem 1.25rem" }}>
                      {selected.description && (
                        <p style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginBottom: "1rem" }}>{selected.description}</p>
                      )}

                      <div className="roadmap-timeline">
                        {selected.sections?.map((section, si) => (
                          <div key={idOf(section) || si} className="roadmap-node">
                            <div className="roadmap-node-marker"></div>
                            <div
                              className="roadmap-node-content"
                              onClick={() => setExpanded((p) => ({ ...p, [si]: !p[si] }))}
                            >
                              <div className="roadmap-node-header">
                                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>{section.title}</div>
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
