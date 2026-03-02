import React from "react";
import { Navigate } from "react-router-dom";

const Register = () => <Navigate to="/auth?mode=register" replace />;

export default Register;