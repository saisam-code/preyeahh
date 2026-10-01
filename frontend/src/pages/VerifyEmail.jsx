import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function VerifyEmail() {
  const { token } = useParams();
  const [params] = useSearchParams();
  const role = params.get("role") === "guide" ? "guide" : "student";
  const { verifyEmail } = useAuth();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const started = useRef(false); // StrictMode runs effects twice; the token is single-use

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    verifyEmail(token, role)
      .then((res) => {
        setMessage(res.message || "Email verified.");
        setStatus("success");
      })
      .catch((err) => {
        setMessage(err.response?.data?.message || "Verification link is invalid or has expired.");
        setStatus("error");
      });
  }, [token, role, verifyEmail]);

  return (
    <div className="login-wrap">
      <div className="login-card" style={{ textAlign: "center" }}>
        <h2>Email Verification</h2>
        {status === "loading" && <p style={{ color: "var(--text-dim)" }}>Verifying your email...</p>}
        {status === "success" && (
          <>
            <p style={{ color: "#16a34a", marginBottom: "0.75rem" }}>{message}</p>
            {role === "guide" && (
              <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                An admin still needs to approve your guide registration before you can log in.
              </p>
            )}
            <Link className="btn btn-primary" to="/?login=1">Go to Login</Link>
          </>
        )}
        {status === "error" && (
          <>
            <p style={{ color: "#ef4444", marginBottom: "0.75rem" }}>{message}</p>
            <Link className="btn btn-outline" to="/">Back to Home</Link>
          </>
        )}
      </div>
    </div>
  );
}
