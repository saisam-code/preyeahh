import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../services/api.js";
import { FaPaperPlane, FaCheck, FaArrowLeft } from "react-icons/fa6";
import preyeahhLogo from "../assets/preyeahh-logo.png";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "student";
  const [role, setRole] = useState(["student", "guide", "admin", "parent", "institution"].includes(initialRole) ? initialRole : "student");
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }) => {
    try {
      const endpoint =
        role === "admin" ? "/admin/forgot-password" :
        role === "guide" ? "/guides/forgot-password" :
        role === "parent" ? "/auth/extended/parent/forgot-password" :
        role === "institution" ? "/auth/extended/institution/forgot-password" :
        "/students/forgot-password";

      await api.post(endpoint, { email: email.trim().toLowerCase() });
      setSubmitted(true);
      toast.success("Password reset instructions dispatched!");
    } catch (err) {
      setError("root", { message: err.response?.data?.message || "Could not process request. Please try again." });
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 70px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg)" }}>
      <div style={{ maxWidth: 460, width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1.25rem", padding: "2.5rem 2rem", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <img src={preyeahhLogo} alt="PREYEAHH Logo" style={{ width: 44, height: 44, objectFit: "contain", margin: "0 auto 0.75rem" }} />
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.25rem" }}>Reset Your Password</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
            Enter your email and we'll send a secure password reset link.
          </p>
        </div>

        {/* Role toggle */}
        <div style={{ display: "flex", gap: "0.3rem", marginBottom: "1.25rem", background: "var(--surface-mid)", padding: "0.25rem", borderRadius: "0.6rem" }}>
          {["student", "guide", "parent", "institution"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setSubmitted(false); }}
              style={{
                flex: 1,
                padding: "0.4rem 0.2rem",
                borderRadius: "0.4rem",
                fontSize: "0.78rem",
                fontWeight: role === r ? 700 : 500,
                border: "none",
                background: role === r ? "var(--surface)" : "transparent",
                color: role === r ? "var(--primary)" : "var(--text-muted)",
                cursor: "pointer",
                boxShadow: role === r ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
              }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {submitted ? (
          <div style={{ background: "rgba(21,128,61,0.08)", border: "1px solid var(--primary)", borderRadius: "0.75rem", padding: "1.5rem", textAlign: "center" }}>
            <FaCheck style={{ fontSize: "2rem", color: "var(--primary)", marginBottom: "0.75rem" }} />
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem" }}>Check Your Inbox</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.5, margin: "0 0 1.25rem" }}>
              If an account with that email exists, we have dispatched a password reset link. Please check your spam folder if it doesn't appear within 2 minutes.
            </p>
            <Link to={`/login?role=${role}`} className="btn btn-outline btn-sm">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Registered Email</label>
              <input
                type="email"
                placeholder="your.email@example.com"
                {...register("email", { required: "Email is required" })}
                style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
              />
              {errors.email && <small style={{ color: "var(--error)", fontSize: "0.78rem" }}>{errors.email.message}</small>}
            </div>

            {errors.root && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid var(--error)", borderRadius: "0.5rem", padding: "0.6rem", color: "var(--error)", fontSize: "0.82rem" }}>
                {errors.root.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: "0.75rem", fontWeight: 700, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.4rem" }}
            >
              {isSubmitting ? "Dispatching..." : "Send Reset Link"} <FaPaperPlane />
            </button>

            <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
              <Link to={`/login?role=${role}`} style={{ fontSize: "0.85rem", color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <FaArrowLeft /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
