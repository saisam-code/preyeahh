import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

const STORAGE_KEY = "pp_theme";

function resolveInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark") return true;
  if (saved === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Exact port of initTheme()/toggleTheme() from app.js.
 * Toggles the `dark` class on <body>, same class the existing
 * style.css design tokens key off (body.dark { ... }).
 */
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(resolveInitialTheme);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleToggle = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      return next;
    });
    setPop(true);
    setTimeout(() => setPop(false), 400);
  };

  return (
    <button
      id="theme-toggle"
      className={pop ? "spinning" : ""}
      onClick={handleToggle}
      aria-label="Toggle theme"
    >
      {isDark ? <FaSun /> : <FaMoon />}
    </button>
  );
}
