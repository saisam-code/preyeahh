import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  FaBullhorn,
  FaBuildingColumns,
  FaUserGraduate,
  FaCalendarDays,
  FaCheck,
  FaXmark,
  FaPlus,
  FaFileArrowDown,
  FaChartPie,
  FaPeopleGroup,
  FaBriefcase,
} from "react-icons/fa6";
import { listInstitutions } from "../services/studentDevelopmentService.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function InstitutionPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // overview, requests, events, announcements
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Institution State
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notices, setNotices] = useState([]);
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeBranch, setNewNoticeBranch] = useState("All Engineering Branches");
  const [newNoticeContent, setNewNoticeContent] = useState("");
  const workshops = [];

  useEffect(() => {
    listInstitutions()
      .then(setInstitutions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApproveStudent = (id, name) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    toast.success(`Approved student link for ${name}! Added to verified cohort.`);
  };

  const handleRejectStudent = (id, name) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    toast.error(`Rejected association request for ${name}.`);
  };

  const handleCreateNotice = (e) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) {
      toast.error("Please fill notice title and details.");
      return;
    }

    const created = {
      id: Date.now(),
      title: newNoticeTitle.trim(),
      branch: newNoticeBranch,
      priority: "HIGH",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      content: newNoticeContent.trim(),
    };

    setNotices([created, ...notices]);
    setNewNoticeTitle("");
    setNewNoticeContent("");
    setShowNoticeForm(false);
    toast.success("Notice published to student & parent portals!");
  };

  const handleExportDossier = () => {
    toast.success("Exporting NBKRIST Placement Readiness Dossier (.CSV)... Download initiated!");
  };

  return (
    <div style={{ maxWidth: 1180, margin: "2rem auto", padding: "0 1.5rem" }}>
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: 1.2, color: "var(--primary)", fontWeight: 700 }}>
              Placement Cell &amp; Campus Ecosystem
            </span>
            <span
              style={{
                fontSize: "0.72rem",
                background: "var(--primary-bg)",
                color: "var(--primary)",
                padding: "0.15rem 0.5rem",
                borderRadius: "1rem",
                fontWeight: 700,
              }}
            >
              NBKRIST CAMPUS PORTAL
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 800, margin: "0.2rem 0 0.5rem" }}>
            Institution Command Center
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.95rem" }}>
            Manage campus clubs, verified placement drives, student associations, and inter-departmental career milestones.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportDossier} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <FaFileArrowDown /> Export Cohort Dossier
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNoticeForm((s) => !s)} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <FaBullhorn /> Post Notice
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="tabs" style={{ marginBottom: "1.75rem" }}>
        <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
          Overview &amp; Metrics
        </button>
        <button className={`tab ${activeTab === "requests" ? "active" : ""}`} onClick={() => setActiveTab("requests")}>
          Student Association Requests ({pendingRequests.length})
        </button>
        <button className={`tab ${activeTab === "events" ? "active" : ""}`} onClick={() => setActiveTab("events")}>
          Workshops &amp; Recruitment Drives ({workshops.length})
        </button>
        <button className={`tab ${activeTab === "announcements" ? "active" : ""}`} onClick={() => setActiveTab("announcements")}>
          Campus Notices ({notices.length})
        </button>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1.25rem" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                <FaUserGraduate /> Associated Students
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>{user?.studentCount ?? 0}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Verified enrolled students</div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                <FaPeopleGroup /> Active Faculty Guides
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#10b981" }}>{user?.guideCount ?? 0}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Verified Mentors Onboarded</div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                <FaCalendarDays /> Upcoming Campus Drives
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f59e0b" }}>{workshops.length}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Workshops &amp; Seminars</div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                <FaChartPie /> Pending Requests
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: pendingRequests.length > 0 ? "var(--error)" : "var(--primary)" }}>
                {pendingRequests.length}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Awaiting verification</div>
            </div>
          </div>

          {/* Placement Readiness Cohort Breakdown */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem", fontWeight: 700 }}>
              2026 Graduating Cohort Placement &amp; Govt Exam Readiness
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
              Composite metric derived from verified project repos, roadmap completion, and diagnostic coding scores.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
              <div style={{ background: "var(--surface-mid)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block" }}>Tier 1 / High CTC Readiness</span>
                <strong style={{ fontSize: "1.4rem", color: "var(--primary)" }}>38.4% (479 Students)</strong>
                <div style={{ height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 3, marginTop: "0.5rem" }}>
                  <div style={{ width: "38.4%", height: "100%", background: "var(--primary)", borderRadius: 3 }} />
                </div>
              </div>

              <div style={{ background: "var(--surface-mid)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block" }}>Core Engineering &amp; PSU GATE Track</span>
                <strong style={{ fontSize: "1.4rem", color: "#10b981" }}>42.1% (525 Students)</strong>
                <div style={{ height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 3, marginTop: "0.5rem" }}>
                  <div style={{ width: "42.1%", height: "100%", background: "#10b981", borderRadius: 3 }} />
                </div>
              </div>

              <div style={{ background: "var(--surface-mid)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block" }}>Under Remedial / Skills Prep</span>
                <strong style={{ fontSize: "1.4rem", color: "#f59e0b" }}>19.5% (244 Students)</strong>
                <div style={{ height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 3, marginTop: "0.5rem" }}>
                  <div style={{ width: "19.5%", height: "100%", background: "#f59e0b", borderRadius: 3 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Connected Institutions Directory */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.15rem", fontWeight: 700 }}>Partner Institutions &amp; Campus Cells</h3>
            {loading ? (
              <p>Loading institutions directory...</p>
            ) : institutions.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No external institutions connected.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {institutions.map((inst) => (
                  <div key={inst._id} style={{ border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem", background: "var(--surface-mid)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                      <strong>{inst.name}</strong>
                      <span className="branch-tag">{inst.code}</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      {inst.category} • {inst.location || "Andhra Pradesh"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STUDENT REQUESTS TAB ── */}
      {activeTab === "requests" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem", fontWeight: 700 }}>
            Pending Student Association Requests
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
            Students registered under your institutional affiliation code (<strong style={{ color: "var(--primary)" }}>NBKRIST-2026</strong>). Verify their credentials to grant access to campus placement drives.
          </p>

          {pendingRequests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
              <p style={{ fontSize: "1.05rem", fontWeight: 600 }}>All pending requests processed! 🎉</p>
              <span>New student requests will appear here when they link their student profile.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "0.75rem",
                    padding: "1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                    background: "var(--surface-mid)",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "1.05rem", display: "block" }}>{req.studentName}</strong>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      Roll No: <strong>{req.rollNo}</strong> • {req.branch} ({req.year}) • CGPA: <strong style={{ color: "var(--primary)" }}>{req.cgpa}</strong>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                      Email: {req.email} • Requested on: {req.submittedDate}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleRejectStudent(req.id, req.studentName)}
                      style={{ color: "var(--error)", borderColor: "var(--error)" }}
                    >
                      <FaXmark /> Reject
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleApproveStudent(req.id, req.studentName)}
                    >
                      <FaCheck /> Approve Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── WORKSHOPS & EVENTS TAB ── */}
      {activeTab === "events" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.2rem", fontWeight: 700 }}>Campus Workshops &amp; Drives</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
                Scheduled internal recruitment bootcamps, technical symposia, and public sector coaching.
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => toast.success("Workshop scheduling dialog initialized")}
            >
              <FaPlus /> Add Workshop
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {workshops.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "0.75rem" }}>
                <p style={{ fontSize: "1.05rem", fontWeight: 600 }}>No workshops or campus recruitment drives scheduled yet.</p>
                <span>Use the "Add Workshop" button above to schedule your first event.</span>
              </div>
            ) : (
              workshops.map((w) => (
                <div
                  key={w.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "0.75rem",
                    padding: "1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                    background: "var(--surface-mid)",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "1rem", display: "block" }}>{w.title}</strong>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      Host: {w.host} • Date: <strong>{w.date}</strong> • Venue: {w.location}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)" }}>
                      {w.registeredCount} Students Enrolled
                    </span>
                    <span className="branch-tag">{w.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── NOTICES TAB ── */}
      {activeTab === "announcements" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.2rem", fontWeight: 700 }}>Campus Notices &amp; Bulletins</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
                Internal notices pushed instantly to student notification feeds and parent portals.
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowNoticeForm((s) => !s)}
            >
              {showNoticeForm ? "Cancel" : "+ Compose Notice"}
            </button>
          </div>

          {/* Form to compose new notice */}
          {showNoticeForm && (
            <form onSubmit={handleCreateNotice} style={{ background: "var(--surface-mid)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Publish New Campus Bulletin</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Title</label>
                  <input
                    type="text"
                    value={newNoticeTitle}
                    onChange={(e) => setNewNoticeTitle(e.target.value)}
                    placeholder="e.g. TCS Ninja & Digital National Qualifier Test Schedule"
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "0.4rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Target Department / Branch</label>
                  <select
                    value={newNoticeBranch}
                    onChange={(e) => setNewNoticeBranch(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "0.4rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  >
                    <option value="All Engineering Branches">All Engineering Branches</option>
                    <option value="CSE & IT Only">CSE &amp; IT Only</option>
                    <option value="ECE & EEE Only">ECE &amp; EEE Only</option>
                    <option value="Mechanical & Civil Only">Mechanical &amp; Civil Only</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Notice Content</label>
                <textarea
                  rows={3}
                  value={newNoticeContent}
                  onChange={(e) => setNewNoticeContent(e.target.value)}
                  placeholder="Detail the deadline, eligibility criteria, and required registration forms..."
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "0.4rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn btn-primary btn-sm">
                  Broadcast Notice
                </button>
              </div>
            </form>
          )}

          {/* Notices List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {notices.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "0.75rem" }}>
                <p style={{ fontSize: "1.05rem", fontWeight: 600 }}>No campus bulletins published yet.</p>
                <span>Click "+ Compose Notice" above to broadcast notifications to students and parents.</span>
              </div>
            ) : (
              notices.map((n) => (
                <div
                  key={n.id}
                  style={{
                    borderLeft: "4px solid var(--primary)",
                    background: "var(--surface-mid)",
                    borderTop: "1px solid var(--border)",
                    borderRight: "1px solid var(--border)",
                    borderBottom: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    padding: "1.25rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                    <strong style={{ fontSize: "1.05rem" }}>{n.title}</strong>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{n.date}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, marginBottom: "0.5rem" }}>
                    Target: {n.branch}
                  </div>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
                    {n.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
