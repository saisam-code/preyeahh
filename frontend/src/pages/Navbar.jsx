import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* LOGO */}
        <Link to="/" className="navbar-logo">
          🎓 Pre-Yeah
        </Link>

        {/* MENU */}
        <ul className="navbar-menu">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/roles">Roles</Link>
          </li>
          <li>
            <Link to="/beyond">Beyond</Link>
          </li>

          {isAuthenticated ? (
            <>
              {user?.role === "admin" && (
                <li>
                  <Link to="/admin">Admin</Link>
                </li>
              )}
              <li className="navbar-user">
                <span>👤 {user?.firstName || "User"}</span>
                <button onClick={handleLogout} className="navbar-logout">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </>
          )}

          <li>
            <ThemeToggle />
          </li>
        </ul>
      </div>
    </nav>
  );
}
