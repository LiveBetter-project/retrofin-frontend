import React from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";

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
  const handleClear = () => {
    if (onChange) {
      // Synthesise a change event so the parent handler works identically
      onChange({ target: { name, value: "" } });
    }
  };

  const showClear = !disabled && value !== "" && value !== null && value !== undefined;

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
        "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "common.white" },
      }}
      InputProps={{
        endAdornment: showClear ? (
          <InputAdornment position="end">
            <IconButton
              aria-label="clear input"
              onClick={handleClear}
              edge="end"
              size="small"
              tabIndex={-1}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      {...rest}
    />
  );
};

export default TextInput;
