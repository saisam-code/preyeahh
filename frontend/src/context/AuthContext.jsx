import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { setAccessToken, getAccessToken, setActiveRole, getActiveRole } from "../services/api.js";

const AuthContext = createContext(null);
const USER_STORAGE_KEY = "pp_user";

// Per-role auth endpoints (admin shares the reset flow but has its own session handling in pages/Admin.jsx)
const AUTH_PATH = {
  student: { forgot: "/students/forgot-password", reset: "/students/reset-password", verify: "/students/verify-email" },
  guide: { forgot: "/guides/forgot-password", reset: "/guides/reset-password", verify: "/guides/verify-email" },
  admin: { forgot: "/admin/forgot-password", reset: "/admin/reset-password" },
};

function storeUser(user) {
  if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_STORAGE_KEY);
}

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const activeRole = getActiveRole();
    const cachedUser = loadStoredUser();
    return cachedUser?.role === activeRole ? cachedUser : null;
  });
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const role = getActiveRole();
      const cached = loadStoredUser();

      if (role === "admin" || !role || !cached) {
        setInitialized(true);
        return;
      }

      try {
        const mePath = role === "guide" ? "/guides/me" : "/students/me";

        if (!getAccessToken()) {
          const refreshPath = role === "guide" ? "/guides/refresh" : "/students/refresh";
          const { data } = await api.post(refreshPath);
          setAccessToken(data.data.accessToken);
        }

        const { data } = await api.get(mePath);
        setUser(data.data);
        storeUser(data.data);
      } catch {
        setAccessToken(null);
        setActiveRole(null);
        storeUser(null);
        setUser(null);
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      try {
        const { data } = await api.post("/students/login", { email, password });
        setAccessToken(data.data.accessToken);
        setActiveRole("student");
        setUser(data.data.user);
        storeUser(data.data.user);
        return data.data.user;
      } catch (studentErr) {
        if (studentErr.response?.status !== 401) throw studentErr;
      }

      const { data } = await api.post("/guides/login", { email, password });
      setAccessToken(data.data.accessToken);
      setActiveRole("guide");
      setUser(data.data.user);
      storeUser(data.data.user);
      return data.data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerStudent = useCallback(async ({ name, email, password, branch }) => {
    setLoading(true);
    try {
      const { data } = await api.post("/students/register", { name, email, password, branch });
      return data; // { data: { email }, message } — no auto-login, must verify first
    } finally {
      setLoading(false);
    }
  }, []);

  const registerGuide = useCallback(async ({ name, email, password, branch, roleNames, bio }) => {
    setLoading(true);
    try {
      const { data } = await api.post("/guides/register", { name, email, password, branch, roleNames, bio });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email, role = "student") => {
    const path = AUTH_PATH[role]?.forgot || AUTH_PATH.student.forgot;
    const { data } = await api.post(path, { email });
    return data;
  }, []);

  const resetPassword = useCallback(async (token, password, role = "student") => {
    const path = AUTH_PATH[role]?.reset || AUTH_PATH.student.reset;
    const { data } = await api.post(path, { token, password });
    return data;
  }, []);

  const resendVerification = useCallback(async (email, role = "student") => {
    const path = role === "guide" ? "/guides/resend-verification" : "/students/resend-verification";
    const { data } = await api.post(path, { email });
    return data;
  }, []);

  const verifyEmail = useCallback(async (token, role = "student") => {
    const base = AUTH_PATH[role]?.verify;
    if (!base) throw new Error("Email verification is not available for this role");
    const { data } = await api.get(`${base}/${encodeURIComponent(token)}`);
    return data;
  }, []);

  // Merge fresh fields (e.g. updated AI preferences) into the cached user
  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      storeUser(next);
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    const role = getActiveRole();
    try {
      if (role === "guide") await api.post("/guides/logout");
      else if (role === "student") await api.post("/students/logout");
    } catch {
      // local state clears regardless of network outcome
    }
    setAccessToken(null);
    setActiveRole(null);
    storeUser(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user, role: user?.role || null, isAuthenticated: !!user, initialized, loading,
      login, registerStudent, registerGuide, forgotPassword, resetPassword, resendVerification, verifyEmail, updateUser, logout,
    }),
    [user, initialized, loading, login, registerStudent, registerGuide, forgotPassword, resetPassword, resendVerification, verifyEmail, updateUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
