import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import preyeahhLogo from "../assets/preyeahh-logo.png";
import "./Login.css";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const GOOGLE_ERRORS = {
  access_denied: "Google sign-in was cancelled.",
  domain_not_allowed: "This Google account can't be used for the selected role.",
  email_not_verified: "Your Google email is not verified.",
  not_found: "No account found for that Google email. Register first.",
  state_mismatch: "Sign-in session expired. Please try again.",
  server_error: "Google sign-in failed. Please try again.",
};

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const [role, setRole] = useState(() => {
    const r = params.get("role");
    return ["student", "parent", "guide", "institution"].includes(r) ? r : "student";
  });
  const [showPass, setShowPass] = useState(false);
  const form = useForm({ defaultValues: { email: "", password: "" } });

  const next = location.state?.from?.pathname || params.get("next") || "";
  const googleError = params.get("google_error");

  // Redirect authenticated users to their workspace
  useEffect(() => {
    if (isAuthenticated && user) {
      const dest =
        user.role === "institution" ? "/institution-portal" :
        user.role === "guide" ? "/guide-panel" :
        user.role === "parent" ? "/parent-portal" :
        "/dashboard";
      navigate(next || dest, { replace: true });
    }
  }, [isAuthenticated, user, navigate, next]);

  useEffect(() => {
    form.reset({ email: "", password: "" });
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (googleError) form.setError("root", { message: GOOGLE_ERRORS[googleError] || "Google sign-in failed." });
  }, [googleError]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async ({ email, password }) => {
    try {
      const loggedIn = await login(role, { email: email.trim().toLowerCase(), password });
      if (next && next !== "/") {
        navigate(next, { replace: true });
      } else {
        const dest =
          loggedIn.role === "institution" ? "/institution-portal" :
          loggedIn.role === "guide" ? "/guide-panel" :
          loggedIn.role === "parent" ? "/parent-portal" :
          "/dashboard";
        navigate(dest, { replace: true });
      }
    } catch (err) {
      form.setError("root", { message: err.response?.data?.message || "Invalid email or password." });
    }
  };

  const { errors, isSubmitting } = form.formState;

  return (
    <main className="lp-wrap">
      <section className="lp-card">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <img src={preyeahhLogo} alt="PREYEAHH Logo" className="lp-logo" style={{ margin: 0 }} />
          <div>
            <h1 style={{ margin: 0, fontSize: "var(--font-size-xl)", fontWeight: 800 }}>Sign In</h1>
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>Enter your workspace</span>
          </div>
        </div>

        <p className="lp-sub" style={{ marginBottom: "1rem" }}>
          Welcome back. Select your role and sign in below.
        </p>

        {/* Role Toggle Tabs */}
        <div className="ulm-reg-toggle lp-toggle" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.25rem", marginBottom: "1rem" }}>
          {[
            { id: "student", label: "Student" },
            { id: "guide", label: "Guide" },
            { id: "parent", label: "Parent" },
            { id: "institution", label: "Institution" },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`ulm-rt-btn ${role === id ? "active" : ""}`}
              style={{ fontSize: "var(--font-size-xs)", padding: "0.45rem 0.2rem" }}
              onClick={() => setRole(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="lp-email">Email</label>
            <input
              id="lp-email"
              type="email"
              autoComplete="email"
              placeholder={
                role === "parent" ? "parent@example.com" :
                role === "institution" ? "placement@college.edu" :
                "you@example.com"
              }
              {...form.register("email", { required: "Email is required" })}
            />
            {errors.email && <small className="lp-err">{errors.email.message}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="lp-pass">Password</label>
            <div className="pass-wrap">
              <input
                id="lp-pass"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                {...form.register("password", { required: "Password is required" })}
              />
              <button
                type="button"
                className="pass-eye"
                tabIndex={-1}
                onClick={() => setShowPass((s) => !s)}
                aria-label="Toggle password"
              >
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && <small className="lp-err">{errors.password.message}</small>}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <Link
              to={`/forgot-password?role=${role}`}
              style={{ fontSize: "var(--font-size-sm)", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}
            >
              Forgot password?
            </Link>
          </div>

          {errors.root && <p className="ulm-err" style={{ display: "block" }}>{errors.root.message}</p>}

          <button className="btn btn-primary lp-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In to Workspace"}
          </button>
        </form>

        {/* Google OAuth is supported for student and guide */}
        {(role === "student" || role === "guide") && (
          <>
            <div className="lp-or"><span>OR</span></div>

            <a href={`${API_BASE}/auth/google?role=${role}`} className="btn btn-outline lp-full lp-google">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="var(--google-red)" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="var(--google-blue)" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="var(--google-yellow)" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="var(--google-green)" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Continue with Google
            </a>
          </>
        )}

        <div style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "var(--font-size-sm)", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div>
            New to Preyeahh? <Link to={`/register?role=${role}`} style={{ color: "var(--primary)", fontWeight: 600 }}>Create an account</Link>
          </div>
          <div>
            <Link to={`/resend-verification?role=${role}`} style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", textDecoration: "none" }}>
              Need to verify your email? Resend verification
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
