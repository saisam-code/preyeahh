import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchExploreDomain,
  fetchExploreDomains,
  fetchExploreGovernmentJobs,
  fetchExploreOpportunities,
  fetchExploreResources,
  fetchExploreRoles,
} from "../services/exploreService.js";

const TABS = ["roles", "resources", "exams", "opportunities"];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [domains, setDomains] = useState([]);
  const [domainDetail, setDomainDetail] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const tab = TABS.includes(searchParams.get("tab")) ? searchParams.get("tab") : "roles";
  const domainSlug = searchParams.get("domain") || "";
  const subdomainId = searchParams.get("sub") || "";
  const query = searchParams.get("q") || "";
  const stage = searchParams.get("stage") || "";
  const branch = searchParams.get("branch") || "";
  const difficulty = searchParams.get("difficulty") || "";
  const kind = tab === "exams" ? "EXAM" : tab === "opportunities" ? "OPPORTUNITY" : "";

  const params = useMemo(() => ({
    domain: domains.find((item) => item.slug === domainSlug)?._id,
    sub: subdomainId,
    q: query,
    stage,
    branch,
    difficulty,
    kind,
  }), [domains, domainSlug, subdomainId, query, stage, branch, difficulty, kind]);

  useEffect(() => {
    const controller = new AbortController();
    fetchExploreDomains()
      .then((items) => setDomains(items))
      .catch(() => setError("Unable to load career domains"))
      .finally(() => !controller.signal.aborted);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!domainSlug) {
      setDomainDetail(null);
      return;
    }
    const controller = new AbortController();
    fetchExploreDomain(domainSlug, controller.signal)
      .then(setDomainDetail)
      .catch((requestError) => {
        if (requestError?.code !== "ERR_CANCELED") setError("Unable to load this domain");
      });
    return () => controller.abort();
  }, [domainSlug]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const requestParams = { q: query, stage, branch, difficulty, limit: 50 };
    if (params.domain) requestParams.domain = params.domain;
    if (subdomainId) requestParams.subdomain = subdomainId;
    if (kind) requestParams.kind = kind;

    const request = tab === "resources"
      ? fetchExploreResources(requestParams, controller.signal)
      : tab === "exams" || tab === "opportunities"
        ? fetchExploreOpportunities(requestParams, controller.signal)
        : domainSlug === "government-careers"
          ? fetchExploreGovernmentJobs(requestParams, controller.signal)
          : fetchExploreRoles(requestParams, controller.signal);

    request
      .then((result) => {
        setRows(result.data || []);
      })
      .catch((requestError) => {
        if (requestError?.code !== "ERR_CANCELED") setError("Unable to load results");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tab, domainSlug, subdomainId, query, stage, branch, difficulty, kind, reloadKey, params.domain]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "domain") {
      next.delete("sub");
      next.delete("role");
    }
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams({ tab });
  };

  return (
    <main className="explore-page">
      <header className="page-hero">
        <h1>Explore</h1>
        <p>Discover career domains, roles, learning resources, exams, and opportunities.</p>
      </header>

      <section className="explore-toolbar" aria-label="Explore filters">
        <input
          type="search"
          value={query}
          placeholder="Search"
          onChange={(event) => updateFilter("q", event.target.value)}
          aria-label="Search careers"
        />
        <select value={stage} onChange={(event) => updateFilter("stage", event.target.value)} aria-label="Education stage">
          <option value="">All education stages</option>
          <option value="Class 9-10">Class 9-10</option>
          <option value="Class 11-12">Class 11-12</option>
          <option value="Diploma">Diploma</option>
          <option value="Undergraduate">Undergraduate</option>
          <option value="Postgraduate">Postgraduate</option>
        </select>
        <input
          value={branch}
          onChange={(event) => updateFilter("branch", event.target.value)}
          placeholder="Branch tag"
          aria-label="Branch tag"
        />
        {(tab === "resources") && (
          <select value={difficulty} onChange={(event) => updateFilter("difficulty", event.target.value)} aria-label="Difficulty">
            <option value="">All difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        )}
        <button type="button" onClick={clearFilters}>Clear filters</button>
      </section>

      <section className="domain-strip" aria-label="Career domains">
        {domains.map((domain) => (
          <button
            type="button"
            key={domain._id}
            className={domainSlug === domain.slug ? "active" : ""}
            onClick={() => updateFilter("domain", domain.slug)}
          >
            <strong>{domain.name}</strong>
            <small>{domain.roleCount} roles</small>
          </button>
        ))}
      </section>

      {domainDetail?.subdomains?.length > 0 && (
        <nav className="subdomain-chips" aria-label="Subdomains">
          {domainDetail.subdomains.map((subdomain) => (
            <button
              type="button"
              key={subdomain._id}
              className={subdomainId === subdomain._id ? "active" : ""}
              onClick={() => updateFilter("sub", subdomainId === subdomain._id ? "" : subdomain._id)}
            >
              {subdomain.name}
            </button>
          ))}
        </nav>
      )}

      <nav className="type-tabs explore-tabs" aria-label="Explore sections">
        {TABS.map((item) => (
          <button
            type="button"
            key={item}
            className={tab === item ? "tab active" : "tab"}
            onClick={() => updateFilter("tab", item)}
          >
            {item === "exams" ? "Exams" : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>

      {loading && <div className="explore-skeleton" role="status">Loading results...</div>}
      {!loading && error && (
        <div className="explore-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)}>Retry</button>
        </div>
      )}
      {!loading && !error && rows.length === 0 && (
        <div className="explore-empty">
          <strong>No verified data yet</strong>
          <button type="button" onClick={clearFilters}>Clear filters and try again</button>
        </div>
      )}
      {!loading && !error && rows.length > 0 && (
        <section className="explore-card-grid" aria-live="polite">
          {rows.map((row) => (
            <article className="explore-card" key={row._id}>
              <header>
                <strong>{row.title}</strong>
                {row.category && <span>{row.category}</span>}
              </header>
              {row.description && <p>{row.description}</p>}
              {row.organizer && <p>{row.organizer}</p>}
              {row.provider && <p>{row.provider}</p>}
              {row.deadline && <time>{new Date(row.deadline).toLocaleDateString()}</time>}
              {tab === "roles" ? (
                <button type="button" onClick={() => setSelectedRole(row)}>View role</button>
              ) : row.url || row.applyUrl ? (
                <a href={row.url || row.applyUrl} target="_blank" rel="noreferrer">Open</a>
              ) : null}
            </article>
          ))}
        </section>
      )}

      {selectedRole && (
        <aside className="role-detail-drawer" role="dialog" aria-modal="true" aria-label={`${selectedRole.title} details`}>
          <button type="button" onClick={() => setSelectedRole(null)} aria-label="Close role details">Close</button>
          <h2>{selectedRole.title}</h2>
          <p>{selectedRole.description || "No verified data yet"}</p>
          {selectedRole.educationStages?.length > 0 && <p>{selectedRole.educationStages.join(", ")}</p>}
          <button type="button">Save interest</button>
        </aside>
      )}
    </main>
  );
}
