import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

const AUTH_ENDPOINTS = [
  "/auth/login/",
  "/auth/register/",
  "/auth/refresh/",
  "/auth/logout/",
];

const isAuthEndpoint = (url = "") =>
  AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));

// prevent concurrent refresh races
let refreshPromise = null;

const notifyAuthChange = (detail) => {
  window.dispatchEvent(new CustomEvent("auth:change", { detail }));
};

const setTokens = ({ token, refresh_token }) => {
  if (token) {
    localStorage.setItem("token", token);
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  if (refresh_token) {
    localStorage.setItem("refresh_token", refresh_token);
  }
  notifyAuthChange({ type: "tokens", token, refresh_token });
};

const clearTokens = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  delete axiosInstance.defaults.headers.common["Authorization"];
  notifyAuthChange({ type: "logout" });
};

// ensure requests always carry the current token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const config = error?.config;
    const status = error?.response?.status;
    const requestUrl = config?.url || "";

    if (!config || isAuthEndpoint(requestUrl)) return Promise.reject(error);
    if (status !== 401) return Promise.reject(error);

    // prevent infinite retry
    if (config._retry) {
      clearTokens();
      return Promise.reject(error);
    }
    config._retry = true;

    if (!refreshPromise) {
      const refresh_token = localStorage.getItem("refresh_token");
      if (!refresh_token) {
        clearTokens();
        return Promise.reject(error);
      }

      refreshPromise = axiosInstance
        .post("/auth/refresh/", { refresh_token })
        .then((res) => {
          const newToken = res.data.token;
          const newRefresh = res.data.refresh_token;
          setTokens({ token: newToken, refresh_token: newRefresh });
          return newToken;
        })
        .catch((refreshErr) => {
          clearTokens();
          throw refreshErr;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const newToken = await refreshPromise;
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${newToken}`;

    return axiosInstance(config);
  }
);

export default axiosInstance;