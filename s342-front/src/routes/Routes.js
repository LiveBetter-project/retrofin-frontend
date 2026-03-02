import { useMemo } from "react";
import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import AppLayout from "../components/layout/AppLayout";

const routesForPublic = [
  { path: "/home", element: <div>Home Page</div> },

  // placeholders so footer links don't bounce to wildcard
  { path: "/about", element: <div>About (placeholder)</div> },
  { path: "/contact", element: <div>Contact us (placeholder)</div> },
  { path: "/legal", element: <div>Legal (placeholder)</div> },
  { path: "/privacy", element: <div>Privacy and Cookie Policy (placeholder)</div> },
];

const routesForAuthenticatedOnly = [
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "dashboard", element: <Dashboard /> },
    ],
  },
];

const routesForNotAuthenticatedOnly = [
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
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
            { path: "*", element: <Navigate to={token ? "/" : "/login"} replace /> },
          ],
        },
      ]),
    [token]
  );

  return <RouterProvider router={router} />;
};

export default Routes;