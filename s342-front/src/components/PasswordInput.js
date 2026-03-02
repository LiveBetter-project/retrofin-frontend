import React, { useState } from "react";
import { IconButton, InputAdornment } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import TextInput from "./TextInput";

const PasswordInput = ({
  name,
  label = "Password",
  value,
  onChange,
  onBlur,
  error,
  helperText,
  autoComplete = "current-password",
  disabled = false,
  ...rest
}) => {
  const [show, setShow] = useState(false);

  return (
    <TextInput
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      helperText={helperText}
      type={show ? "text" : "password"}
      autoComplete={autoComplete}
      disabled={disabled}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShow((s) => !s)}
              edge="end"
              aria-label={show ? "Hide password" : "Show password"}
              disabled={disabled}
            >
              {show ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...rest}
    />
  );
};

export default PasswordInput;