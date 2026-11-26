import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchResourceCoverage, searchResources, updateResource } from "../../services/resourceService.js";

const listFields = ["tags", "relatedDomains", "relatedRoles", "relatedSkills", "relatedTechnologies"];

function toForm(resource) {
  return {
    title: resource.title || "",
    description: resource.description || "",
    technology: resource.technology || "",
    category: resource.category || "",
    resourceType: resource.resourceType || "",
    sourceCategory: resource.sourceCategory || "",
    sourceSubcategory: resource.sourceSubcategory || "",
    attribution: resource.attribution || "",
    ...Object.fromEntries(listFields.map((field) => [field, (resource[field] || []).join(", ")])),
  };
}

function toPayload(form) {
  return {
    ...form,
    ...Object.fromEntries(listFields.map((field) => [
      field,
      form[field].split(",").map((value) => value.trim()).filter(Boolean),
    ])),
  };
}

export default function AdminSourceResources() {
  const [coverage, setCoverage] = useState(null);
  const [repository, setRepository] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCoverage = useCallback(async () => {
    try {
      const result = await fetchResourceCoverage();
      setCoverage(result);
      setRepository((current) => current || result.repositories?.[0]?.key || "");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load source import coverage");
    }
  }, []);

  const loadResources = useCallback(async () => {
    if (!repository) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await searchResources({ sourceRepository: repository, q: query || undefined, page, limit: 50 });
      setItems(result.data || []);
      setMeta(result.meta || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load imported resources");
    } finally {
      setLoading(false);
    }
  }, [page, query, repository]);

  useEffect(() => { loadCoverage(); }, [loadCoverage]);
  useEffect(() => { loadResources(); }, [loadResources]);

  const chooseResource = (resource) => {
    setSelected(resource);
    setForm(toForm(resource));
  };

  const save = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateResource(selected.id, toPayload(form));
      setSelected(updated);
      setForm(toForm(updated));
      toast.success("Imported resource updated");
      await Promise.all([loadResources(), loadCoverage()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update imported resource");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="admin-header">
        <h2>Imported Learning Resources</h2>
        <p>Review source coverage and correct mappings without changing original source attribution.</p>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.25rem", padding: "1rem" }}>
        <h3>Import coverage</h3>
        {!coverage ? <p>Loading coverage…</p> : (
          <>
            <p>
              {coverage.totalImported} imported resources from {coverage.totalDiscovered} inventoried source items.
              {" "}Mapped: {coverage.statuses?.mapped || 0}; duplicates: {coverage.statuses?.duplicate || 0};
              {" "}excluded: {coverage.statuses?.excluded || 0}; failed: {coverage.statuses?.failed || 0}.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {coverage.repositories?.map((row) => (
                <span key={row.key} className="status-badge">
                  {row.key}: {row.mapped || 0} mapped · {row.duplicate || 0} duplicates · {row.excluded || 0} excluded · {row.failed || 0} failed
                </span>
              ))}
            </div>
            <details style={{ marginTop: "0.75rem" }}>
              <summary>Category coverage (first 60)</summary>
              <ul>
                {coverage.categories?.slice(0, 60).map((row) => (
                  <li key={row.key}>
                    {row.key}: {row.mapped || 0} mapped · {row.duplicate || 0} duplicates · {row.excluded || 0} excluded · {row.failed || 0} failed
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 0.9fr) minmax(320px, 1.4fr)", gap: "1rem", alignItems: "start" }}>
        <div className="admin-card" style={{ padding: "1rem" }}>
          <label htmlFor="source-repository">Source repository</label>
          <select id="source-repository" value={repository} onChange={(event) => { setRepository(event.target.value); setPage(1); setSelected(null); }} style={{ width: "100%", margin: "0.5rem 0 1rem" }}>
            {coverage?.repositories?.map((row) => <option key={row.key} value={row.key}>{row.key}</option>)}
          </select>
          <input
            aria-label="Search imported resources"
            className="search-input"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Search imported items"
            style={{ width: "100%", marginBottom: "0.75rem" }}
          />
          {loading ? <p>Loading resources…</p> : (
            <div style={{ display: "grid", gap: "0.5rem", maxHeight: "65vh", overflowY: "auto" }}>
              {items.map((item) => (
                <button key={item.id} type="button" className="btn btn-outline" onClick={() => chooseResource(item)} style={{ textAlign: "left", whiteSpace: "normal" }}>
                  <strong>{item.title}</strong>
                  <small style={{ display: "block", color: "var(--text-muted)" }}>{item.sourceCategory}{item.sourceSubcategory ? ` / ${item.sourceSubcategory}` : ""}</small>
                </button>
              ))}
              {!items.length && <p>No imported resources found for this source.</p>}
              {meta.totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
                  <span>{meta.page} / {meta.totalPages} · {meta.total} items</span>
                  <button type="button" className="btn btn-outline" disabled={page >= meta.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="admin-card" style={{ padding: "1rem" }}>
          {!selected ? <p>Select an imported resource to review its mappings.</p> : (
            <form onSubmit={save} style={{ display: "grid", gap: "0.75rem" }}>
              <h3>{selected.title}</h3>
              <a href={selected.sourceUrl || selected.url} target="_blank" rel="noreferrer">Open original resource</a>
              <span style={{ color: "var(--text-muted)" }}>{selected.attribution} · {selected.sourceLicense}</span>
              {[
                ["title", "Title"], ["description", "Description"], ["technology", "Primary technology"],
                ["category", "Resource category"], ["resourceType", "Resource type"], ["sourceCategory", "Source category"],
                ["sourceSubcategory", "Source subcategory"], ["relatedDomains", "Related domain slugs"],
                ["relatedRoles", "Related career roles"], ["relatedSkills", "Related skills"],
                ["relatedTechnologies", "Related technologies"], ["tags", "Search tags"], ["attribution", "Attribution"],
              ].map(([field, label]) => (
                <label key={field} style={{ display: "grid", gap: "0.25rem" }}>
                  {label}
                  {field === "description" ? (
                    <textarea rows={3} value={form[field] || ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
                  ) : (
                    <input value={form[field] || ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
                  )}
                  {listFields.includes(field) && <small>Separate values with commas.</small>}
                </label>
              ))}
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save corrections"}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
