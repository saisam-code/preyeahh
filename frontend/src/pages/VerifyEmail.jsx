import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | error
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Missing verification token — use the link from your email");
      return;
    }

    api
      .post("/auth/verify-email", { token })
      .then(() => {
        navigate("/login", { state: { message: "Email verified! Please login." } });
      })
      .catch((e) => {
        setError(e.response?.data?.message || "Verification failed");
        setStatus("error");
      });
  }, [token, navigate]);

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h2>Verify Email</h2>
        {status === "loading" ? (
          <p style={{ color: "var(--text-dim)" }}>Verifying email...</p>
        ) : (
          <p style={{ color: "#ef4444", fontSize: "0.85rem" }}>Error: {error}</p>
        )}
      </div>
    </div>
  );
}
