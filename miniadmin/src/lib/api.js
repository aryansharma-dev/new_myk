import axios from "axios";

const normalise = (value = "") => value.replace(/\/$/, "");
const envBackendUrl = normalise(import.meta.env.VITE_BACKEND_URL || "");
const localPort = import.meta.env.VITE_BACKEND_LOCAL_PORT || "4000";
const localBackendUrl = normalise(`http://localhost:${localPort}`);

const shouldForceRemote =
  (import.meta.env.VITE_FORCE_BACKEND_URL || "")
    .toString()
    .toLowerCase() === "true";

const resolveBackendUrl = () => {
  let resolved = envBackendUrl || localBackendUrl || "/api";

  if (typeof window === "undefined") {
    return resolved;
  }

  const hostname = window.location.hostname;
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local");

  if (!shouldForceRemote && isLocalhost) {
    resolved = localBackendUrl || resolved;
  }

  return resolved || localBackendUrl || "/api";
};

const backendUrl = resolveBackendUrl();

const shouldTrimApiPrefix = backendUrl.endsWith("/api");

const normaliseRequestPath = (value) => {
  if (!value || typeof value !== "string") return value;
  if (/^https?:/i.test(value)) return value;

  let path = value.trim();
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  if (shouldTrimApiPrefix) {
    if (path === "/api") {
      return "/";
    }
    if (path.startsWith("/api/")) {
      path = path.slice(4);
      if (!path.startsWith("/")) {
        path = `/${path}`;
      }
    }
  }

  return path;
};

export { backendUrl };
const api = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

const getStoredToken = () => {
  if (typeof window === "undefined") return "";
  try {
    return (
      window.localStorage.getItem("token") ||
      window.sessionStorage.getItem("token") ||
      ""
    );
  } catch (error) {
    console.warn("Unable to read auth token from storage", error);
    try {
      return window.localStorage.getItem("token") || "";
    } catch (err) {
      console.warn("Unable to access localStorage", err);
    }
  }
  return "";
};

api.interceptors.request.use(
  (config) => {
    const nextConfig = { ...config };

    const token = getStoredToken();
    if (token) {
      nextConfig.headers = nextConfig.headers || {};
      nextConfig.headers.Authorization = `Bearer ${token}`;
      nextConfig.headers.token = token;
    }

    const isFormData = nextConfig.data instanceof FormData;
    if (!isFormData && nextConfig.data !== undefined && !nextConfig.headers?.["Content-Type"]) {
      nextConfig.headers = { ...(nextConfig.headers || {}), "Content-Type": "application/json" };
    }

    if (nextConfig.url) {
      nextConfig.url = normaliseRequestPath(nextConfig.url);
    }

    if (import.meta.env.DEV) {
      const url = `${nextConfig.baseURL || ""}${nextConfig.url || ""}`;
      console.info(`[api] ${nextConfig.method?.toUpperCase()} ${url}`);
    }

    return config;
    return nextConfig;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      const url = `${response.config?.baseURL || ""}${response.config?.url || ""}`;
      console.info(`[api] ✅ ${response.status} ${url}`);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      const cfg = error.config || {};
      const url = `${cfg.baseURL || ""}${cfg.url || ""}`;
      console.error(`[api] ❌ ${cfg.method?.toUpperCase()} ${url}:`, error.message);
    }
    return Promise.reject(error);
  },
);

export default api;