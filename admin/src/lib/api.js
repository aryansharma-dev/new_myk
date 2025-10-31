import axios from "axios";

const normalise = (value = "") => value.replace(/\/$/, "");
const envBackendUrl = normalise(import.meta.env.VITE_BACKEND_URL || "");
const localPort = import.meta.env.VITE_BACKEND_LOCAL_PORT || "4000";
const localBackendUrl = normalise(`http://localhost:${localPort}`);

const shouldForceRemote =
  (import.meta.env.VITE_FORCE_BACKEND_URL || "").toString().toLowerCase() === "true";

const resolveBackendUrl = () => {
  let resolved = envBackendUrl || localBackendUrl;

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
    resolved = localBackendUrl;
  }

  return resolved || localBackendUrl;
};

export const backendUrl = resolveBackendUrl();

const isBrowser = typeof window !== "undefined";

const client = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

const readToken = () => {
  if (!isBrowser) return "";
  return (
    window.localStorage.getItem("token") ||
    window.sessionStorage.getItem("token") ||
    ""
  );
};

export const clearToken = () => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem("token");
    window.sessionStorage.removeItem("token");
  } catch (_) {
    // ignore storage errors
  }
};

const redirectToLogin = () => {
  if (!isBrowser) return;
  if (window.location.hash) {
    window.location.hash = "";
  }
  window.location.replace("/");
};

client.interceptors.request.use((config) => {
  const token = readToken();
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
    console.info(`[admin-api] ${config.method?.toUpperCase()} ${url}`);
  }

  return config;
});

client.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      const url = `${response.config?.baseURL || ""}${response.config?.url || ""}`;
      console.info(`[admin-api] ✅ ${response.status} ${url}`);
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      clearToken();
      redirectToLogin();
    }

    if (import.meta.env.DEV) {
      const cfg = error.config || {};
      const url = `${cfg.baseURL || ""}${cfg.url || ""}`;
      console.error(`[admin-api] ❌ ${cfg.method?.toUpperCase()} ${url}:`, error.message);
    }
    return Promise.reject(error);
  }
);

const normalisePath = (path = "") => {
  if (/^https?:/i.test(path)) return path;
  const ensureLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  return ensureLeadingSlash.startsWith("/api")
    ? ensureLeadingSlash
    : `/api${ensureLeadingSlash}`;
};

export async function request(path, options = {}) {
  const { method = "GET", body, data, params, ...rest } = options;
  const url = normalisePath(path);
  const payload = body !== undefined ? body : data;

  const config = {
    url,
    method: method.toLowerCase(),
    params,
    ...rest,
  };

  if (payload !== undefined) {
    config.data = payload;
  }

  const response = await client.request(config);
  return response.data;
}

export { request as api };
export default client;