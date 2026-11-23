import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaGraduationCap,
  FaHeart,
  FaBullseye,
  FaWrench,
  FaClock,
  FaBuilding,
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
} from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import { updatePreferences } from "../services/studentService.js";

const STAGES = [
  "Class 6-8",
  "Class 9-10",
  "Intermediate / Class 11-12",
  "Diploma",
  "Undergraduate",
  "Postgraduate",
  "PhD",
  "Independent Learner / Career Switcher",
];

const INTERESTS_LIST = [
  "Technology & Engineering",
  "Medicine & Healthcare",
  "Arts, Design & Media",
  "Business & Entrepreneurship",
  "Science & Research",
  "Law & Public Services",
  "Education & Psychology",
  "Sports & Fitness",
  "Agriculture & Environment",
  "Skilled Trades & Vocational",
  "Aviation & Defence",
  "Emerging & Unconventional",
];

const SKILLS_LIST = [
  "Problem Solving",
  "Programming",
  "Communication",
  "Creativity & Design",
  "Mathematics",
  "Leadership",
  "Writing & Content",
  "Public Speaking",
];

export default function StudentOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Onboarding Form State
  const [stage, setStage] = useState("Undergraduate");
  const [stream, setStream] = useState("CSE");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [careerState, setCareerState] = useState("know"); // know, multiple, explore
  const [primaryGoal, setPrimaryGoal] = useState("Software Engineer");
  const [alternativeGoal, setAlternativeGoal] = useState("UI/UX Designer");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [dailyHours, setDailyHours] = useState(2);
  const [connectionType, setConnectionType] = useState("independent"); // independent, institution
  const [institutionCode, setInstitutionCode] = useState("");
  const [saving, setSaving] = useState(false);

  // Consume pre-selected interests from Career Wheel if coming from Login / entry
  useEffect(() => {
    if (location.state?.preselectedInterests?.length) {
      setSelectedInterests(location.state.preselectedInterests);
    }
    if (location.state?.preselectedRoles?.length) {
      setPrimaryGoal(location.state.preselectedRoles[0]);
      if (location.state.preselectedRoles[1]) {
        setAlternativeGoal(location.state.preselectedRoles[1]);
      }
    }
  }, [location.state]);

  const toggleInterest = (item) => {
    if (selectedInterests.includes(item)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== item));
    } else {
      setSelectedInterests([...selectedInterests, item]);
    }
  };

  const toggleSkill = (item) => {
    if (selectedSkills.includes(item)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== item));
    } else {
      setSelectedSkills([...selectedSkills, item]);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (user) {
        await updatePreferences({
          educationStage: stage,
          academicStream: stream,
          interests: selectedInterests,
          primaryCareerGoal: primaryGoal,
          alternativeCareerGoal: alternativeGoal,
          targetRole: primaryGoal,
          skills: selectedSkills.map((s) => ({ name: s, level: "beginner" })),
          weeklyHoursAvailable: dailyHours * 7,
          onboardingCompleted: true,
        });
        toast.success("Welcome aboard! Your career workspace is ready.");
        navigate("/planner");
      } else {
        toast.success("Preferences configured! Please sign in or create an account to save your workspace.");
        navigate("/login", {
          state: {
            onboardingData: {
              educationStage: stage,
              academicStream: stream,
              interests: selectedInterests,
              primaryCareerGoal: primaryGoal,
              alternativeCareerGoal: alternativeGoal,
              skills: selectedSkills,
              weeklyHoursAvailable: dailyHours * 7,
            },
          },
        });
      }
    } catch (err) {
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 750, margin: "2rem auto", padding: "1.5rem" }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          <span>STEP {step} OF {totalSteps}</span>
          <span>{Math.round((step / totalSteps) * 100)}% COMPLETE</span>
        </div>
        <div style={{ width: "100%", height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${(step / totalSteps) * 100}%`, height: "100%", background: "var(--primary)", transition: "width 0.3s ease" }} />
        </div>
      </div>

      <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "2rem" }}>
        {/* Step 1: Education Stage */}
        {step === 1 && (
          <div>
            <h2 style={{ margin: "0 0 0.5rem" }}>What is your current education level?</h2>
            <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem" }}>
              Preyeahh tailors roadmaps, opportunities, and timelines specifically to your stage.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {STAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`tab ${stage === s ? "active" : ""}`}
                  onClick={() => setStage(s)}
                  style={{ padding: "0.85rem", textAlign: "left", borderRadius: "0.6rem" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Interests */}
        {step === 2 && (
          <div>
            <h2 style={{ margin: "0 0 0.5rem" }}>What domains excite you most?</h2>
            <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem" }}>
              Select all that apply. Preyeahh connects you to both conventional & unconventional careers.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              {INTERESTS_LIST.map((item) => {
                const active = selectedInterests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    style={{
                      padding: "0.6rem 1rem",
                      borderRadius: "2rem",
                      border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                      background: active ? "var(--primary-bg, rgba(26,86,219,0.08))" : "var(--card-bg)",
                      color: active ? "var(--primary)" : "inherit",
                      cursor: "pointer",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Career Goals */}
        {step === 3 && (
          <div>
            <h2 style={{ margin: "0 0 0.5rem" }}>Do you have a target career in mind?</h2>
            <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem" }}>
              You can experiment and change your direction anytime without losing your skills or progress.
            </p>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>Primary Career Target</label>
              <input
                type="text"
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                placeholder="e.g. Software Engineer, Filmmaker, Architect..."
                style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "0.5rem", border: "1px solid var(--border)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>Alternative / Backup Career (Optional)</label>
              <input
                type="text"
                value={alternativeGoal}
                onChange={(e) => setAlternativeGoal(e.target.value)}
                placeholder="e.g. UX Designer, Data Analyst, Photographer..."
                style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "0.5rem", border: "1px solid var(--border)" }}
              />
            </div>
          </div>
        )}

        {/* Step 4: Skills */}
        {step === 4 && (
          <div>
            <h2 style={{ margin: "0 0 0.5rem" }}>What are your existing skills & strengths?</h2>
            <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem" }}>
              Self-reported skills help the Personal Career Planner identify your skill gaps.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              {SKILLS_LIST.map((skill) => {
                const active = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    style={{
                      padding: "0.6rem 1rem",
                      borderRadius: "2rem",
                      border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                      background: active ? "var(--primary-bg, rgba(26,86,219,0.08))" : "var(--card-bg)",
                      color: active ? "var(--primary)" : "inherit",
                      cursor: "pointer",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Daily Time Commitment */}
        {step === 5 && (
          <div>
            <h2 style={{ margin: "0 0 0.5rem" }}>How much time can you spend on development daily?</h2>
            <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem" }}>
              The planner creates realistic, balanced timetables that prevent burnout.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              {[1, 2, 3, 4].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  className={`tab ${dailyHours === hrs ? "active" : ""}`}
                  onClick={() => setDailyHours(hrs)}
                  style={{ flex: 1, padding: "1.25rem", textAlign: "center", borderRadius: "0.75rem" }}
                >
                  <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{hrs}h</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>per day</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Platform Connection */}
        {step === 6 && (
          <div>
            <h2 style={{ margin: "0 0 0.5rem" }}>How are you connecting to Preyeahh?</h2>
            <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem" }}>
              Independent learners get full platform access. Institution members receive extra college events.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div
                onClick={() => setConnectionType("independent")}
                style={{
                  border: connectionType === "independent" ? "2px solid var(--primary)" : "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  padding: "1rem",
                  cursor: "pointer",
                }}
              >
                <strong>I am joining independently</strong>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Full access to career roadmaps, AI planner, mentor discovery, and public opportunities.
                </p>
              </div>

              <div
                onClick={() => setConnectionType("institution")}
                style={{
                  border: connectionType === "institution" ? "2px solid var(--primary)" : "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  padding: "1rem",
                  cursor: "pointer",
                }}
              >
                <strong>My school / college is connected to Preyeahh</strong>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Enter your institution code to connect with your college's placement cell and clubs.
                </p>
                {connectionType === "institution" && (
                  <input
                    type="text"
                    value={institutionCode}
                    onChange={(e) => setInstitutionCode(e.target.value)}
                    placeholder="Enter Institution Association Code"
                    style={{ marginTop: "0.75rem", width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.4rem", border: "1px solid var(--border)" }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step Actions */}
        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between" }}>
          {step > 1 ? (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setStep((s) => s - 1)}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <FaArrowLeft /> Back
            </button>
          ) : <div />}

          {step < totalSteps ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep((s) => s + 1)}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              Next <FaArrowRight />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleFinish}
              disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              {saving ? "Setting up..." : "Complete & Open Workspace"} <FaCheck />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
