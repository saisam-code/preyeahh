/**
 * GoogleCallback.jsx
 *
 * The backend redirects here after a successful Google OAuth callback:
 *   /google-callback#token=<accessToken>&role=student
 *
 * This page reads the token from the URL fragment (never hits the server),
 * stores it in the app's auth system, fetches the current user profile, then
 * redirects to the home page.
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { setAccessToken, setActiveRole } from "../services/api.js";
import api from "../services/api.js";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const processed = useRef(false); // prevent double-run in StrictMode

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    async function handleCallback() {
      try {
        // Read fragment — note: location.hash starts with "#"
        const fragment = window.location.hash.slice(1);
        const params = new URLSearchParams(fragment);
        const token = params.get("token");
        const role = params.get("role") || "student";

        if (!token) {
          // Clean up any stale token from a previous attempt
          setAccessToken(null);
          setActiveRole(null);
          const searchParams = new URLSearchParams(window.location.search);
          const googleError = searchParams.get("google_error");
          navigate(`/?google_error=${googleError || "unknown"}`, { replace: true });
          return;
        }

        // Store the application's access token (same path as email/password login)
        setAccessToken(token);
        setActiveRole(role);

        // Clear the fragment from the URL immediately so the token is not visible
        window.history.replaceState(null, "", window.location.pathname);

        // Fetch the current user profile
        const mePath = role === "guide" ? "/guides/me" : "/students/me";
        const { data } = await api.get(mePath);
        const user = data.data;

        // Persist user in AuthContext and localStorage (same as email/password flow)
        updateUser(user);
        localStorage.setItem("pp_user", JSON.stringify(user));

        navigate("/", { replace: true });
      } catch (err) {
        console.error("[GoogleCallback] Error:", err);
        setAccessToken(null);
        setActiveRole(null);
        navigate("/?google_error=session_error", { replace: true });
      }
    }

    handleCallback();
  }, [navigate, updateUser]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <p style={{ color: "var(--text-dim, #888)" }}>Signing you in with Google…</p>
    </div>
  );
}
