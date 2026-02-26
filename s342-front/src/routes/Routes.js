import { useMemo } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";

const routesForPublic = [
  {
    path: "/home",
    element: <div>Home Page</div>,
  },
];

const routesForAuthenticatedOnly = [
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <Dashboard />,
      },
    ],
  },
];

const routesForNotAuthenticatedOnly = [
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
];

const Routes = () => {
  const { token } = useAuth();

  const router = useMemo(
    () =>
      createBrowserRouter([
        ...routesForPublic,
        ...(!token ? routesForNotAuthenticatedOnly : []),
        ...routesForAuthenticatedOnly,
      ]),
    [token]
  );

  return <RouterProvider router={router} />;
};

export default Routes;
