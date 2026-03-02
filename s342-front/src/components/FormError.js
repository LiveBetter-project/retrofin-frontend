import React from "react";
import { Alert } from "@mui/material";

const FormError = ({ message }) => {
  if (!message) return null;

  return (
    <Alert
      severity="error"
      sx={{
        mb: 2,
        borderRadius: 2,
        "& .MuiAlert-message": { width: "100%" },
      }}
    >
      {message}
    </Alert>
  );
};

export default FormError;