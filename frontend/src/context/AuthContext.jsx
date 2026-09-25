import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { setAccessToken, getAccessToken, setActiveRole, getActiveRole } from "../services/api";

const AuthContext = createContext(null);
const USER_STORAGE_KEY = "pp_user";

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
  const [user, setUser] = useState(null);
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
    const path = role === "guide" ? "/guides/forgot-password" : "/students/forgot-password";
    const { data } = await api.post(path, { email });
    return data;
  }, []);

  const resetPassword = useCallback(async (token, password, role = "student") => {
    const path = role === "guide" ? "/guides/reset-password" : "/students/reset-password";
    const { data } = await api.post(path, { token, password });
    return data;
  }, []);

  const resendVerification = useCallback(async (email, role = "student") => {
    const path = role === "guide" ? "/guides/resend-verification" : "/students/resend-verification";
    const { data } = await api.post(path, { email });
    return data;
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
      login, registerStudent, registerGuide, forgotPassword, resetPassword, resendVerification, logout,
    }),
    [user, initialized, loading, login, registerStudent, registerGuide, forgotPassword, resetPassword, resendVerification, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}