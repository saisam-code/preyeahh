import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";
import preyeahhLogo from "../assets/preyeahh-logo.png";
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
  const { login, isAuthenticated, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [role, setRole] = useState("student");
  const [showPass, setShowPass] = useState(false);
  const form = useForm({ defaultValues: { email: "", password: "" } });

  const next = location.state?.from?.pathname || params.get("next") || "/";
  const googleError = params.get("google_error");

  useEffect(() => {
    form.reset({ email: "", password: "" });
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (googleError) form.setError("root", { message: GOOGLE_ERRORS[googleError] || "Google sign-in failed." });
  }, [googleError]); // eslint-disable-line react-hooks/exhaustive-deps

  if (initialized && isAuthenticated) return <Navigate to={next} replace />;

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
    <main className="lp-wrap">
      <section className="lp-card">
        <img src={preyeahhLogo} alt="PREYEAHH" className="lp-logo" />
        <h1>Sign in</h1>
        <p className="lp-sub">Welcome back. Enter your details below.</p>

        <div className="ulm-reg-toggle lp-toggle">
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
            {isSubmitting ? "Signing in..." : "Sign In"}
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
        <small className="lp-note">Only @gmail.com and @nbkrist.org emails are supported.</small>

        <p className="lp-foot">
          New here? <Link to="/?register=1">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
