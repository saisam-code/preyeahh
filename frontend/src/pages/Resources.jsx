import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { searchResources, recordResourceView } from "../services/resourceService.js";
import { useBranch } from "../context/BranchContext.jsx";

const TYPE_COLORS = {
  video: "#ef4444", article: "#3b82f6", documentation: "#8b5cf6", course: "#f97316",
  book: "#14b8a6", practice: "#22c55e", github: "#6b7280",
};

export default function Resources() {
  const { branch } = useBranch();
  const [resources, setResources] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [technology, setTechnology] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [page, setPage] = useState(1);
  const [applied, setApplied] = useState({ q: "", technology: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchResources({
        q: applied.q || undefined,
        technology: applied.technology || undefined,
        branch: branch || undefined,
        difficulty: difficulty !== "all" ? difficulty : undefined,
        page,
        limit: 12,
      });
      setResources(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, totalPages: 1 });
    } catch {
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, [applied, branch, difficulty, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = () => { setPage(1); setApplied({ q: query.trim(), technology: technology.trim() }); };

  const handleOpen = (r) => {
    if (!r.url) return;
    recordResourceView(r.id).catch(() => {});
    window.open(r.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <div className="page-hero">
        <h1>Resource <span>Library</span></h1>
        <p>Curated learning resources{branch ? ` for ${branch}` : ""} — filter by technology and level</p>
      </div>

      <div className="section">
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          <div className="search-wrap" style={{ flex: 2, maxWidth: "none" }}>
            <input className="search-input" placeholder="Search resources..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          </div>
          <input className="search-input" style={{ flex: 1, minWidth: 140 }} placeholder="Technology (e.g. react)" value={technology} onChange={(e) => setTechnology(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          <select
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
            style={{ padding: "0.5rem 1rem", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "999px", color: "var(--text)", fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button className="btn btn-primary" onClick={handleSearch}><FaMagnifyingGlass /> Search</button>
        </div>

        {loading ? (
          <div className="empty"><div className="icon"><i className="fa fa-spinner fa-spin" /></div><p>Loading...</p></div>
        ) : resources.length === 0 ? (
          <div className="empty"><p>No resources found — try a different search</p></div>
        ) : (
          <>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>{meta.total} resources found</div>
            <div className="roles-grid">
              {resources.map((r) => {
                const color = TYPE_COLORS[r.type] || "var(--primary)";
                return (
                  <div key={r.id} className="role-card" onClick={() => handleOpen(r)} style={{ cursor: r.url ? "pointer" : "default" }}>
                    <div className="role-card-top">
                      <span style={{ padding: "0.22rem 0.65rem", borderRadius: 999, background: `${color}18`, color, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.type}</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{r.difficulty}</span>
                    </div>
                    <div className="role-card-body">
                      <h3 style={{ fontSize: "1rem" }}>{r.title}</h3>
                      <p style={{ fontSize: "0.825rem" }}>{r.description}</p>
                      {r.provider && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {r.provider}{r.estimatedDuration > 0 && ` · ${r.estimatedDuration} min`}
                        </div>
                      )}
                      {r.tags?.length > 0 && (
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                          {r.tags.slice(0, 4).map((tag) => (
                            <span key={tag} style={{ fontSize: "0.68rem", padding: "0.15rem 0.5rem", background: "var(--surface-high)", borderRadius: 999, color: "var(--text-muted)" }}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {meta.totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "2rem" }}>
                <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Page {meta.page} of {meta.totalPages}</span>
                <button className="btn btn-outline btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
