import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp, FaCircleCheck } from "react-icons/fa6";
import {
  generateRoadmap, fetchRoadmaps, fetchRoadmap, setTopicCompleted, deleteRoadmap,
} from "../services/aiRoadmapService.js";
import { useBranch } from "../context/BranchContext.jsx";

const idOf = (x) => x?._id || x?.id;

const percentDone = (rm) => {
  let total = 0;
  let done = 0;
  rm.sections?.forEach((s) => s.topics?.forEach((t) => { total += 1; if (t.isCompleted) done += 1; }));
  return total ? Math.round((done / total) * 100) : 0;
};

export default function MyRoadmaps() {
  const { branch } = useBranch();
  const [roadmaps, setRoadmaps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [expanded, setExpanded] = useState({});

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

  const select = async (rm) => {
    try {
      setSelected(await fetchRoadmap(idOf(rm)));
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
      if (idOf(selected) === id) setSelected(null);
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
            Tip: open any role on the Roles page and use “Generate AI Roadmap” to base it on that role's curated guidance.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: selected ? "300px 1fr" : "1fr", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {loading ? (
              <div className="empty"><p>Loading...</p></div>
            ) : roadmaps.length === 0 ? (
              <div className="empty"><p>No roadmaps yet — generate one above</p></div>
            ) : (
              roadmaps.map((rm) => {
                const id = idOf(rm);
                const pct = percentDone(rm);
                const active = idOf(selected) === id;
                return (
                  <div
                    key={id}
                    onClick={() => select(rm)}
                    style={{ background: active ? "var(--primary-bg)" : "var(--surface)", border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`, borderRadius: "10px", padding: "1rem", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>{rm.title}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{rm.level} · {rm.estimatedWeeks} weeks</div>
                      </div>
                      <button className="btn btn-sm" style={{ background: "transparent", color: "var(--text-muted)" }} onClick={(e) => { e.stopPropagation(); handleDelete(id); }} title="Delete"><FaTrash /></button>
                    </div>
                    <div style={{ marginTop: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}><span>Progress</span><span>{pct}%</span></div>
                      <div style={{ height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--primary)", transition: "width 0.3s" }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selected && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--text)", marginBottom: "0.5rem" }}>{selected.title}</h2>
              <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>{selected.description}</p>
              <div style={{ display: "flex", gap: "0.75rem", margin: "0.75rem 0 1.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <span className="branch-tag">{selected.branch || "General"}</span>
                <span className="type-badge badge-core">{selected.level}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{selected.estimatedWeeks} weeks</span>
              </div>

              {selected.sections?.map((section, si) => (
                <div key={idOf(section) || si} style={{ marginBottom: "1rem", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
                  <div
                    onClick={() => setExpanded((p) => ({ ...p, [si]: !p[si] }))}
                    style={{ padding: "0.875rem 1rem", background: "var(--surface-mid)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>{section.title}</div>
                    {expanded[si] ? <FaChevronUp /> : <FaChevronDown />}
                  </div>

                  {expanded[si] && (
                    <div style={{ padding: "0.75rem" }}>
                      {section.topics?.map((tp) => (
                        <div
                          key={idOf(tp)}
                          style={{ display: "flex", gap: "0.75rem", padding: "0.75rem", borderRadius: 8, background: tp.isCompleted ? "var(--primary-bg)" : "transparent", marginBottom: "0.5rem", cursor: "pointer" }}
                          onClick={() => handleToggleTopic(idOf(tp), tp.isCompleted)}
                        >
                          <FaCircleCheck style={{ color: tp.isCompleted ? "var(--primary)" : "var(--border)", marginTop: 2, flexShrink: 0, fontSize: "1.1rem" }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text)", textDecoration: tp.isCompleted ? "line-through" : "none" }}>{tp.title}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{tp.description}</div>
                            {tp.resources?.length > 0 && (
                              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                {tp.resources.map((r, ri) =>
                                  r.url ? (
                                    <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer" className="resource-link" onClick={(e) => e.stopPropagation()} style={{ fontSize: "0.75rem" }}>{r.title} ↗</a>
                                  ) : (
                                    <span key={ri} style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.title}</span>
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
