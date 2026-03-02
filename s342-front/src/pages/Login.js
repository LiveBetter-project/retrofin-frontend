import React from "react";
import { Navigate } from "react-router-dom";

const Login = () => <Navigate to="/auth?mode=login" replace />;

export default Login;