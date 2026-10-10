import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { setAccessToken, getAccessToken, setActiveRole, getActiveRole } from "../services/api.js";

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

  const registerGuide = useCallback(async ({ name, email, password, branch, roleNames, bio }) => {
    setLoading(true);
    try {
      const { data } = await api.post("/guides/register", { name, email, password, branch, roleNames, bio });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerStudent = useCallback(async ({ name, email, password, branch }) => {
    setLoading(true);
    try {
      const { data } = await api.post("/students/register", { name, email, password, branch });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  // Shared manual (email/password) login for students and guides.
  const login = useCallback(async (role, { email, password }) => {
    setLoading(true);
    try {
      const path = role === "guide" ? "/guides/login" : "/students/login";
      const { data } = await api.post(path, { email, password });
      const loggedInUser = data.data.user;

      setAccessToken(data.data.accessToken);
      setActiveRole(role);
      storeUser(loggedInUser);
      setUser(loggedInUser);

      return loggedInUser;
    } finally {
      setLoading(false);
    }
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
      registerGuide, registerStudent, login, updateUser, logout,
    }),
    [user, initialized, loading, registerGuide, registerStudent, login, updateUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
