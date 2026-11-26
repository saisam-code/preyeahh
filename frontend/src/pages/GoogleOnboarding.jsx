/**
 * GoogleOnboarding.jsx
 *
 * Shown to new Google-authenticated students who haven't supplied a branch yet.
 * The backend issues a SHORT-LIVED onboarding-only token and redirects here:
 *   /google-onboarding#token=<onboardingToken>&role=student&name=<displayName>
 *
 * Flow:
 *   1. Read and store the onboarding token from the URL fragment.
 *   2. Read the display name from the fragment (pre-filled from Google).
 *   3. Fetch available branches (public endpoint, no auth needed).
 *   4. Student selects their branch (and optionally confirms their display name).
 *   5. POST /api/students/google-onboarding with { branch, name }.
 *      The onboarding token is sent as the Bearer token — the endpoint accepts
 *      ONLY onboarding tokens, not normal application JWTs.
 *   6. Response contains { accessToken, user } — the NORMAL application tokens.
 *   7. Store normal access token + user, redirect to home.
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { fetchBranches } from "../services/branchService.js";
import preyeahhLogo from "../assets/preyeahh-logo.png";

export default function GoogleOnboarding() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const tokenStored = useRef(false);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [name, setName] = useState("");
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

    if (!token) {
      navigate("/login?google_error=no_token", { replace: true });
      return;
    }

    setOnboardingToken(token);

    // Clear fragment from URL
    window.history.replaceState(null, "", window.location.pathname);

    // Pre-fill name from the fragment (sent by the backend)
    if (displayName) {
      setName(decodeURIComponent(displayName));
    }

    // Load branches (public endpoint — no auth required)
    fetchBranches()
      .then((list) => {
        setBranches(list);
        if (list.length > 0) setSelectedBranch(list[0]);
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

    setLoading(true);
    try {
      const { data } = await api.post("/students/google-onboarding", {
        branch: selectedBranch,
        name: name.trim() || undefined,
      }, {
        headers: { Authorization: `Bearer ${onboardingToken}` },
      });

      // The response contains the NORMAL application access token + user profile
      const { accessToken, user } = data.data;

      // Establish authenticated session in AuthContext & localStorage
      setSession({ user, accessToken, role: "student" });

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
          Your Google account is verified. Just tell us your engineering branch so we can personalise
          your experience.
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
            <label>Your Engineering Branch</label>
            {branches.length > 0 ? (
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

          {error && (
            <p style={{ color: "var(--danger)", fontSize: "var(--font-size-sm)", marginBottom: "0.75rem" }}>{error}</p>
          )}

          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Saving…" : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
