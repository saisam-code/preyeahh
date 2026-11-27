import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import {
  changeStudentGoal,
  createParentLinkCode,
  extractProfile,
  getStudentGoals,
  getStudentParentLinks,
  updatePreferences,
  updateStudentParentLinkStatus,
} from "../services/studentService.js";

const card = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem", marginBottom: "1.5rem" };
const selectStyle = { width: "100%", padding: "0.55rem 0.75rem", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)" };
const csv = (arr) => (arr || []).join(", ");
const splitCsv = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function Profile() {
  const { user, updateUser } = useAuth();
  const prefs = user?.preferences || {};

  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [careerGoals, setCareerGoals] = useState([]);
  const [parentLinks, setParentLinks] = useState([]);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalType, setNewGoalType] = useState("ALTERNATIVE");
  const [newGoalOrigin, setNewGoalOrigin] = useState("DISCOVERY");
  const [goalChangeReason, setGoalChangeReason] = useState("");
  const [parentLinkCode, setParentLinkCode] = useState("");
  const [parentLinkCodeExpiresAt, setParentLinkCodeExpiresAt] = useState(null);
  const [generatingParentLinkCode, setGeneratingParentLinkCode] = useState(false);

  useEffect(() => {
    getStudentGoals()
      .then(setCareerGoals)
      .catch(() => toast.error("Career goal history could not be loaded."));
    getStudentParentLinks()
      .then(setParentLinks)
      .catch(() => toast.error("Parent link requests could not be loaded."));
  }, []);

  const handleParentLinkStatus = async (link, status) => {
    try {
      const updated = await updateStudentParentLinkStatus(link._id, status);
      setParentLinks((current) => current.map((item) => item._id === updated._id ? { ...item, ...updated } : item));
      toast.success(status === "ACTIVE" ? "Parent access approved" : "Parent access revoked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update parent access");
    }
  };

  const handleGoalChange = async (goal, status) => {
    try {
      const updated = await changeStudentGoal({
        goalTitle: goal.goalTitle,
        type: goal.type,
        status,
        origin: goal.origin || "DISCOVERY",
        changeReason: goal.changeReason || "",
        previousGoalTitle: goal.previousGoalTitle || "",
      });
      setCareerGoals((current) => current.map((item) =>
        item._id === updated._id ? updated : item
      ));
      toast.success(`Career goal marked ${status.toLowerCase()}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update career goal.");
    }
  };

  const handleAddGoal = async (event) => {
    event.preventDefault();
    if (!newGoalTitle.trim()) return toast.error("Enter a career goal.");
    try {
      const created = await changeStudentGoal({
        goalTitle: newGoalTitle.trim(),
        type: newGoalType,
        status: "ACTIVE",
        origin: newGoalOrigin,
        changeReason: goalChangeReason.trim(),
        previousGoalTitle: prefs.targetRole || prefs.primaryCareerGoal || "",
      });
      setCareerGoals((current) => [created, ...current]);
      setNewGoalTitle("");
      setGoalChangeReason("");
      toast.success("Career goal saved with its history.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save career goal.");
    }
  };

  const handleGenerateParentLinkCode = async () => {
    setGeneratingParentLinkCode(true);
    try {
      const result = await createParentLinkCode();
      setParentLinkCode(result.code);
      setParentLinkCodeExpiresAt(result.expiresAt);
      toast.success("New parent link code generated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not generate a parent link code");
    } finally {
      setGeneratingParentLinkCode(false);
    }
  };
  const [themePreference, setThemePreference] = useState(() => localStorage.getItem("pp_theme") || "system");
  const [stageOverride, setStageOverride] = useState(() => localStorage.getItem("pp_stage_override") || "auto");
  const [form, setForm] = useState({
    targetRole: prefs.targetRole || "",
    experienceLevel: prefs.experienceLevel || "beginner",
    learningStyle: prefs.learningStyle || "",
    weeklyHoursAvailable: prefs.weeklyHoursAvailable || "",
    goals: csv(prefs.goals),
    interests: csv(prefs.interests),
    skills: csv((prefs.skills || []).map((s) => s.name)),
    childhoodDream: prefs.childhoodDream || "",
    formerCareerGoal: prefs.formerCareerGoal || "",
    careerSwitchReason: prefs.careerSwitchReason || "",
    shareContactWithGuides: prefs.shareContactWithGuides || false,
    shareProfileWithGuides: prefs.shareProfileWithGuides || false,
  });

  const syncForm = (p) =>
    setForm({
      targetRole: p.targetRole || "",
      experienceLevel: p.experienceLevel || "beginner",
      learningStyle: p.learningStyle || "",
      weeklyHoursAvailable: p.weeklyHoursAvailable || "",
      goals: csv(p.goals),
      interests: csv(p.interests),
      skills: csv((p.skills || []).map((s) => s.name)),
      childhoodDream: p.childhoodDream || "",
      formerCareerGoal: p.formerCareerGoal || "",
      careerSwitchReason: p.careerSwitchReason || "",
      shareContactWithGuides: p.shareContactWithGuides || false,
      shareProfileWithGuides: p.shareProfileWithGuides || false,
    });

  const handleExtract = async () => {
    if (text.trim().length < 10) return toast.error("Write at least a sentence or two");
    setExtracting(true);
    try {
      const { preferences } = await extractProfile(text.trim());
      updateUser({ preferences });
      syncForm(preferences);
      setText("");
      toast.success("Profile updated from your description");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not extract profile");
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const existing = new Map((prefs.skills || []).map((s) => [s.name.toLowerCase(), s.level]));
      const preferences = await updatePreferences({
        targetRole: form.targetRole.trim(),
        experienceLevel: form.experienceLevel,
        learningStyle: form.learningStyle || undefined,
        weeklyHoursAvailable: form.weeklyHoursAvailable === "" ? undefined : Number(form.weeklyHoursAvailable),
        goals: splitCsv(form.goals),
        interests: splitCsv(form.interests),
        shareContactWithGuides: form.shareContactWithGuides,
        shareProfileWithGuides: form.shareProfileWithGuides,
        // keep the level of skills the AI already rated; new ones start as beginner
        skills: splitCsv(form.skills).map((name) => ({ name, level: existing.get(name.toLowerCase()) || "beginner" })),
        childhoodDream: form.childhoodDream,
        formerCareerGoal: form.formerCareerGoal,
        careerSwitchReason: form.careerSwitchReason,
      });
      updateUser({ preferences });
      toast.success("Preferences saved");
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const updateThemePreference = (event) => {
    const preference = event.target.value;
    localStorage.setItem("pp_theme", preference);
    document.documentElement.dataset.theme = preference;
    setThemePreference(preference);
    window.dispatchEvent(new Event("preyeahh-theme-change"));
  };
  const updateStageOverride = (event) => {
    const override = event.target.value;
    localStorage.setItem("pp_stage_override", override);
    setStageOverride(override);
    window.dispatchEvent(new Event("preyeahh-appearance-change"));
  };

  return (
    <div>
      <div className="page-hero">
        <h1>My <span>Profile</span></h1>
        <p>{user?.name} · {user?.email} · {user?.branch}</p>
      </div>

      <div className="section" style={{ maxWidth: 760 }}>
        <div style={card}>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>Career directions & history</div>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", marginBottom: "1rem" }}>
            Keep a primary goal, alternatives and exploration goals. Changing direction preserves previous progress.
          </p>

          {careerGoals.length > 0 ? (
            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
              {careerGoals.map((goal) => (
                <div key={goal._id || goal.goalTitle} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                    <div>
                      <strong>{goal.goalTitle}</strong>
                      <div style={{ color: "var(--text-muted)", fontSize: "var(--font-size-xs)", marginTop: "0.15rem" }}>
                        {goal.type} · {goal.status} · {goal.origin?.replaceAll("_", " ") || "DISCOVERY"}
                      </div>
                    </div>
                    {goal.status === "ACTIVE" && (
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => handleGoalChange(goal, "PAUSED")}>Pause</button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => handleGoalChange(goal, "COMPLETED")}>Completed</button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => handleGoalChange(goal, "ABANDONED")}>Abandon</button>
                      </div>
                    )}
                  </div>
                  {goal.changeReason && (
                    <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", marginTop: "0.5rem" }}>{goal.changeReason}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>No saved career goals yet.</p>
          )}

          <form onSubmit={handleAddGoal} style={{ display: "grid", gap: "0.75rem" }}>
            <input value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} placeholder="Add a goal or career to explore" maxLength={120} />
            <div className="profile-goal-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <select value={newGoalType} onChange={(e) => setNewGoalType(e.target.value)} aria-label="Goal type">
                <option value="PRIMARY">Primary goal</option>
                <option value="ALTERNATIVE">Alternative goal</option>
                <option value="EXPLORING">Exploring</option>
                <option value="INTEREST">Interest</option>
              </select>
              <select value={newGoalOrigin} onChange={(e) => setNewGoalOrigin(e.target.value)} aria-label="Goal origin">
                <option value="DISCOVERY">Discovered</option>
                <option value="CHILDHOOD_DREAM">Childhood dream</option>
                <option value="CURRENT_GOAL">Current goal</option>
                <option value="SWITCH_TARGET">Career switch target</option>
              </select>
            </div>
            <input value={goalChangeReason} onChange={(e) => setGoalChangeReason(e.target.value)} placeholder="Reason for this direction (optional)" maxLength={500} />
            <button type="submit" className="btn btn-primary" style={{ justifySelf: "start" }}>Save career direction</button>
          </form>
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>Connect a parent or guardian</div>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>
            Share a temporary code with your parent or guardian. You must still approve their link request before they can view anything.
          </p>
          {parentLinkCode && (
            <p role="status" style={{ fontSize: "var(--font-size-md)" }}>
              Code: <strong><code>{parentLinkCode}</code></strong>
              {parentLinkCodeExpiresAt && ` · Expires ${new Date(parentLinkCodeExpiresAt).toLocaleDateString()}`}
            </p>
          )}
          <button type="button" className="btn btn-outline" onClick={handleGenerateParentLinkCode} disabled={generatingParentLinkCode}>
            {generatingParentLinkCode ? "Generating..." : parentLinkCode ? "Generate a new code" : "Generate parent link code"}
          </button>
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.75rem" }}>Parent and guardian access</div>
          {parentLinks.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>No parent link requests.</p>
          ) : (
            <div style={{ display: "grid", gap: "0.65rem" }}>
              {parentLinks.map((link) => (
                <div key={link._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", borderBottom: "1px solid var(--border)", paddingBottom: "0.65rem" }}>
                  <span>{link.parent?.name || "Parent or guardian"} · {link.status}</span>
                  {link.status === "PENDING" ? (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => handleParentLinkStatus(link, "ACTIVE")}>Approve</button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => handleParentLinkStatus(link, "REVOKED")}>Decline</button>
                    </div>
                  ) : link.status === "ACTIVE" ? (
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => handleParentLinkStatus(link, "REVOKED")}>Revoke access</button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "1rem" }}>Appearance</div>
          <div className="form-group">
            <label htmlFor="appearance-theme">Color theme</label>
            <select id="appearance-theme" style={selectStyle} value={themePreference} onChange={updateThemePreference}>
              <option value="system">Match device</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="appearance-stage">Adaptive maturity appearance</label>
            <select id="appearance-stage" style={selectStyle} value={stageOverride} onChange={updateStageOverride}>
              <option value="auto">Match my education stage</option>
              <option value="junior">Junior (Classes 5-7)</option>
              <option value="teen">Teen (Classes 8-10)</option>
              <option value="senior">Senior (Classes 11-12)</option>
              <option value="pro">Professional (Diploma / UG / PG)</option>
              <option value="research">Research / Working / Independent</option>
            </select>
          </div>
        </div>

        {prefs.aiProfileSummary && (
          <div style={{ ...card, borderLeft: "3px solid var(--primary)" }}>
            <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.4rem" }}>AI summary of you</div>
            <p style={{ color: "var(--text-dim)", fontSize: "var(--font-size-sm)", lineHeight: 1.6 }}>{prefs.aiProfileSummary}</p>
          </div>
        )}

        <div style={card}>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>Describe yourself</div>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", marginBottom: "0.75rem" }}>
            Tell us where you are, what you know and where you want to go. The AI fills in your profile so chat, roadmaps and quizzes fit you. It also keeps learning from your chats.
          </p>
          <textarea
            className="search-input"
            style={{ width: "100%", minHeight: 110, borderRadius: "var(--radius)", padding: "0.75rem 1rem" }}
            maxLength={2000}
            placeholder="e.g. I'm a 3rd-year CSE student, comfortable with Python and basic React. I want to become a backend developer and can study about 8 hours a week."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn btn-primary" style={{ marginTop: "0.75rem" }} onClick={handleExtract} disabled={extracting}>
            {extracting ? "Analysing..." : "Fill my profile with AI"}
          </button>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "1rem" }}>Learning preferences</div>
          <div className="form-group"><label>Target role</label><input value={form.targetRole} onChange={set("targetRole")} placeholder="e.g. Backend Developer" /></div>
          <div className="form-group">
            <label>Experience level</label>
            <select style={selectStyle} value={form.experienceLevel} onChange={set("experienceLevel")}>
              <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="form-group">
            <label>Learning style</label>
            <select style={selectStyle} value={form.learningStyle} onChange={set("learningStyle")}>
              <option value="">No preference</option><option value="visual">Visual (videos)</option><option value="hands-on">Hands-on (practice)</option><option value="reading">Reading (docs, books)</option>
            </select>
          </div>
          <div className="form-group"><label>Hours per week</label><input type="number" min="0" max="168" value={form.weeklyHoursAvailable} onChange={set("weeklyHoursAvailable")} /></div>
          <div className="form-group"><label>Skills (comma separated)</label><input value={form.skills} onChange={set("skills")} placeholder="Python, SQL, React" /></div>
          <div className="form-group"><label>Goals (comma separated)</label><input value={form.goals} onChange={set("goals")} placeholder="Get a placement, build a project" /></div>
          <div className="form-group"><label>Interests (comma separated)</label><input value={form.interests} onChange={set("interests")} placeholder="Web, AI" /></div>
          <div className="form-group"><label>Childhood dream (optional)</label><input value={form.childhoodDream} onChange={set("childhoodDream")} placeholder="A career you once imagined" /></div>
          <div className="form-group"><label>Previous goal or current position (optional)</label><input value={form.formerCareerGoal} onChange={set("formerCareerGoal")} placeholder="Example: Mechanical Engineering" /></div>
          <div className="form-group"><label>Reason for changing direction (optional)</label><input value={form.careerSwitchReason} onChange={set("careerSwitchReason")} placeholder="What changed or what do you want to explore?" /></div>
          <fieldset style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.85rem 1rem", marginBottom: "1rem" }}>
            <legend style={{ padding: "0 0.35rem", fontWeight: 700, color: "var(--text)" }}>Sharing with branch guides</legend>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", margin: "0.5rem 0", color: "var(--text-dim)" }}>
              <input type="checkbox" checked={form.shareContactWithGuides} onChange={(event) => setForm({ ...form, shareContactWithGuides: event.target.checked })} />
              Share my email address with approved guides in my branch
            </label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", margin: "0.5rem 0", color: "var(--text-dim)" }}>
              <input type="checkbox" checked={form.shareProfileWithGuides} onChange={(event) => setForm({ ...form, shareProfileWithGuides: event.target.checked })} />
              Share my profile basics and high-level learning progress with approved guides in my branch. This never shares chat transcripts, prompts, quiz answers, or individual AI sessions.
            </label>
          </fieldset>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save preferences"}</button>
        </div>
      </div>
    </div>
  );
}
