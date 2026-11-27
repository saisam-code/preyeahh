import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaCheck, FaUserGraduate, FaXmark } from "react-icons/fa6";
import AdminRoles from "../components/admin/AdminRoles.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { listInstitutions } from "../services/studentDevelopmentService.js";
import {
  approveInstitutionMember,
  getInstitutionMembers,
  removeInstitutionMember,
} from "../services/institutionService.js";
import "./InstitutionPortal.css";

const TABS = [
  ["overview", "Overview"],
  ["members", "Student associations"],
  ["institutions", "Institution directory"],
  ["roles", "Career roles"],
];

export default function InstitutionPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [members, setMembers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [memberRecords, institutionRecords] = await Promise.all([
        getInstitutionMembers(),
        listInstitutions(),
      ]);
      setMembers(memberRecords);
      setInstitutions(institutionRecords);
    } catch (error) {
      const message = error.response?.data?.message || "Could not load institution data.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingMembers = useMemo(
    () => members.filter((member) => member.status === "PENDING"),
    [members]
  );
  const activeMembers = useMemo(
    () => members.filter((member) => member.status === "ACTIVE"),
    [members]
  );

  const updateMembership = async (member, action) => {
    try {
      if (action === "approve") await approveInstitutionMember(member._id);
      else await removeInstitutionMember(member._id);
      await loadData();
      toast.success(action === "approve" ? "Student association approved." : "Student association removed.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update this student association.");
    }
  };

  return (
    <main className="institution-portal page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">Institution workspace</p>
          <h1>{user?.name || "Institution portal"}</h1>
          <p>Review student associations and browse the career roles catalog.</p>
        </div>
        <button className="btn btn-outline" type="button" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <nav className="tabs" aria-label="Institution sections">
        {TABS.map(([id, label]) => (
          <button
            className={`tab ${activeTab === id ? "active" : ""}`}
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {loadError && (
        <div className="error-state" role="alert">
          <p>{loadError}</p>
          <button className="btn btn-outline btn-sm" type="button" onClick={loadData}>Try again</button>
        </div>
      )}

      {activeTab === "roles" && <AdminRoles institutionMode />}

      {activeTab === "overview" && (
        <section className="institution-overview" aria-label="Institution overview">
          {loading ? (
            <p role="status">Loading institution data…</p>
          ) : loadError ? (
            <p>Overview metrics are unavailable until the institution data can be loaded.</p>
          ) : (
            <>
              <div className="institution-stat-grid">
                <article className="card">
                  <FaUserGraduate aria-hidden="true" />
                  <strong>{activeMembers.length}</strong>
                  <span>Active student associations</span>
                </article>
                <article className="card">
                  <strong>{pendingMembers.length}</strong>
                  <span>Pending association requests</span>
                </article>
                <article className="card">
                  <strong>{institutions.length}</strong>
                  <span>Institutions in the directory</span>
                </article>
              </div>
              <p className="text-muted">
                Placement, workshop, and cohort-readiness analytics are not available in the current institution API.
              </p>
            </>
          )}
        </section>
      )}

      {activeTab === "members" && (
        <section aria-label="Student associations">
          <h2>Student associations</h2>
          {loading ? (
            <p role="status">Loading student associations…</p>
          ) : members.length === 0 ? (
            <div className="empty-state">No student association records are available.</div>
          ) : (
            <div className="institution-member-list">
              {members.map((member) => (
                <article className="card institution-member" key={member._id}>
                  <div>
                    <strong>{member.student?.name || "Student record unavailable"}</strong>
                    <p>{member.student?.email || "No email available"}</p>
                    <p>
                      {[member.student?.branch, member.student?.preferences?.educationStage]
                        .filter(Boolean)
                        .join(" · ") || "No study details available"}
                    </p>
                    <span className="badge">{member.status}</span>
                  </div>
                  <div className="institution-member-actions">
                    {member.status === "PENDING" && (
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        onClick={() => updateMembership(member, "approve")}
                      >
                        <FaCheck /> Approve
                      </button>
                    )}
                    {["PENDING", "ACTIVE"].includes(member.status) && (
                      <button
                        className="btn btn-outline btn-sm"
                        type="button"
                        onClick={() => updateMembership(member, "remove")}
                      >
                        <FaXmark /> Remove
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "institutions" && (
        <section aria-label="Institution directory">
          <h2>Institution directory</h2>
          {loading ? (
            <p role="status">Loading institutions…</p>
          ) : institutions.length === 0 ? (
            <div className="empty-state">No institutions are listed yet.</div>
          ) : (
            <div className="institution-directory">
              {institutions.map((institution) => (
                <article className="card" key={institution._id}>
                  <h3>{institution.name}</h3>
                  <p>{institution.category || "Category not provided"}</p>
                  <p>{institution.location || "Location not provided"}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
