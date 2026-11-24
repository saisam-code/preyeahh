import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserGraduate,
  FaUsers,
  FaChalkboardUser,
  FaBuildingColumns,
  FaArrowRight,
  FaCheck,
} from "react-icons/fa6";

const ROLES = [
  {
    id: "student",
    title: "I am a Student",
    icon: FaUserGraduate,
    description: "From Class 6 to PhD: Discover careers, experiment, generate roadmaps, and plan your daily progress.",
    badge: "Most Popular",
  },
  {
    id: "parent",
    title: "I am a Parent / Guardian",
    icon: FaUsers,
    description: "Support your child's career journey, understand financial realities, and track milestones safely.",
    badge: "Family",
  },
  {
    id: "guide",
    title: "I am a Guide / Mentor",
    icon: FaChalkboardUser,
    description: "Share your professional industry experience, mentor students, and help shape the next generation.",
    badge: "Professional",
  },
  {
    id: "institution",
    title: "I represent a School / College",
    icon: FaBuildingColumns,
    description: "Connect your institution's placement cell, organize clubs, events, and empower your students.",
    badge: "Institutional",
  },
];

export default function GetStarted() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("student");

  const handleProceed = () => {
    navigate(`/register?role=${selectedRole}`);
  };

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "1.5rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <span style={{ fontSize: "var(--font-size-sm)", textTransform: "uppercase", letterSpacing: 1.2, color: "var(--primary)", fontWeight: 700 }}>
          Welcome to Preyeahh
        </span>
        <h1 style={{ fontSize: "var(--font-size-3xl)", fontWeight: 800, margin: "0.5rem 0" }}>
          How would you like to use Preyeahh?
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-md)", maxWidth: 620, margin: "0 auto" }}>
          Choose your role to get a tailored career development experience designed specifically for your goals.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        {ROLES.map((r) => {
          const Icon = r.icon;
          const isSelected = selectedRole === r.id;
          return (
            <div
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              style={{
                background: "var(--card-bg, var(--white))",
                border: isSelected ? "2.5px solid var(--primary)" : "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "1.5rem",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s ease",
                boxShadow: isSelected ? "0 8px 24px color-mix(in srgb, var(--info) 12%, transparent)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: "var(--radius)", background: isSelected ? "var(--primary)" : "var(--badge-bg)", color: isSelected ? "var(--on-primary)" : "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--font-size-lg)" }}>
                  <Icon />
                </div>
                {isSelected && (
                  <div style={{ width: 22, height: 22, borderRadius: "var(--r-full)", background: "var(--primary)", color: "var(--on-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--font-size-xs)" }}>
                    <FaCheck />
                  </div>
                )}
              </div>

              <h3 style={{ margin: "0 0 0.4rem", fontSize: "var(--font-size-lg)" }}>{r.title}</h3>
              <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {r.description}
              </p>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center" }}>
        <button
          className="btn btn-primary"
          onClick={handleProceed}
          style={{ padding: "0.75rem 2rem", fontSize: "var(--font-size-md)", borderRadius: "var(--radius)", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          Continue to Registration <FaArrowRight />
        </button>

        <div style={{ marginTop: "1.25rem", fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>
          Already have a Preyeahh account?{" "}
          <span
            onClick={() => navigate(`/login?role=${selectedRole}`)}
            style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
          >
            Sign In here
          </span>
        </div>
      </div>
    </div>
  );
}
