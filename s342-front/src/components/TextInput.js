import React from "react";
import { TextField } from "@mui/material";

const TextInput = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  type = "text",
  autoComplete,
  disabled = false,
  fullWidth = true,
  ...rest
}) => {
  return (
    <TextField
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      type={type}
      autoComplete={autoComplete}
      disabled={disabled}
      fullWidth={fullWidth}
      error={Boolean(error)}
      helperText={error || helperText}
      variant="outlined"
      size="medium"
      sx={{
        "& .MuiOutlinedInput-root": { borderRadius: 2 },
      }}
      {...rest}
    />
  );
};

export default TextInput;