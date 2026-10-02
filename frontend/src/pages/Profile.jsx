import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { extractProfile, updatePreferences } from "../services/studentService.js";

const card = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" };
const selectStyle = { width: "100%", padding: "0.55rem 0.75rem", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--text)" };
const csv = (arr) => (arr || []).join(", ");
const splitCsv = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function Profile() {
  const { user, updateUser } = useAuth();
  const prefs = user?.preferences || {};

  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    targetRole: prefs.targetRole || "",
    experienceLevel: prefs.experienceLevel || "beginner",
    learningStyle: prefs.learningStyle || "",
    weeklyHoursAvailable: prefs.weeklyHoursAvailable || "",
    goals: csv(prefs.goals),
    interests: csv(prefs.interests),
    skills: csv((prefs.skills || []).map((s) => s.name)),
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

  return (
    <div>
      <div className="page-hero">
        <h1>My <span>Profile</span></h1>
        <p>{user?.name} · {user?.email} · {user?.branch}</p>
      </div>

      <div className="section" style={{ maxWidth: 760 }}>
        {prefs.aiProfileSummary && (
          <div style={{ ...card, borderLeft: "3px solid var(--primary)" }}>
            <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.4rem" }}>AI summary of you</div>
            <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", lineHeight: 1.6 }}>{prefs.aiProfileSummary}</p>
          </div>
        )}

        <div style={card}>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>Describe yourself</div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "0.75rem" }}>
            Tell us where you are, what you know and where you want to go. The AI fills in your profile so chat, roadmaps and quizzes fit you. It also keeps learning from your chats.
          </p>
          <textarea
            className="search-input"
            style={{ width: "100%", minHeight: 110, borderRadius: 12, padding: "0.75rem 1rem" }}
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
          <fieldset style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "0.85rem 1rem", marginBottom: "1rem" }}>
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
