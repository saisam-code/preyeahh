import { useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../services/api.js";
import { FaEye, FaEyeSlash, FaCheck, FaLock } from "react-icons/fa6";
import preyeahhLogo from "../assets/preyeahh-logo.png";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "student";
  const navigate = useNavigate();

  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async ({ password, confirmPassword }) => {
    if (password !== confirmPassword) {
      setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }

    try {
      const endpoint =
        role === "admin" ? "/admin/reset-password" :
        role === "guide" ? "/guides/reset-password" :
        "/students/reset-password";

      await api.post(endpoint, { token, password });
      setSuccess(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate(`/login?role=${role}`), 2500);
    } catch (err) {
      setError("root", { message: err.response?.data?.message || "Failed to reset password. Link may be expired." });
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 70px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg)" }}>
      <div style={{ maxWidth: 440, width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1.25rem", padding: "2.5rem 2rem", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <img src={preyeahhLogo} alt="PREYEAHH Logo" style={{ width: 44, height: 44, objectFit: "contain", margin: "0 auto 0.75rem" }} />
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.25rem" }}>Set New Password</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
            Choose a strong password to secure your account.
          </p>
        </div>

        {success ? (
          <div style={{ background: "rgba(21,128,61,0.08)", border: "1px solid var(--primary)", borderRadius: "0.75rem", padding: "1.5rem", textAlign: "center" }}>
            <FaCheck style={{ fontSize: "2.2rem", color: "var(--primary)", marginBottom: "0.75rem" }} />
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem" }}>Password Reset Complete!</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5, margin: "0 0 1.25rem" }}>
              Your password has been successfully updated. Redirecting to login...
            </p>
            <Link to={`/login?role=${role}`} className="btn btn-primary btn-sm">
              Sign In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  {...register("password", { required: "Password required", minLength: { value: 6, message: "Min 6 characters" } })}
                  style={{ width: "100%", padding: "0.65rem 2.2rem 0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <small style={{ color: "var(--error)", fontSize: "0.75rem" }}>{errors.password.message}</small>}
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Confirm Password</label>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Re-enter password"
                {...register("confirmPassword", { required: "Confirm password required" })}
                style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
              />
              {errors.confirmPassword && <small style={{ color: "var(--error)", fontSize: "0.75rem" }}>{errors.confirmPassword.message}</small>}
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
              {isSubmitting ? "Updating..." : "Update Password"} <FaLock />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
