import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { useSearchParams } from "react-router-dom";
import { searchResources, recordResourceView } from "../services/resourceService.js";
import { useBranch } from "../context/BranchContext.jsx";
import ContributorLabel from "../components/ContributorLabel.jsx";

const TYPE_COLORS = {
  video: "var(--danger)", article: "var(--info)", documentation: "var(--info)", course: "var(--warning)",
  book: "var(--secondary)", practice: "var(--success)", github: "var(--text-muted)",
};

export default function Resources() {
  const { branch } = useBranch();
  const [searchParams] = useSearchParams();
  const [resources, setResources] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [technology, setTechnology] = useState(() => searchParams.get("technology") || "");
  const [role, setRole] = useState(() => searchParams.get("role") || "");
  const [skill, setSkill] = useState(() => searchParams.get("skill") || "");
  const [domain, setDomain] = useState(() => searchParams.get("domain") || "");
  const [sourceCategory, setSourceCategory] = useState(() => searchParams.get("category") || "");
  const [resourceType, setResourceType] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [page, setPage] = useState(1);
  const [applied, setApplied] = useState(() => ({
    q: searchParams.get("q") || "",
    technology: searchParams.get("technology") || "",
    role: searchParams.get("role") || "",
    skill: searchParams.get("skill") || "",
    domain: searchParams.get("domain") || "",
    sourceCategory: searchParams.get("category") || "",
    resourceType: "",
  }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchResources({
        q: applied.q || undefined,
        technology: applied.technology || undefined,
        role: applied.role || undefined,
        skill: applied.skill || undefined,
        domain: applied.domain || undefined,
        sourceCategory: applied.sourceCategory || undefined,
        resourceType: applied.resourceType || undefined,
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

  const handleSearch = () => {
    setPage(1);
    setApplied({
      q: query.trim(),
      technology: technology.trim(),
      role: role.trim(),
      skill: skill.trim(),
      domain: domain.trim(),
      sourceCategory: sourceCategory.trim(),
      resourceType,
    });
  };

  const handleOpen = (r) => {
    if (!r.url) return;
    recordResourceView(r.id).catch(() => {});
    window.open(r.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <div className="page-hero">
        <h1>Resource <span>Library</span></h1>
        <p>Explore learning references and practical builds by career, skill, technology, source category, and level{branch ? ` — including resources for ${branch}` : ""}.</p>
      </div>

      <div className="section">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
          <div className="search-wrap" style={{ flex: 2, maxWidth: "none" }}>
            <input aria-label="Search resources" className="search-input" placeholder="Title or topic" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          </div>
          <input aria-label="Technology filter" className="search-input" placeholder="Technology" value={technology} onChange={(e) => setTechnology(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          <input aria-label="Career role filter" className="search-input" placeholder="Career role" value={role} onChange={(e) => setRole(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          <input aria-label="Skill filter" className="search-input" placeholder="Skill" value={skill} onChange={(e) => setSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          <input aria-label="Career domain filter" className="search-input" placeholder="Domain slug (e.g. tech-eng)" value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          <input aria-label="Source category filter" className="search-input" placeholder="Category or subcategory" value={sourceCategory} onChange={(e) => setSourceCategory(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          <select aria-label="Resource type filter" value={resourceType} onChange={(e) => setResourceType(e.target.value)} style={{ padding: "0.5rem 1rem", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r-full)", color: "var(--text)", fontFamily: "var(--font-display)", fontWeight: 600 }}>
            <option value="">All resource types</option>
            <option value="curated-list">Curated lists</option>
            <option value="tutorial">Tutorials</option>
            <option value="repository">Repositories</option>
            <option value="documentation">Documentation</option>
            <option value="course">Courses</option>
            <option value="video">Videos</option>
            <option value="article">Articles</option>
          </select>
          <select aria-label="Difficulty filter" value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }} style={{ padding: "0.5rem 1rem", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r-full)", color: "var(--text)", fontFamily: "var(--font-display)", fontWeight: 600 }}>
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
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginBottom: "1rem" }}>{meta.total} resources found</div>
            <div className="roles-grid">
              {resources.map((r) => {
                const color = TYPE_COLORS[r.type] || "var(--primary)";
                return (
                  <div key={r.id} className="role-card" onClick={() => handleOpen(r)} style={{ cursor: r.url ? "pointer" : "default" }}>
                    <div className="role-card-top">
                      <span style={{ padding: "0.22rem 0.65rem", borderRadius: "var(--r-full)", background: `${color}18`, color, fontSize: "var(--font-size-icon)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.type}</span>
                      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>{r.difficulty}</span>
                    </div>
                    <div className="role-card-body">
                      <h3 style={{ fontSize: "var(--font-size-md)" }}>{r.title}</h3>
                      <p style={{ fontSize: "var(--font-size-sm)" }}>{r.description}</p>
                      <ContributorLabel item={r} />
                      {r.sourceRepository && (
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
                          Source: {r.sourceRepository}{r.sourceCategory ? ` · ${r.sourceCategory}` : ""}
                          {r.sourceSubcategory ? ` / ${r.sourceSubcategory}` : ""}
                        </div>
                      )}
                      {r.provider && (
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
                          {r.provider}{r.estimatedDuration > 0 && ` · ${r.estimatedDuration} min`}
                        </div>
                      )}
                      {r.tags?.length > 0 && (
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                          {r.tags.slice(0, 4).map((tag) => (
                            <span key={tag} style={{ fontSize: "var(--font-size-icon)", padding: "0.15rem 0.5rem", background: "var(--surface-high)", borderRadius: "var(--r-full)", color: "var(--text-muted)" }}>{tag}</span>
                          ))}
                        </div>
                      )}
                      {r.relatedDomains?.length > 0 && (
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                          {r.relatedDomains.slice(0, 3).map((tag) => (
                            <span key={tag} style={{ fontSize: "var(--font-size-icon)", padding: "0.15rem 0.5rem", background: "var(--surface-high)", borderRadius: "var(--r-full)", color: "var(--text-muted)" }}>{tag}</span>
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
                <span style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>Page {meta.page} of {meta.totalPages}</span>
                <button className="btn btn-outline btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
