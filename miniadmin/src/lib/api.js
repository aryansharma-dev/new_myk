import axios from "axios";

const normalise = (value = "") => value.replace(/\/$/, "");
const backendUrl = normalise(
  import.meta.env.VITE_BACKEND_URL || "/api"
);

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
    const token = getStoredToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      config.headers.token = token;
    }

    const isFormData = config.data instanceof FormData;
    if (!isFormData && config.data !== undefined && !config.headers?.["Content-Type"]) {
      config.headers = { ...(config.headers || {}), "Content-Type": "application/json" };
    }

    if (import.meta.env.DEV) {
      const url = `${config.baseURL || ""}${config.url || ""}`;
      console.info(`[api] ${config.method?.toUpperCase()} ${url}`);
    }

    return config;
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