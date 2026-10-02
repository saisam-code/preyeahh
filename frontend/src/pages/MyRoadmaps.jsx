import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();
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

  useEffect(() => {
    const roadmapId = location.state?.roadmapId;
    if (!roadmapId) return;
    navigate(`/roadmap/${roadmapId}`);
  }, [location.state?.roadmapId, navigate]);

  const select = (rm) => {
    navigate(`/roadmap/${idOf(rm)}`);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error("Enter a role or topic first");
    setGenerating(true);
    try {
      const rm = await generateRoadmap({ topic: topic.trim() });
      toast.success("Roadmap generated!");
      navigate(`/roadmap/${idOf(rm)}`);
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {loading ? (
              <div className="empty"><p>Loading...</p></div>
            ) : roadmaps.length === 0 ? (
              <div className="empty"><p>No roadmaps yet — generate one above</p></div>
            ) : (
              roadmaps.map((rm) => {
                const id = idOf(rm);
                const pct = percentDone(rm);
                return (
                  <div
                    key={id}
                    onClick={() => select(rm)}
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", cursor: "pointer" }}
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
        </div>
      </div>
    </div>
  );
}
