import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import api from "../services/api.js";
import { FaCircleCheck, FaCircleXmark, FaSpinner } from "react-icons/fa6";
import preyeahhLogo from "../assets/preyeahh-logo.png";

export default function VerifyEmail() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "student";

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function verify() {
      try {
        const endpoint = role === "guide" ? `/guides/verify-email/${token}` : `/students/verify-email/${token}`;
        const { data } = await api.get(endpoint);
        if (active) {
          setStatus("success");
          setMessage(data?.message || "Email verified successfully! Your account is now active.");
        }
      } catch (err) {
        if (active) {
          setStatus("error");
          setMessage(err.response?.data?.message || "This verification link is invalid, expired, or has already been used.");
        }
      }
    }

    if (token) {
      verify();
    } else {
      setStatus("error");
      setMessage("No verification token provided.");
    }

    return () => { active = false; };
  }, [token, role]);

  return (
    <div style={{ minHeight: "calc(100vh - 70px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg)" }}>
      <div style={{ maxWidth: 460, width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "2.5rem 2rem", textAlign: "center", boxShadow: "0 10px 30px color-mix(in srgb, var(--ink-900) 3%, transparent)" }}>
        <img src={preyeahhLogo} alt="PREYEAHH Logo" style={{ width: 44, height: 44, objectFit: "contain", margin: "0 auto 1.25rem" }} />

        {status === "loading" && (
          <div>
            <FaSpinner className="fa-spin" style={{ fontSize: "var(--font-size-2xl)", color: "var(--primary)", marginBottom: "1rem" }} />
            <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, margin: "0 0 0.5rem" }}>Verifying your email...</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>Please wait while we confirm your credentials.</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <FaCircleCheck style={{ fontSize: "var(--font-size-3xl)", color: "var(--success)", marginBottom: "1rem" }} />
            <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 800, margin: "0 0 0.5rem" }}>Email Verified!</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
              {message}
            </p>
            <Link to={`/login?role=${role}`} className="btn btn-primary" style={{ display: "inline-block", width: "100%" }}>
              Sign In to Your Account
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <FaCircleXmark style={{ fontSize: "var(--font-size-3xl)", color: "var(--error)", marginBottom: "1rem" }} />
            <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 800, margin: "0 0 0.5rem" }}>Verification Failed</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
              {message}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link to={`/resend-verification?role=${role}`} className="btn btn-primary btn-sm">
                Request New Verification Link
              </Link>
              <Link to={`/login?role=${role}`} className="btn btn-outline btn-sm">
                Return to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
