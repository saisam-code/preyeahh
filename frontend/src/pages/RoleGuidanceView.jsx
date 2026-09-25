import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

export default function RoleGuidanceView() {
  const { roleId } = useParams();
  const [role, setRole] = useState(null);
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGuidance = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch role + guidance details
        const res = await api.get(`/guidance/role/${roleId}`);
        const { role: roleData, milestones } = res.data.data;

        setRole(roleData);
        setGuidance({
          milestones: milestones.filter((m) => m.status === "available"), // Only available milestones
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load guidance");
      } finally {
        setLoading(false);
      }
    };

    if (roleId) fetchGuidance();
  }, [roleId]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!role || !guidance) return <ErrorMessage message="Guidance not found" />;

  return (
    <div className="role-guidance-view">
      {/* HEADER */}
      <div className="guidance-header">
        <h1>{role.name}</h1>
        <p className="role-description">{role.description}</p>
      </div>

      {/* REQUIRED SKILLS */}
      <section className="guidance-section">
        <h2>📚 Required Skills</h2>
        <div className="skills-grid">
          {role.guidance?.skills?.length > 0 ? (
            role.guidance.skills.map((skill) => (
              <div key={skill} className="skill-tag">
                {skill}
              </div>
            ))
          ) : (
            <p>No skills listed yet</p>
          )}
        </div>
      </section>

      {/* LEARNING PATH - MILESTONES */}
      <section className="guidance-section">
        <h2>🎯 Learning Path</h2>
        <p className="section-subtitle">
          {guidance.milestones.length} milestones to complete
        </p>

        {guidance.milestones.length > 0 ? (
          <div className="milestones-list">
            {guidance.milestones.map((milestone, index) => (
              <div key={milestone._id} className="milestone-card">
                <div className="milestone-header">
                  <h3>
                    {index + 1}. {milestone.title}
                  </h3>
                  <span className="milestone-status">{milestone.status}</span>
                </div>
                <p>{milestone.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No learning milestones available yet</p>
        )}
      </section>

      {/* CALL TO ACTION */}
      <section className="guidance-cta">
        <button className="btn-primary">Start Learning Path</button>
        <button className="btn-secondary">View Resources</button>
      </section>

      <style jsx>{`
        .role-guidance-view {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .guidance-header {
          background: linear-gradient(135deg, #61dafb 0%, #4fa8c5 100%);
          color: white;
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .guidance-header h1 {
          margin: 0 0 1rem 0;
          font-size: 2rem;
        }

        .role-description {
          margin: 0;
          font-size: 1rem;
          opacity: 0.9;
        }

        .guidance-section {
          margin-bottom: 3rem;
        }

        .guidance-section h2 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #282c34;
        }

        .section-subtitle {
          color: #666;
          margin-bottom: 1.5rem;
        }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
        }

        .skill-tag {
          background: #f0f8ff;
          border: 2px solid #61dafb;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          text-align: center;
          font-weight: 500;
          color: #282c34;
        }

        .milestones-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .milestone-card {
          background: white;
          border: 1px solid #ddd;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .milestone-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .milestone-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 0.75rem;
        }

        .milestone-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .milestone-status {
          background: #d4edda;
          color: #155724;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .milestone-card p {
          margin: 0;
          color: #666;
          line-height: 1.5;
        }

        .guidance-cta {
          display: flex;
          gap: 1rem;
          margin-top: 3rem;
          justify-content: center;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 2rem;
          font-size: 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: #61dafb;
          color: #282c34;
        }

        .btn-primary:hover {
          background: #4fa8c5;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: transparent;
          color: #61dafb;
          border: 2px solid #61dafb;
        }

        .btn-secondary:hover {
          background: #f0f8ff;
        }
      `}</style>
    </div>
  );
}
