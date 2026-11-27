import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import preyeahhLogo from "../assets/preyeahh-logo.png";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const destinations = {
      institution: "/institution-portal",
      guide: "/guide-panel",
      parent: "/parent-portal",
      admin: "/admin",
      student: "/dashboard",
    };
    navigate(destinations[user.role] || "/dashboard", { replace: true });
  }, [isAuthenticated, user, navigate]);

  return (
    <main className="home-container" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 1.5rem" }}>
      <section style={{ padding: "5rem 1rem", textAlign: "center" }}>
        <img src={preyeahhLogo} alt="PREYEAHH" width="64" height="64" />
        <h1 style={{ fontFamily: "var(--font-public-heading)", fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 1.1 }}>
          Discover what you can become.
          <br />
          <span style={{ color: "var(--primary)" }}>Build the path to get there.</span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-lg)", maxWidth: 680, margin: "1.5rem auto 2rem" }}>
          Explore career domains and roles, then find learning resources and practical next steps that fit your goals.
        </p>
        <Link to="/explore-careers" className="btn btn-primary">
          Explore the career wheel <FaArrowRight />
        </Link>
      </section>
    </main>
  );
}
