import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaBullhorn } from "react-icons/fa6";
import { listInstitutions } from "../services/careerPlannerService.js";

export default function InstitutionPortal() {
  const [activeTab, setActiveTab] = useState("overview"); // overview, students, events, announcements
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listInstitutions()
      .then(setInstitutions)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "1.5rem auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 1, color: "var(--primary)", fontWeight: 700 }}>
            Placement Cell & Campus Ecosystem
          </span>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0.2rem 0" }}>
            Institution Command Center
          </h2>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.92rem" }}>
            Manage campus clubs, internal placement opportunities, verified faculty guides, and student association.
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => toast.success("Announcements dispatcher active")}>
          <FaBullhorn /> Post Announcement
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
          Overview
        </button>
        <button className={`tab ${activeTab === "events" ? "active" : ""}`} onClick={() => setActiveTab("events")}>
          Events & Workshops
        </button>
        <button className={`tab ${activeTab === "announcements" ? "active" : ""}`} onClick={() => setActiveTab("announcements")}>
          Campus Notices
        </button>
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Associated Students</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--primary)" }}>1,248</div>
            </div>
            <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Active Faculty Guides</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#10b981" }}>36</div>
            </div>
            <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Upcoming Campus Events</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f59e0b" }}>4</div>
            </div>
            <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Pending Association Requests</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--error)" }}>12</div>
            </div>
          </div>

          {/* Connected Institutions Directory */}
          <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>Partner Institutions & Campus Cells</h3>
            {loading ? (
              <p>Loading institutions...</p>
            ) : institutions.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No institutions registered yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {institutions.map((inst) => (
                  <div key={inst._id} style={{ border: "1px solid var(--border)", borderRadius: "0.6rem", padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <strong>{inst.name}</strong>
                      <span className="branch-tag">{inst.code}</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{inst.category} • {inst.location || "India"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "events" && (
        <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem" }}>Campus Workshops & Events</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
            Internal institution workshops, hackathons, and placement preparation sessions.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>Annual Tech Symposium & Project Expo</strong>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Organized by Career Development Cell • Auditorium Hall</div>
              </div>
              <span className="branch-tag">Registration Open</span>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>DSA & System Design Hands-on BootCamp</strong>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>CSE Faculty Guide • Online Lab Session</div>
              </div>
              <span className="branch-tag">Upcoming</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "announcements" && (
        <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem" }}>Internal Campus Notices</h3>
          <div style={{ borderLeft: "3px solid var(--primary)", paddingLeft: "1rem", marginBottom: "1rem" }}>
            <div style={{ fontWeight: 600 }}>Semester Internship Drive Submission Deadline</div>
            <p style={{ margin: "0.2rem 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              All eligible 3rd and 4th year students must upload verified project portfolios before the placement window closes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
