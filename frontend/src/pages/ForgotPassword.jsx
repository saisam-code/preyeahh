import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ForgotPassword() {
  const [params] = useSearchParams();
  const roleParam = params.get("role");
  const role = roleParam === "guide" || roleParam === "admin" ? roleParam : "student";
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (!email.trim()) return setErr("Enter your email");
    try {
      await forgotPassword(email.trim(), role);
      setSent(true);
    } catch (e) {
      setErr(e.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h2>Forgot Password</h2>
        {sent ? (
          <p style={{ color: "var(--text-dim)" }}>
            If that email is registered, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={role === "student" ? "you@gmail.com" : "you@nbkrist.org"} />
            </div>
            {err && <p style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{err}</p>}
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit}>Send Reset Link</button>
          </>
        )}
      </div>
    </div>
  );
}
