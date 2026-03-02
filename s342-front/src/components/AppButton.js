import React from "react";
import { Button, CircularProgress } from "@mui/material";

const AppButton = ({
  children,
  loading = false,
  disabled = false,
  variant = "contained",
  fullWidth = true,
  ...rest
}) => {
  return (
    <Button
      variant={variant}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      sx={{
        borderRadius: 2,
        py: 1.2,
      }}
      {...rest}
    >
      {loading ? <CircularProgress size={22} /> : children}
    </Button>
  );
};

export default AppButton;