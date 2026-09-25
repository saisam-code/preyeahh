import { useEffect, useMemo, useState } from "react";
import { FaXmark, FaHandPointer } from "react-icons/fa6";

import { useBranch } from "../context/BranchContext";
import { fetchBeyond } from "../services/beyondService";
import BranchGate from "../components/BranchGate";

const CAT_META = {
  college: { label: "In College", icon: "fa-school", color: "#8b5cf6" },
  startup: { label: "Startup", icon: "fa-rocket", color: "#f97316" },
  gate: { label: "GATE & Higher Studies", icon: "fa-graduation-cap", color: "#7c3aed" },
  national: { label: "National", icon: "fa-flag", color: "#1a56db" },
  international: { label: "International", icon: "fa-globe", color: "#059669" },
};

function parseResource(str) {
  const [label, url] = str.split("|").map((s) => s?.trim());
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="resource-link">
        {label} ↗
      </a>
    );
  }
  return str;
}

export default function Beyond() {
  const { branch } = useBranch();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!branch) return;
    setLoading(true);
    fetchBeyond({ limit: 100 })
      .then((res) => setList(res.data.filter((l) => l.branch === branch || l.branch === "All")))
      .finally(() => setLoading(false));
  }, [branch]);

  const filtered = useMemo(() => {
    let items = list;
    if (activeCat !== "all") items = items.filter((l) => l.category === activeCat);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((l) => l.title.toLowerCase().includes(q) || (l.description || "").toLowerCase().includes(q));
    }
    return items;
  }, [list, activeCat, search]);

  if (!branch) return <BranchGate label="opportunities beyond placements" />;

  return (
    <div>
      <div className="page-hero">
        <h1>{branch} <span>Beyond</span></h1>
        <p>Startups, higher studies, national &amp; international opportunities for {branch} — tap any card for full guidance</p>
      </div>

      <div className="section">
        <div className="filter-row">
          <div className="type-tabs beyond-tabs-desktop">
            <div className={`tab ${activeCat === "all" ? "active" : ""}`} onClick={() => setActiveCat("all")}>All</div>
            {Object.entries(CAT_META).map(([key, m]) => (
              <div key={key} className={`tab ${activeCat === key ? "active" : ""}`} onClick={() => setActiveCat(key)}>
                <i className={`fa ${m.icon}`} /> {m.label}
              </div>
            ))}
          </div>
          <div className="beyond-select-wrap">
            <i className="fa fa-filter beyond-select-icon" />
            <select className="filter-select beyond-cat-select" value={activeCat} onChange={(e) => setActiveCat(e.target.value)}>
              <option value="all">All Categories</option>
              {Object.entries(CAT_META).map(([key, m]) => <option key={key} value={key}>{m.label}</option>)}
            </select>
          </div>
          <div className="search-wrap">
            <input className="search-input" placeholder="Search opportunities..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="empty"><div className="icon"><i className="fa fa-spinner fa-spin" /></div><p>Loading...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty"><div className="icon"><i className="fa fa-inbox" /></div><p>No entries found</p></div>
        ) : (
          <div className="roles-grid">
            {filtered.map((l) => {
              const m = CAT_META[l.category] || { label: l.category, icon: "fa-star", color: "var(--primary)" };
              const isAll = l.branch === "All";
              return (
                <div key={l._id} className="role-card" onClick={() => setSelected(l)}>
                  <div className="role-card-top">
                    <span className="type-badge" style={{ background: `${m.color}18`, color: m.color, borderRadius: 20, padding: "0.22rem 0.65rem" }}>
                      <i className={`fa ${m.icon}`} /> {m.label}
                    </span>
                    {isAll && <span className="cross-branch-badge">All Branches</span>}
                  </div>
                  <div className="role-card-body">
                    <h3>{l.title}</h3>
                    <p>{l.description}</p>
                    <div className="role-card-footer">
                      <span className="tap-hint"><FaHandPointer /> Tap for guidance &amp; resources</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`modal-overlay ${selected ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
        {selected && (
          <div className="modal modal-detail">
            <div className="modal-header">
              <h2>{selected.title}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}><FaXmark /></button>
            </div>
            <div className="rd-meta">
              <span className="branch-tag">{selected.branch === "All" ? "All Branches" : selected.branch}</span>
              <p className="rd-desc">{selected.description}</p>
            </div>
            {selected.howto && (
              <div className="rd-block rd-block--steps">
                <div className="rd-block-header"><i className="fa fa-map-signs" /><span>How to Get There</span></div>
                <p className="rd-block-body">{selected.howto}</p>
              </div>
            )}
            {selected.skills?.length > 0 && (
              <div className="rd-block rd-block--skills">
                <div className="rd-block-header"><i className="fa fa-wrench" /><span>Key Skills</span></div>
                <div className="rd-tags">{selected.skills.map((s, i) => <span key={i} className="rd-tag">{s}</span>)}</div>
              </div>
            )}
            {selected.resources?.length > 0 && (
              <div className="rd-block rd-block--resources">
                <div className="rd-block-header"><i className="fa fa-book-open" /><span>Resources</span></div>
                <ul className="rd-resource-list">{selected.resources.map((r, i) => <li key={i}>{parseResource(r)}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}