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
    if (selectedRole === "student") {
      navigate("/onboarding");
    } else {
      navigate(`/login?role=${selectedRole}`);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "1.5rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1.2, color: "var(--primary)", fontWeight: 700 }}>
          Welcome to Preyeahh
        </span>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, margin: "0.5rem 0" }}>
          How would you like to use Preyeahh?
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: 620, margin: "0 auto" }}>
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
                background: "var(--card-bg, #fff)",
                border: isSelected ? "2.5px solid var(--primary)" : "1px solid var(--border)",
                borderRadius: "1rem",
                padding: "1.5rem",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s ease",
                boxShadow: isSelected ? "0 8px 24px rgba(26,86,219,0.12)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: "0.75rem", background: isSelected ? "var(--primary)" : "var(--badge-bg)", color: isSelected ? "#fff" : "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                  <Icon />
                </div>
                {isSelected && (
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>
                    <FaCheck />
                  </div>
                )}
              </div>

              <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.2rem" }}>{r.title}</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
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
          style={{ padding: "0.75rem 2rem", fontSize: "1rem", borderRadius: "0.6rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          Continue to Registration <FaArrowRight />
        </button>

        <div style={{ marginTop: "1.25rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
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
