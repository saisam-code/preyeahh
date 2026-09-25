import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const role = params.get("role") === "guide" ? "guide" : params.get("role") === "admin" ? "admin" : "student";
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (password.length < 6) return setErr("Password must be at least 6 characters");
    if (password !== confirm) return setErr("Passwords don't match");
    if (!token) return setErr("Missing reset token — use the link from your email");

    try {
      await resetPassword(token, password, role);
      setDone(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (e) {
      setErr(e.response?.data?.message || "Reset link is invalid or has expired");
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h2>Reset Password</h2>
        {done ? (
          <p style={{ color: "#16a34a" }}>Password reset successful. Redirecting to login...</p>
        ) : (
          <>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {err && <p style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{err}</p>}
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit}>Reset Password</button>
          </>
        )}
      </div>
    </div>
  );
}