import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
  if (token) localStorage.setItem("pp_access_token", token);
  else localStorage.removeItem("pp_access_token");
}

export function getAccessToken() {
  if (accessToken) return accessToken;
  const stored = localStorage.getItem("pp_access_token");
  if (stored) accessToken = stored;
  return accessToken;
}

export function setActiveRole(role) {
  if (role) localStorage.setItem("pp_active_role", role);
  else localStorage.removeItem("pp_active_role");
}

export function getActiveRole() {
  return localStorage.getItem("pp_active_role");
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

async function performRefresh() {
  const role = getActiveRole();
  if (!role) throw new Error("No active role to refresh");

  const path = role === "admin" ? "/admin/refresh" : role === "guide" ? "/guides/refresh" : "/students/refresh";
  const { data } = await axios.post(`${API_BASE}${path}`, {}, { withCredentials: true });

  setAccessToken(data.data.accessToken);
  return data.data.accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry && getActiveRole()) {
      original._retry = true;
      try {
        if (!refreshPromise) refreshPromise = performRefresh().finally(() => { refreshPromise = null; });
        const newToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        setAccessToken(null);
        setActiveRole(null);
      }
    }

    return Promise.reject(error);
  }
);

export default api;