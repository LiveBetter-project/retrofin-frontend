import { useMemo } from "react";
import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";

import AppLayout from "../components/layout/AppLayout";
import Auth from "../pages/Auth";
import Dashboard from "../pages/Dashboard";
import ExperimentInput from "../pages/ExperimentInput";
import ExperimentOutput from "../pages/ExperimentOutput";
import Settings from "../pages/Settings";

const routesForPublic = [
  { path: "/home", element: <div>Home Page</div> },
  { path: "/about", element: <div>About (placeholder)</div> },
  { path: "/contact", element: <div>Contact us (placeholder)</div> },
  { path: "/legal", element: <div>Legal (placeholder)</div> },
  { path: "/privacy", element: <div>Privacy and Cookie Policy (placeholder)</div> },
  { path: "/forgot-password", element: <div>Forgot password (placeholder)</div> },
];

const routesForAuthenticatedOnly = [
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "dashboard", element: <Dashboard /> },

      // Core app flow — IDs are passed as ?id= search params, not path segments
      { path: "experiments/input", element: <ExperimentInput /> },
      { path: "experiments/output", element: <ExperimentOutput /> },

      // Drawer link
      { path: "settings", element: <Settings /> },
    ],
  },
];

const routesForNotAuthenticatedOnly = [
  { path: "/auth", element: <Auth /> },
  { path: "/login", element: <Navigate to="/auth?mode=login" replace /> },
  { path: "/register", element: <Navigate to="/auth?mode=register" replace /> },
];

const Routes = () => {
  const { token } = useAuth();

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          element: <AppLayout />,
          children: [
            ...routesForPublic,
            ...(!token ? routesForNotAuthenticatedOnly : []),
            ...routesForAuthenticatedOnly,
            { path: "*", element: <Navigate to={token ? "/" : "/auth?mode=login"} replace /> },
          ],
        },
      ]),
    [token]
  );

  return <RouterProvider router={router} />;
};

export default Routes;