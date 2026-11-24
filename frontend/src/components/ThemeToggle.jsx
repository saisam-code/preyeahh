import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

const STORAGE_KEY = "pp_theme";

function readThemePreference() {
  return localStorage.getItem(STORAGE_KEY) || "system";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(readThemePreference);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [pop, setPop] = useState(false);
  const isDark = theme === "dark" || (theme === "system" && systemDark);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = (event) => setSystemDark(event.matches);
    const updatePreference = () => setTheme(readThemePreference());
    media.addEventListener("change", updateSystemTheme);
    window.addEventListener("preyeahh-theme-change", updatePreference);
    return () => {
      media.removeEventListener("change", updateSystemTheme);
      window.removeEventListener("preyeahh-theme-change", updatePreference);
    };
  }, []);

  const handleToggle = () => {
    const next = isDark ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
    setPop(true);
    setTimeout(() => setPop(false), 400);
  };

  return (
    <button
      id="theme-toggle"
      className={pop ? "spinning" : ""}
      type="button"
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? <FaSun /> : <FaMoon />}
    </button>
  );
}
