/**
 * GoogleOnboarding.jsx
 *
 * Shown to new Google-authenticated students and guides who need to complete onboarding.
 * The backend issues a SHORT-LIVED onboarding-only token and redirects here:
 *   /google-onboarding#token=<onboardingToken>&role=student&name=<displayName>
 *
 * Flow:
 *   1. Read and store the onboarding token from the URL fragment.
 *   2. Read the display name from the fragment (pre-filled from Google).
 *   3. Fetch available branches (public endpoint, no auth needed).
 *   4. Student selects their branch (and optionally confirms their display name).
 *   5. POST the role-specific Google onboarding endpoint.
 *      The onboarding token is sent as the Bearer token — the endpoint accepts
 *      ONLY onboarding tokens, not normal application JWTs.
 *   6. Response contains { accessToken, user } — the NORMAL application tokens.
 *   7. Store normal access token + user, redirect to home.
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";
import api from "../services/api.js";
import { fetchBranches } from "../services/branchService.js";
import preyeahhLogo from "../assets/preyeahh-logo.png";

const GOOGLE_SIGNUP_DRAFT_KEY = "pp_google_signup_draft";

export default function GoogleOnboarding() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const tokenStored = useRef(false);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [name, setName] = useState("");
  const [signupRole, setSignupRole] = useState("student");
  const [signupDraft, setSignupDraft] = useState(null);
  const [guideRoleNames, setGuideRoleNames] = useState("Faculty Guide");
  const [guideBio, setGuideBio] = useState("");
  const [onboardingToken, setOnboardingToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  // Step 1 — store onboarding token and read name on mount (runs once)
  useEffect(() => {
    if (tokenStored.current) return;
    tokenStored.current = true;

    const fragment = window.location.hash.slice(1);
    const params = new URLSearchParams(fragment);
    const token = params.get("token");
    const displayName = params.get("name") || "";
    const role = params.get("role") || "student";

    if (!token) {
      navigate("/login?google_error=no_token", { replace: true });
      return;
    }
    if (!["student", "guide"].includes(role)) {
      navigate("/login?google_error=role_not_supported", { replace: true });
      return;
    }

    let draft = null;
    try {
      const savedDraft = sessionStorage.getItem(GOOGLE_SIGNUP_DRAFT_KEY);
      draft = savedDraft ? JSON.parse(savedDraft) : null;
    } catch (draftError) {
      console.error("Could not read the saved Google signup details.", draftError);
      setError("Some saved signup details could not be loaded. Please review and re-enter them.");
      sessionStorage.removeItem(GOOGLE_SIGNUP_DRAFT_KEY);
    }
    if (draft?.role !== role) draft = null;

    setOnboardingToken(token);
    setSignupRole(role);
    setSignupDraft(draft);

    // Clear fragment from URL
    window.history.replaceState(null, "", window.location.pathname);

    // Pre-fill name and registration details from Google and the local signup draft.
    setName(draft?.name || displayName);
    if (Array.isArray(draft?.roleNames) && draft.roleNames.length) {
      setGuideRoleNames(draft.roleNames.join(", "));
    }
    if (typeof draft?.bio === "string") setGuideBio(draft.bio);
    if (typeof draft?.branch === "string") setSelectedBranch(draft.branch.toUpperCase());

    // Load branches (public endpoint — no auth required)
    fetchBranches()
      .then((list) => {
        setBranches(list);
        if (role === "student" && list.length > 0) {
          setSelectedBranch((current) => list.includes(current) ? current : list[0]);
        }
        setReady(true);
      })
      .catch(() => {
        setError("Could not load branches. Please refresh.");
        setReady(true);
      });
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!selectedBranch) {
      setError("Please select your branch.");
      return;
    }
    if (!onboardingToken) {
      setError("Your setup link has expired. Please sign in with Google again.");
      return;
    }
    const roleNames = guideRoleNames.split(",").map((roleName) => roleName.trim()).filter(Boolean);
    if (signupRole === "guide" && !roleNames.length) {
      setError("Please enter at least one guide role.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = signupRole === "guide"
        ? "/guides/google-onboarding"
        : "/students/google-onboarding";
      const payload = signupRole === "guide"
        ? { branch: selectedBranch, name: name.trim() || undefined, roleNames, bio: guideBio }
        : { branch: selectedBranch, name: name.trim() || undefined, profile: signupDraft?.profile };
      const { data } = await api.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${onboardingToken}` },
      });

      try {
        sessionStorage.removeItem(GOOGLE_SIGNUP_DRAFT_KEY);
      } catch (storageError) {
        console.error("Could not clear the saved Google signup details.", storageError);
        toast.error("Your saved signup details could not be removed from this device.");
      }
      if (signupRole === "guide") {
        navigate("/login?role=guide&google_error=guide_pending_approval", { replace: true });
        return;
      }

      // The response contains the NORMAL application access token + user profile
      const { accessToken, user } = data.data;

      // Establish authenticated session in AuthContext & localStorage
      setSession({ user, accessToken, role: "student" });
      try {
        localStorage.removeItem("preyeahh.student-onboarding.guest");
      } catch (storageError) {
        console.error("Could not clear the saved student onboarding draft.", storageError);
        toast.error("Your saved onboarding draft could not be removed from this device.");
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--text-dim, var(--text-muted))" }}>Setting up your account…</p>
      </div>
    );
  }

  return (
    <div className="login-wrap" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
      <div className="login-card" style={{ maxWidth: 420 }}>
        <img src={preyeahhLogo} alt="PREYEAHH Logo" className="modal-logo" style={{ height: "40px", marginBottom: "0.5rem" }} />
        <h2 style={{ marginBottom: "0.5rem" }}>One last step</h2>
        <p style={{ color: "var(--text-dim, var(--text-muted))", fontSize: "var(--font-size-sm)", marginBottom: "1.5rem" }}>
          {signupRole === "guide"
            ? "Your Google account is verified. Complete your guide application; an admin will review it before you can sign in."
            : "Your Google account is verified. Just tell us your engineering branch so we can personalise your experience."}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Name — pre-filled from Google but editable */}
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={100}
            />
          </div>

          {/* Branch selection */}
          <div className="form-group">
            <label>{signupRole === "guide" ? "Your Department / Branch" : "Your Engineering Branch"}</label>
            {signupRole === "guide" ? (
              <input
                type="text"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value.toUpperCase())}
                placeholder="e.g. CSE"
                required
                maxLength={20}
              />
            ) : branches.length > 0 ? (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                required
              >
                {branches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value.toUpperCase())}
                placeholder="e.g. CSE"
                required
                maxLength={20}
              />
            )}
          </div>

          {signupRole === "guide" && (
            <>
              <div className="form-group">
                <label>Guide Role(s), comma-separated</label>
                <input
                  type="text"
                  value={guideRoleNames}
                  onChange={(e) => setGuideRoleNames(e.target.value)}
                  placeholder="Faculty Guide"
                  maxLength={1000}
                />
              </div>
              <div className="form-group">
                <label>Short Bio (optional)</label>
                <textarea
                  value={guideBio}
                  onChange={(e) => setGuideBio(e.target.value)}
                  maxLength={1000}
                  rows={3}
                />
              </div>
            </>
          )}

          {error && (
            <p style={{ color: "var(--danger)", fontSize: "var(--font-size-sm)", marginBottom: "0.75rem" }}>{error}</p>
          )}

          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Saving…" : signupRole === "guide" ? "Submit Guide Application" : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
