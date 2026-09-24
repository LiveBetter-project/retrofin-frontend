import React, { useMemo, useState } from "react";
import { Box, Button, Link, Stack } from "@mui/material";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import API from "../api/api";
import { AppButton, FormError, PasswordInput, TextInput } from "../components";
import "./Auth.css";

// Always returns a string: FormError renders it as a React child, so an object
// (e.g. the backend's { code, message, details } envelope) would crash the page.
const extractError = (err, fallback) => {
  const data = err?.response?.data;
  const apiError = data?.error;

  if (apiError && typeof apiError === "object") {
    const details = Array.isArray(apiError.details) ? apiError.details : [];
    const messages = details.map((d) => d?.message).filter(Boolean);
    if (messages.length) return messages.join(" ");
    if (typeof apiError.message === "string" && apiError.message) return apiError.message;
  }

  const candidate = [apiError, data?.detail, data, err?.message].find(
    (v) => typeof v === "string" && v
  );
  return candidate || fallback;
};

const Auth = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = (searchParams.get("mode") || "login").toLowerCase();
  const isRegister = mode === "register";

  const navigate = useNavigate();
  const auth = useAuth();

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const goLogin = () => setSearchParams({ mode: "login" }, { replace: true });
  const goRegister = () => setSearchParams({ mode: "register" }, { replace: true });

  const loginPayload = useMemo(
    () => ({
      username: loginUsername,
      password: loginPassword,
    }),
    [loginUsername, loginPassword]
  );

  const registerPayload = useMemo(
    () => ({
      username: regUsername,
      email: regEmail,
      first_name: regFirstName,
      last_name: regLastName,
      password: regPassword,
      password2: regConfirm,
    }),
    [regUsername, regEmail, regFirstName, regLastName, regPassword, regConfirm]
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      if (auth?.login) {
        await auth.login(loginPayload);
      } else {
        const data = await API.login(loginPayload);
        auth?.setToken?.(data?.token);
        auth?.setRefreshToken?.(data?.refresh_token);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setLoginError(extractError(err, "Login failed. Please try again."));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");

    if (regPassword !== regConfirm) {
      setRegError("Passwords do not match.");
      return;
    }

    setRegLoading(true);

    try {
      let data;
      if (auth?.register) {
        data = await auth.register(registerPayload);
      } else {
        data = await API.register(registerPayload);
        auth?.setToken?.(data?.token);
        auth?.setRefreshToken?.(data?.refresh_token);
      }

      if (data?.token) navigate("/", { replace: true });
      else goLogin();
    } catch (err) {
      setRegError(extractError(err, "Registration failed. Please try again."));
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <Box className="auth-page">
      <Box className={`auth-container ${isRegister ? "right-panel-active" : ""}`}>
        {/* LOGIN */}
        <Box className="form-container sign-in-container">
          <Box component="form" className="auth-form" onSubmit={handleLogin}>
            <h2 className="auth-title">Login</h2>

            <Stack spacing={2}>
              <TextInput
                className="auth-input"
                name="username"
                label="Username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                autoComplete="username"
                required
              />

              <PasswordInput
                className="auth-input"
                name="password"
                label="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <Stack direction="row" justifyContent="center" sx={{ mt: 0.5 }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  underline="hover"
                  className="auth-link"
                >
                  Forgot your password?
                </Link>
              </Stack>

              <FormError message={loginError} />

              <AppButton
                type="submit"
                loading={loginLoading}
                className="auth-submit"
              >
                Login
              </AppButton>
            </Stack>
          </Box>
        </Box>

        {/* REGISTER */}
        <Box className="form-container sign-up-container">
          <Box component="form" className="auth-form" onSubmit={handleRegister}>
            <h2 className="auth-title">Register</h2>

            <Stack spacing={2}>
              <TextInput
                className="auth-input"
                name="username"
                label="Username"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                autoComplete="username"
                required
              />

              <TextInput
                className="auth-input"
                name="email"
                label="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <PasswordInput
                className="auth-input"
                name="password"
                label="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                autoComplete="new-password"
                required
              />

              <Box sx={{ display: "flex", gap: 2 }}>
                <TextInput
                  className="auth-input"
                  name="first_name"
                  label="First Name"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  autoComplete="given-name"
                  sx={{ flex: 1 }}
                />

                <TextInput
                  className="auth-input"
                  name="last_name"
                  label="Last Name"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  autoComplete="family-name"
                  sx={{ flex: 1 }}
                />
              </Box>

              <PasswordInput
                className="auth-input"
                name="confirmPassword"
                label="Repeat Password"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />

              <FormError message={regError} />

              <AppButton
                type="submit"
                loading={regLoading}
                className="auth-submit"
              >
                Register
              </AppButton>
            </Stack>
          </Box>
        </Box>

        {/* OVERLAY */}
        <Box className="overlay-container">
          <Box className="overlay">
            <Box className="overlay-panel overlay-left">
              <h2 className="auth-subtitle">Welcome Back!</h2>
              <p className="auth-body">
                Enter your personal details to use all of the site features
              </p>
              <Button className="overlay-action" onClick={goLogin}>
                Login
              </Button>
            </Box>

            <Box className="overlay-panel overlay-right">
              <h2 className="auth-subtitle">New Here?</h2>
              <p className="auth-body">
                Register with your personal details to use the site features
              </p>
              <Button className="overlay-action" onClick={goRegister}>
                Register
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Auth;