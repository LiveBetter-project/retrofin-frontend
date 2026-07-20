import { createContext, useContext, useEffect, useMemo, useState } from "react";
import API from "../api/api";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [token, setToken_] = useState(() => localStorage.getItem("token"));
  const [refresh_token, setRefreshToken_] = useState(() =>
    localStorage.getItem("refresh_token")
  );

  const setToken = (newToken) => {
    const nextToken = newToken || null;
    if (nextToken) localStorage.setItem("token", nextToken);
    else localStorage.removeItem("token");
    setToken_(nextToken);
  };

  const setRefreshToken = (newToken) => {
    const nextToken = newToken || null;
    if (nextToken) localStorage.setItem("refresh_token", nextToken);
    else localStorage.removeItem("refresh_token");
    setRefreshToken_(nextToken);
  };

  // Persist to storage + keep axios header consistent (http.js also enforces this per-request)
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
    else localStorage.removeItem("refresh_token");
  }, [token, refresh_token]);

  // Sync when http.js refresh/logout runs (same-tab)
  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      if (detail.type === "logout") {
        setToken_(null);
        setRefreshToken_(null);
      }
      if (detail.type === "tokens") {
        if ("token" in detail) setToken_(detail.token || null);
        if ("refresh_token" in detail) setRefreshToken_(detail.refresh_token || null);
      }
    };

    window.addEventListener("auth:change", handler);
    return () => window.removeEventListener("auth:change", handler);
  }, []);

  const login = async (credentials) => {
    const data = await API.login(credentials);
    setToken(data?.token);
    setRefreshToken(data?.refresh_token);
    return data;
  };

  const register = async (userData) => {
    const data = await API.register(userData);
    if (data?.token) setToken(data.token);
    if (data?.refresh_token) setRefreshToken(data.refresh_token);
    return data;
  };

  const logout = async () => {
    try {
      if (refresh_token) await API.logout(refresh_token);
    } finally {
      setToken(null);
      setRefreshToken(null);
      window.dispatchEvent(new CustomEvent("auth:change", { detail: { type: "logout" } }));
    }
  };

  const contextValue = useMemo(
    () => ({
      token,
      refresh_token,
      isAuthenticated: Boolean(token),
      setToken,
      setRefreshToken,
      login,
      register,
      logout,
    }),
    [token, refresh_token]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
