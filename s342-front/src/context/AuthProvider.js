import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/http";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [token, setToken_] = useState(localStorage.getItem("token"));
  const [refresh_token, setRefreshToken_] = useState(localStorage.getItem('refresh_token'))

  const setToken = (newToken) => {
    setToken_(newToken);
  };

  const setRefreshToken = (newToken) => {
    setRefreshToken_(newToken);
  };

  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + token;
      localStorage.setItem('token',token);
    } else {
      delete axiosInstance.defaults.headers.common["Authorization"];
      localStorage.removeItem('token')
    }
    if (refresh_token) {
      localStorage.setItem('refresh_token', refresh_token);
    } else {
      localStorage.removeItem('refresh_token')
    }
  }, [token, refresh_token]);

  const contextValue = useMemo(
    () => ({
      token,
      setToken,
      refresh_token,
      setRefreshToken,
    }),
    [token,refresh_token]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;