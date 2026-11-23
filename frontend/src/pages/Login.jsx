import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FaEye, FaEyeSlash, FaArrowRight, FaXmark, FaCheck } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import { CAREER_DOMAINS } from "../data/careerWheelData.js";
import CareerWheel from "../components/wheel/CareerWheel.jsx";
import CareerCategoryDetails from "../components/wheel/CareerCategoryDetails.jsx";
import { updatePreferences } from "../services/studentService.js";
import preyeahhLogo from "../assets/preyeahh-logo.png";
import toast from "react-hot-toast";
import "./Login.css";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const GOOGLE_ERRORS = {
  access_denied: "Google sign-in was cancelled.",
  domain_not_allowed: "Only @gmail.com and @nbkrist.org emails are supported.",
  email_not_verified: "Your Google email is not verified.",
  not_found: "No account found for that Google email. Register first.",
  state_mismatch: "Sign-in session expired. Please try again.",
  server_error: "Google sign-in failed. Please try again.",
};

export default function Login() {
  const { login, isAuthenticated, initialized, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  // Authentication State
  const [role, setRole] = useState("student");
  const [showPass, setShowPass] = useState(false);
  const form = useForm({ defaultValues: { email: "", password: "" } });

  // Career Wheel Interactive State
  const [selectedDomain, setSelectedDomain] = useState(CAREER_DOMAINS[0]);
  const [selectedDomainInterests, setSelectedDomainInterests] = useState([]);
  const [selectedCareerRoles, setSelectedCareerRoles] = useState([]);
  const [savingInterests, setSavingInterests] = useState(false);

  const next = location.state?.from?.pathname || params.get("next") || "/";
  const googleError = params.get("google_error");

  useEffect(() => {
    form.reset({ email: "", password: "" });
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (googleError) form.setError("root", { message: GOOGLE_ERRORS[googleError] || "Google sign-in failed." });
  }, [googleError]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load existing student preferences if logged in
  useEffect(() => {
    if (user?.preferences?.interests?.length) {
      setSelectedDomainInterests(user.preferences.interests);
    }
  }, [user]);

  // Toggle individual career within domain
  const handleToggleCareer = (careerName) => {
    if (selectedCareerRoles.includes(careerName)) {
      setSelectedCareerRoles(selectedCareerRoles.filter((c) => c !== careerName));
    } else {
      setSelectedCareerRoles([...selectedCareerRoles, careerName]);
    }
  };

  // Toggle domain category interest
  const handleToggleDomainInterest = (domainTitle) => {
    if (selectedDomainInterests.includes(domainTitle)) {
      setSelectedDomainInterests(selectedDomainInterests.filter((d) => d !== domainTitle));
    } else {
      setSelectedDomainInterests([...selectedDomainInterests, domainTitle]);
    }
  };

  // Persist chosen interests to student profile if logged in, or continue to onboarding
  const handleSaveAndContinue = async () => {
    if (!isAuthenticated) {
      // Direct exploration without login yet -> route to onboarding with state
      navigate("/onboarding", { state: { preselectedInterests: selectedDomainInterests, preselectedRoles: selectedCareerRoles } });
      return;
    }

    setSavingInterests(true);
    try {
      await updatePreferences({
        interests: selectedDomainInterests,
        primaryCareerGoal: selectedCareerRoles[0] || selectedDomain.careers[0]?.name || "Software Engineer",
        targetRole: selectedCareerRoles[0] || selectedDomain.careers[0]?.name || "Software Engineer",
      });
      toast.success("Career interests saved to your profile!");
      navigate("/planner");
    } catch {
      toast.error("Could not save to profile. Navigating to planner.");
      navigate("/planner");
    } finally {
      setSavingInterests(false);
    }
  };

  const onSubmit = async ({ email, password }) => {
    try {
      await login(role, { email: email.trim().toLowerCase(), password });
      navigate(next, { replace: true });
    } catch (err) {
      form.setError("root", { message: err.response?.data?.message || "Invalid email or password." });
    }
  };

  const { errors, isSubmitting } = form.formState;

  return (
    <main style={{ minHeight: "calc(100vh - 70px)", background: "var(--bg)", padding: "2rem 1.5rem" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        {/* Title Bar */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: 1.2, color: "var(--primary)", fontWeight: 700 }}>
            DISCOVER · CHOOSE · PLAN
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, margin: "0.25rem 0", color: "var(--text)" }}>
            Explore the Career Orbit
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: 650, margin: "0 auto" }}>
            Spin through 12 major career domains, discover specialized roles, and sign in to synchronize your personalized career roadmap.
          </p>
        </div>

        {/* Selected Interests Chip Bar */}
        {(selectedDomainInterests.length > 0 || selectedCareerRoles.length > 0) && (
          <div
            style={{
              background: "var(--surface)",
              border: "1.5px solid var(--primary)",
              borderRadius: "1rem",
              padding: "0.85rem 1.25rem",
              marginBottom: "2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)" }}>Selected Interests:</span>
              {selectedDomainInterests.map((d) => (
                <span
                  key={d}
                  style={{
                    background: "rgba(21,128,61,0.1)",
                    color: "var(--primary)",
                    borderRadius: "2rem",
                    padding: "0.2rem 0.65rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  {d}
                  <FaXmark style={{ cursor: "pointer" }} onClick={() => handleToggleDomainInterest(d)} />
                </span>
              ))}
              {selectedCareerRoles.map((c) => (
                <span
                  key={c}
                  style={{
                    background: "var(--surface-mid)",
                    color: "var(--text)",
                    borderRadius: "2rem",
                    padding: "0.2rem 0.65rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    border: "1px solid var(--border)",
                  }}
                >
                  {c}
                  <FaXmark style={{ cursor: "pointer" }} onClick={() => handleToggleCareer(c)} />
                </span>
              ))}
            </div>

            <button
              onClick={handleSaveAndContinue}
              disabled={savingInterests}
              className="btn btn-primary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
            >
              {savingInterests ? "Saving..." : "Save & Continue"} <FaArrowRight />
            </button>
          </div>
        )}

        {/* ── MAIN WORKSPACE GRID: WHEEL + DETAILS + AUTH ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "2rem", alignItems: "start" }}>
          {/* 1. RADIAL CAREER WHEEL */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1.5rem",
              padding: "2rem 1.5rem",
              boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: 1, color: "var(--primary)", fontWeight: 700 }}>
                Interactive Radial Wheel
              </div>
              <h3 style={{ margin: "0.15rem 0", fontSize: "1.2rem", fontWeight: 700 }}>Click Any Domain Segment</h3>
            </div>

            <CareerWheel
              domains={CAREER_DOMAINS}
              selectedDomain={selectedDomain}
              onSelectDomain={setSelectedDomain}
              multiSelectedIds={selectedDomainInterests}
            />

            <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Active Selection: <strong style={{ color: selectedDomain?.color }}>{selectedDomain?.title}</strong>
            </div>
          </div>

          {/* 2. SELECTED CATEGORY DETAILS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <CareerCategoryDetails
              domain={selectedDomain}
              selectedCareerNames={selectedCareerRoles}
              onToggleCareer={handleToggleCareer}
              onAddDomainInterest={handleToggleDomainInterest}
              isDomainSelected={selectedDomainInterests.includes(selectedDomain?.title)}
            />
          </div>

          {/* 3. INTEGRATED AUTHENTICATION PANEL */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1.5rem",
              padding: "2rem",
              boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
              <img src={preyeahhLogo} alt="PREYEAHH" style={{ width: 36, height: 36, objectFit: "contain" }} />
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Sign in to Preyeahh</h3>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Synchronize your career workspace</span>
              </div>
            </div>

            <div className="ulm-reg-toggle lp-toggle" style={{ marginBottom: "1.25rem" }}>
              {["student", "guide"].map((r) => (
                <button key={r} type="button" className={`ulm-rt-btn ${role === r ? "active" : ""}`} onClick={() => setRole(r)}>
                  {r === "student" ? "Student" : "Guide"}
                </button>
              ))}
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <div className="form-group">
                <label htmlFor="lp-email">Email</label>
                <input
                  id="lp-email" type="email" autoComplete="email"
                  placeholder={role === "guide" ? "you@nbkrist.org" : "you@gmail.com"}
                  {...form.register("email", { required: "Email is required" })}
                />
                {errors.email && <small className="lp-err">{errors.email.message}</small>}
              </div>

              <div className="form-group">
                <label htmlFor="lp-pass">Password</label>
                <div className="pass-wrap">
                  <input
                    id="lp-pass" type={showPass ? "text" : "password"} autoComplete="current-password"
                    placeholder="Your password"
                    {...form.register("password", { required: "Password is required" })}
                  />
                  <button type="button" className="pass-eye" tabIndex={-1} onClick={() => setShowPass((s) => !s)} aria-label="Toggle password">
                    {showPass ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <small className="lp-err">{errors.password.message}</small>}
              </div>

              {errors.root && <p className="ulm-err" style={{ display: "block" }}>{errors.root.message}</p>}

              <button className="btn btn-primary lp-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In to Workspace"}
              </button>
            </form>

            <div className="lp-or"><span>OR</span></div>

            <a href={`${API_BASE}/auth/google?role=${role}`} className="btn btn-outline lp-full lp-google">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </a>

            <div style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              New to Preyeahh? <Link to="/get-started" style={{ color: "var(--primary)", fontWeight: 600 }}>Create an account</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
