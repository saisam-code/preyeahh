import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { loginAdmin } from "../../services/adminService";
import { setAccessToken, setActiveRole } from "../../services/api";

export default function AdminLogin({ onSuccess }) {
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, formState, setError } = useForm({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async ({ email, password }) => {
    try {
      const res = await loginAdmin(email.trim(), password);
      setAccessToken(res.data.accessToken);
      setActiveRole("admin");
      localStorage.setItem("pp_admin_user", JSON.stringify(res.data.user));
      onSuccess(res.data.user);
    } catch (err) {
      setError("root", { message: err.response?.data?.message || "Invalid credentials" });
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h2>Admin Login</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="admin@example.com" {...register("email", { required: true })} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="pass-wrap">
              <input type={showPass ? "text" : "password"} placeholder="••••••••" {...register("password", { required: true })} />
              <button type="button" className="pass-eye" tabIndex={-1} onClick={() => setShowPass((s) => !s)}>
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          {formState.errors.root && (
            <p style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{formState.errors.root.message}</p>
          )}
          <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
        <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "1rem", textAlign: "center" }}>
          <Link to="/reset-password?role=admin" style={{ color: "var(--primary)" }}>Forgot password?</Link>
        </p>
        <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.5rem", textAlign: "center" }}>
          Contact your administrator for access.
        </p>
      </div>
    </div>
  );
}