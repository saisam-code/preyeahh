import { useState, useEffect, useRef } from "react";
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
import { getStudentGoals, updatePreferences } from "../services/studentService.js";
import { STUDENT_EDUCATION_STAGES, normalizeEducationStage } from "../constants/educationStages.js";

const STAGES = STUDENT_EDUCATION_STAGES;
const DRAFT_PREFIX = "preyeahh.student-onboarding";

function readOnboardingDraft(key) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

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
  const draftKey = `${DRAFT_PREFIX}.${user?.id || "guest"}`;
  const [draft] = useState(() => readOnboardingDraft(draftKey));
  const preferences = user?.preferences || {};
  const initialValue = (key, fallback) => draft[key] ?? preferences[key] ?? fallback;
  const savedStage = initialValue("educationStage", "");
  const [step, setStep] = useState(() => Math.min(6, Math.max(1, Number(draft.step) || preferences.onboardingStep || 1)));
  const totalSteps = 6;

  // Onboarding Form State
  const [stage, setStage] = useState(() => typeof savedStage === "string" && savedStage ? normalizeEducationStage(savedStage) : "");
  const [schoolOrInstitution, setSchoolOrInstitution] = useState(() => initialValue("schoolOrInstitution", ""));
  const [board, setBoard] = useState(() => initialValue("board", ""));
  const [subjects, setSubjects] = useState(() => {
    const saved = initialValue("subjects", []);
    return Array.isArray(saved) ? saved.filter((subject) => typeof subject === "string") : [];
  });
  const [academicStream, setAcademicStream] = useState(() => initialValue("academicStream", ""));
  const [degreeOrProgram, setDegreeOrProgram] = useState(() => initialValue("degreeOrProgram", ""));
  const [specialization, setSpecialization] = useState(() => initialValue("specialization", ""));
  const [yearOfStudy, setYearOfStudy] = useState(() => initialValue("yearOfStudy", ""));
  const [semester, setSemester] = useState(() => initialValue("semester", ""));
  const [expectedGraduationYear, setExpectedGraduationYear] = useState(() => initialValue("expectedGraduationYear", ""));
  const [country, setCountry] = useState(() => initialValue("country", "India"));
  const [stateName, setStateName] = useState(() => initialValue("state", ""));
  const [city, setCity] = useState(() => initialValue("city", ""));
  const [currentRole, setCurrentRole] = useState(() => initialValue("currentRole", ""));
  const [selectedInterests, setSelectedInterests] = useState(() => {
    const saved = initialValue("interests", []);
    return Array.isArray(saved) ? saved.filter((interest) => typeof interest === "string") : [];
  });
  const [primaryGoal, setPrimaryGoal] = useState(() => initialValue("primaryCareerGoal", ""));
  const [alternativeGoal, setAlternativeGoal] = useState(() => initialValue("alternativeCareerGoal", ""));
  const careerGoalsEdited = useRef(false);
  const [careerPreference, setCareerPreference] = useState(() => initialValue("careerPreference", "unsure"));
  const [selectedSkills, setSelectedSkills] = useState(() => {
    const saved = draft.skills || preferences.skills || [];
    return Array.isArray(saved)
      ? saved.map((skill) => typeof skill === "string" ? skill : skill?.name).filter((skill) => typeof skill === "string")
      : [];
  });
  const [dailyHours, setDailyHours] = useState(() => Math.max(1, Math.min(4, Math.round((draft.dailyHours ?? preferences.weeklyHoursAvailable / 7) || 2))));
  const [learningStyle, setLearningStyle] = useState(() => initialValue("learningStyle", ""));
  const [connectionType, setConnectionType] = useState(() => draft.connectionType || "independent");
  const [institutionCode, setInstitutionCode] = useState(() => draft.institutionCode || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({
        step,
        educationStage: stage,
        schoolOrInstitution,
        board,
        subjects,
        academicStream,
        degreeOrProgram,
        specialization,
        yearOfStudy,
        semester,
        expectedGraduationYear,
        country,
        state: stateName,
        city,
        currentRole,
        interests: selectedInterests,
        primaryCareerGoal: primaryGoal,
        alternativeCareerGoal: alternativeGoal,
        careerPreference,
        skills: selectedSkills,
        dailyHours,
        learningStyle,
        connectionType,
        institutionCode,
      }));
    } catch {
      toast.error("Your onboarding draft could not be saved on this device.");
    }
  }, [
    draftKey, step, stage, schoolOrInstitution, board, subjects, academicStream, degreeOrProgram,
    specialization, yearOfStudy, semester, expectedGraduationYear, country,
    stateName, city, currentRole, selectedInterests, primaryGoal, alternativeGoal,
    careerPreference, selectedSkills, dailyHours, learningStyle, connectionType, institutionCode,
  ]);

  // Consume pre-selected interests from Career Wheel if coming from Login / entry
  useEffect(() => {
    if (Object.keys(draft).length) return;
    if (location.state?.preselectedInterests?.length) {
      setSelectedInterests(location.state.preselectedInterests);
    }
    if (location.state?.preselectedRoles?.length) {
      setPrimaryGoal(location.state.preselectedRoles[0]);
      if (location.state.preselectedRoles[1]) {
        setAlternativeGoal(location.state.preselectedRoles[1]);
      }
    }
  }, [draft, location.state]);

  useEffect(() => {
    if (!user?.id) return;
    if (
      Object.hasOwn(draft, "primaryCareerGoal")
      || Object.hasOwn(draft, "alternativeCareerGoal")
      || location.state?.preselectedRoles?.length
    ) return;

    let active = true;
    getStudentGoals()
      .then((goals) => {
        if (!active || careerGoalsEdited.current) return;
        const primary = goals.find((goal) => goal.type === "PRIMARY");
        const alternative = goals.find((goal) => goal.type === "ALTERNATIVE");
        if (primary) setPrimaryGoal(primary.goalTitle);
        if (alternative) setAlternativeGoal(alternative.goalTitle);
      })
      .catch(() => {
        if (active) toast.error("Saved career goals could not be loaded. Existing profile values are unchanged.");
      });

    return () => {
      active = false;
    };
  }, [user?.id, draft, location.state?.preselectedRoles]);

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
    const onboardingData = {
      educationStage: stage,
      schoolOrInstitution,
      board,
      subjects,
      academicStream,
      degreeOrProgram,
      specialization,
      yearOfStudy,
      semester,
      expectedGraduationYear: expectedGraduationYear ? Number(expectedGraduationYear) : null,
      country,
      state: stateName,
      city,
      currentRole,
      interests: selectedInterests,
      primaryCareerGoal: primaryGoal,
      alternativeCareerGoal: alternativeGoal,
      careerPreference,
      skills: selectedSkills.map((name) => ({ name, level: "beginner" })),
      weeklyHoursAvailable: dailyHours * 7,
      learningStyle,
      onboardingStep: totalSteps,
      onboardingCompleted: true,
    };
    try {
      if (user) {
        await updatePreferences(onboardingData);
        try {
          localStorage.removeItem(draftKey);
        } catch {
          toast.error("Your completed onboarding draft could not be removed from this device.");
        }
        toast.success("Welcome aboard! Your career workspace is ready.");
        navigate("/planner");
      } else {
        toast.success("Preferences configured! Create your student account to activate your plan.");
        navigate("/register?role=student", {
          state: { onboardingData },
        });
      }
    } catch {
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    if (user) {
      setSaving(true);
      try {
        await updatePreferences({
          educationStage: stage,
          schoolOrInstitution,
          board,
          subjects,
          academicStream,
          degreeOrProgram,
          specialization,
          yearOfStudy,
          semester,
          expectedGraduationYear: expectedGraduationYear ? Number(expectedGraduationYear) : null,
          country,
          state: stateName,
          city,
          currentRole,
          interests: selectedInterests,
          primaryCareerGoal: primaryGoal,
          alternativeCareerGoal: alternativeGoal,
          careerPreference,
          skills: selectedSkills.map((name) => ({ name, level: "beginner" })),
          weeklyHoursAvailable: dailyHours * 7,
          learningStyle,
          onboardingStep: step + 1,
          onboardingCompleted: false,
        });
      } catch {
        toast.error("Could not save your progress. Please try again.");
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setStep((current) => current + 1);
  };

  const isSchoolStage = stage.startsWith("Class") || stage === "Intermediate";
  const isProgramStage = ["Diploma", "Undergraduate", "Postgraduate", "PhD", "Research Scholar", "Postdoctoral Research"].includes(stage);
  const stageOptions = stage && !STAGES.includes(stage) ? [...STAGES, stage] : STAGES;

  return (
    <div style={{ maxWidth: 750, margin: "2rem auto", padding: "1.5rem" }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-sm)", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          <span>STEP {step} OF {totalSteps}</span>
          <span>{Math.round((step / totalSteps) * 100)}% COMPLETE</span>
        </div>
        <div style={{ width: "100%", height: 6, background: "var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          <div style={{ width: `${(step / totalSteps) * 100}%`, height: "100%", background: "var(--primary)", transition: "width 0.3s ease" }} />
        </div>
      </div>

      <div style={{ background: "var(--card-bg, var(--white))", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "2rem" }}>
        {/* Step 1: Education Stage */}
        {step === 1 && (
          <div>
            <h2 style={{ margin: "0 0 0.5rem" }}>What is your current education level?</h2>
            <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem" }}>
              Preyeahh tailors roadmaps, opportunities, and timelines specifically to your stage.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {stageOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`tab ${stage === s ? "active" : ""}`}
                  onClick={() => setStage(s)}
                  style={{ padding: "0.85rem", textAlign: "left", borderRadius: "var(--radius)" }}
                >
                  {s}
                </button>
              ))}
            </div>
            <p style={{ color: "var(--text-muted)", margin: "1rem 0" }}>
              Not sure or between stages? You can leave this blank and update it later.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label>
                School / institution
                <input value={schoolOrInstitution} onChange={(e) => setSchoolOrInstitution(e.target.value)} maxLength={120} />
              </label>
              {isSchoolStage && (
                <label>
                  Board
                  <input value={board} onChange={(e) => setBoard(e.target.value)} maxLength={40} placeholder="e.g. CBSE, State Board" />
                </label>
              )}
              {(isSchoolStage || isProgramStage) && (
                <label>
                  Subjects (comma-separated)
                  <input
                    value={subjects.join(", ")}
                    onChange={(e) => setSubjects(e.target.value.split(",").map((subject) => subject.trim()).filter(Boolean))}
                    maxLength={600}
                  />
                </label>
              )}
              {isSchoolStage && (
                <label>
                  Stream
                  <select value={academicStream} onChange={(e) => setAcademicStream(e.target.value)}>
                    <option value="">Not selected</option>
                    <option value="Science">Science</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Humanities">Humanities</option>
                    <option value="Vocational">Vocational</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              )}
              {isProgramStage && (
                <>
                  <label>
                    Program / degree
                    <input value={degreeOrProgram} onChange={(e) => setDegreeOrProgram(e.target.value)} maxLength={60} placeholder="e.g. BSc, Diploma" />
                  </label>
                  <label>
                    Specialization
                    <input value={specialization} onChange={(e) => setSpecialization(e.target.value)} maxLength={60} />
                  </label>
                  <label>
                    Year of study
                    <input value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)} maxLength={20} placeholder="e.g. Year 2" />
                  </label>
                  <label>
                    Semester (optional)
                    <input value={semester} onChange={(e) => setSemester(e.target.value)} maxLength={20} />
                  </label>
                  <label>
                    Expected graduation year
                    <input
                      type="number"
                      min="1900"
                      max="2200"
                      value={expectedGraduationYear || ""}
                      onChange={(e) => setExpectedGraduationYear(e.target.value)}
                    />
                  </label>
                  <label>
                    Program stream
                    <input value={academicStream} onChange={(e) => setAcademicStream(e.target.value)} maxLength={40} />
                  </label>
                </>
              )}
              <label>
                Country
                <input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={60} />
              </label>
              <label>
                State / region
                <input value={stateName} onChange={(e) => setStateName(e.target.value)} maxLength={80} />
              </label>
              <label>
                City
                <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} />
              </label>
              {stage === "Working Professional" && (
                <label>
                  Current role
                  <input value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} maxLength={120} />
                </label>
              )}
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
                      borderRadius: "var(--radius)",
                      border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                      background: active ? "var(--primary-bg, color-mix(in srgb, var(--info) 8%, transparent))" : "var(--card-bg)",
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

            <fieldset style={{ border: 0, padding: 0, margin: "0 0 1.25rem" }}>
              <legend style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Career direction</legend>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {[
                  ["traditional", "Traditional"],
                  ["unconventional", "Unconventional"],
                  ["both", "A mix of both"],
                  ["unsure", "Still exploring"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`tab ${careerPreference === value ? "active" : ""}`}
                    onClick={() => setCareerPreference(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>Primary Career Target</label>
              <input
                type="text"
                value={primaryGoal}
                onChange={(e) => {
                  careerGoalsEdited.current = true;
                  setPrimaryGoal(e.target.value);
                }}
                placeholder="e.g. Software Engineer, Filmmaker, Architect..."
                style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>Alternative / Backup Career (Optional)</label>
              <input
                type="text"
                value={alternativeGoal}
                onChange={(e) => {
                  careerGoalsEdited.current = true;
                  setAlternativeGoal(e.target.value);
                }}
                placeholder="e.g. UX Designer, Data Analyst, Photographer..."
                style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
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
                      borderRadius: "var(--radius)",
                      border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                      background: active ? "var(--primary-bg, color-mix(in srgb, var(--info) 8%, transparent))" : "var(--card-bg)",
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
                  style={{ flex: 1, padding: "1.25rem", textAlign: "center", borderRadius: "var(--radius)" }}
                >
                  <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 700 }}>{hrs}h</div>
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>per day</div>
                </button>
              ))}
            </div>
            <label style={{ display: "block", marginTop: "1.25rem" }}>
              Preferred learning style
              <select value={learningStyle} onChange={(e) => setLearningStyle(e.target.value)}>
                <option value="">No preference</option>
                <option value="visual">Visual</option>
                <option value="hands-on">Hands-on</option>
                <option value="reading">Reading</option>
              </select>
            </label>
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
                  borderRadius: "var(--radius)",
                  padding: "1rem",
                  cursor: "pointer",
                }}
              >
                <strong>I am joining independently</strong>
                <p style={{ margin: "0.25rem 0 0", fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>
                  Full access to career roadmaps, AI planner, mentor discovery, and public opportunities.
                </p>
              </div>

              <div
                onClick={() => setConnectionType("institution")}
                style={{
                  border: connectionType === "institution" ? "2px solid var(--primary)" : "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "1rem",
                  cursor: "pointer",
                }}
              >
                <strong>My school / college is connected to Preyeahh</strong>
                <p style={{ margin: "0.25rem 0 0", fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>
                  Enter your institution code to connect with your college's placement cell and clubs.
                </p>
                {connectionType === "institution" && (
                  <input
                    type="text"
                    value={institutionCode}
                    onChange={(e) => setInstitutionCode(e.target.value)}
                    placeholder="Enter Institution Association Code"
                    style={{ marginTop: "0.75rem", width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
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
              onClick={handleContinue}
              disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              {saving ? "Saving..." : "Next"} <FaArrowRight />
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
