import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    <div className="get-started-page">
      <div className="get-started-heading">
        <span style={{ fontSize: "var(--font-size-sm)", textTransform: "uppercase", letterSpacing: 1.2, color: "var(--primary)", fontWeight: 700 }}>
          Welcome to Preyeahh
        </span>
        <h1>
          How would you like to use Preyeahh?
        </h1>
        <p>
          Choose your role to get a tailored career development experience designed specifically for your goals.
        </p>
      </div>

      <div className="get-started-role-grid">
        {ROLES.map((r) => {
          const Icon = r.icon;
          const isSelected = selectedRole === r.id;
          return (
            <button
              type="button"
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`get-started-role-card${isSelected ? " selected" : ""}`}
              aria-pressed={isSelected}
            >
              <div className="get-started-role-card-top">
                <div className="get-started-role-icon">
                  <Icon />
                </div>
                {isSelected && (
                  <div className="get-started-role-check" aria-label="Selected">
                    <FaCheck aria-hidden="true" />
                  </div>
                )}
              </div>

              <span className="get-started-role-title">{r.title}</span>
              <span className="get-started-role-description">
                {r.description}
              </span>
              <span className="get-started-role-badge">{r.badge}</span>
            </button>
          );
        })}
      </div>

      <div className="get-started-actions">
        <button
          className="btn btn-primary"
          onClick={handleProceed}
        >
          Continue to Registration <FaArrowRight />
        </button>

        <div className="get-started-signin">
          Already have a Preyeahh account?{" "}
          <Link to={`/login?role=${selectedRole}`}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
