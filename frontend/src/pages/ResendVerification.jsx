import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../services/api.js";
import { FaPaperPlane, FaCheck, FaArrowLeft } from "react-icons/fa6";
import preyeahhLogo from "../assets/preyeahh-logo.png";
import toast from "react-hot-toast";

export default function ResendVerification() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "student";
  const [role, setRole] = useState(["student", "guide"].includes(initialRole) ? initialRole : "student");
  const [dispatched, setDispatched] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }) => {
    try {
      const endpoint = role === "guide" ? "/guides/resend-verification" : "/students/resend-verification";
      await api.post(endpoint, { email: email.trim().toLowerCase() });
      setDispatched(true);
      toast.success("Verification link dispatched!");
    } catch (err) {
      setError("root", { message: err.response?.data?.message || "Failed to resend verification. Please try again." });
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 70px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg)" }}>
      <div style={{ maxWidth: 460, width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "2.5rem 2rem", boxShadow: "0 10px 30px color-mix(in srgb, var(--ink-900) 3%, transparent)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <img src={preyeahhLogo} alt="PREYEAHH Logo" style={{ width: 44, height: 44, objectFit: "contain", margin: "0 auto 0.75rem" }} />
          <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 800, margin: "0 0 0.25rem" }}>Resend Verification Link</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", margin: 0 }}>
            Enter your email to receive a new 24-hour verification link.
          </p>
        </div>

        {/* Role toggle */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <button
            type="button"
            onClick={() => { setRole("student"); setDispatched(false); }}
            style={{
              flex: 1,
              padding: "0.45rem",
              borderRadius: "var(--radius)",
              fontSize: "var(--font-size-sm)",
              fontWeight: role === "student" ? 700 : 500,
              border: "1px solid",
              borderColor: role === "student" ? "var(--primary)" : "var(--border)",
              background: role === "student" ? "var(--primary-bg)" : "transparent",
              color: role === "student" ? "var(--primary)" : "var(--text)",
              cursor: "pointer",
            }}
          >
            Student Account
          </button>
          <button
            type="button"
            onClick={() => { setRole("guide"); setDispatched(false); }}
            style={{
              flex: 1,
              padding: "0.45rem",
              borderRadius: "var(--radius)",
              fontSize: "var(--font-size-sm)",
              fontWeight: role === "guide" ? 700 : 500,
              border: "1px solid",
              borderColor: role === "guide" ? "var(--primary)" : "var(--border)",
              background: role === "guide" ? "var(--primary-bg)" : "transparent",
              color: role === "guide" ? "var(--primary)" : "var(--text)",
              cursor: "pointer",
            }}
          >
            Guide Account
          </button>
        </div>

        {dispatched ? (
          <div style={{ background: "var(--primary-bg)", border: "1px solid var(--primary)", borderRadius: "var(--radius)", padding: "1.5rem", textAlign: "center" }}>
            <FaCheck style={{ fontSize: "var(--font-size-2xl)", color: "var(--primary)", marginBottom: "0.75rem" }} />
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "var(--font-size-lg)" }}>Verification Email Sent</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", lineHeight: 1.5, margin: "0 0 1.25rem" }}>
              Please check your inbox and click the verification link within 24 hours.
            </p>
            <Link to={`/login?role=${role}`} className="btn btn-outline btn-sm">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                Registered Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register("email", { required: "Email is required" })}
                style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
              />
              {errors.email && <small style={{ color: "var(--error)", fontSize: "var(--font-size-xs)" }}>{errors.email.message}</small>}
            </div>

            {errors.root && (
              <div style={{ background: "color-mix(in srgb, var(--danger) 10%, transparent)", border: "1px solid var(--error)", borderRadius: "var(--radius)", padding: "0.6rem", color: "var(--error)", fontSize: "var(--font-size-sm)" }}>
                {errors.root.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: "0.75rem", fontWeight: 700, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.4rem" }}
            >
              {isSubmitting ? "Sending..." : "Resend Verification Email"} <FaPaperPlane />
            </button>

            <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
              <Link to={`/login?role=${role}`} style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <FaArrowLeft /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
