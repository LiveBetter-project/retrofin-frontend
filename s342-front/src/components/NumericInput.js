import React, { useEffect, useRef, useState } from "react";
import {
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import RemoveIcon from "@mui/icons-material/Remove";

/**
 * A text-based numeric input that:
 * - Shows visible  [−]  and  [+]  step buttons at each end of the field
 * - Shows a clear [×] button (end adornment, right of the [+]) when value exists
 * - Uses comma (,) as the decimal separator for display
 * - Accepts both "." and "," as decimal input (normalises to comma in display)
 * - Blocks letters, symbols, minus, and plus keys
 * - Supports ArrowUp / ArrowDown keyboard keys to increment / decrement by `step`
 * - Clamps values to `min` (default 0) on blur — prevents negatives
 * - Emits values via onChange as dot-notation numeric strings (e.g. "3.14")
 * - For integer=true: blocks decimal separators entirely
 */
const NumericInput = ({
  value,
  onChange,
  onBlur,
  name,
  integer = false,
  min = 0,
  step,
  disabled = false,
  label,
  error,
  helperText,
  fullWidth = true,
  ...rest
}) => {
  // ── Display (comma as decimal) ───────────────────────────────────────────
  const toDisplay = (v) => {
    if (v === "" || v === null || v === undefined) return "";
    const s = String(v);
    if (integer) return s.replace(/[^0-9]/g, "");
    return s.replace(".", ",");
  };

  const [display, setDisplay] = useState(() => toDisplay(value));
  const lastEmitted = useRef(value);

  useEffect(() => {
    const incoming = value === "" || value === null || value === undefined ? "" : String(value);
    if (incoming !== String(lastEmitted.current ?? "")) {
      lastEmitted.current = value;
      setDisplay(toDisplay(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // ── Emit ────────────────────────────────────────────────────────────────
  const emit = (dotStr) => {
    lastEmitted.current = dotStr;
    if (onChange) onChange({ target: { name, value: dotStr } });
  };

  // ── Step logic ──────────────────────────────────────────────────────────
  const effectiveStep = step ?? (integer ? 1 : 1);

  const applyStep = (direction) => {
    const current = parseFloat(display.replace(",", ".")) || 0;
    let next = direction === "up"
      ? current + effectiveStep
      : current - effectiveStep;
    if (min !== undefined && next < min) next = min;
    // Round to avoid floating-point drift (e.g. 0.1 + 0.2 = 0.30000000000000004)
    const decimals = integer ? 0 : Math.max(
      (String(effectiveStep).split(".")[1] || "").length,
      (String(current).split(".")[1] || "").length
    );
    next = parseFloat(next.toFixed(decimals));
    setDisplay(integer ? String(next) : String(next).replace(".", ","));
    emit(String(next));
  };

  // ── KeyDown ─────────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    const CONTROL_KEYS = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight",
      "Tab", "Home", "End", "Enter",
    ];
    if (CONTROL_KEYS.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;

    if (e.key === "ArrowUp")   { e.preventDefault(); applyStep("up");   return; }
    if (e.key === "ArrowDown") { e.preventDefault(); applyStep("down"); return; }
    if (e.key === "-" || e.key === "+") { e.preventDefault(); return; }

    if (integer) {
      if (!/^\d$/.test(e.key)) e.preventDefault();
    } else {
      if (!/^[\d,.]$/.test(e.key)) e.preventDefault();
    }
  };

  // ── Change ───────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    let raw = e.target.value;
    if (integer) {
      raw = raw.replace(/[^\d]/g, "");
      setDisplay(raw);
      emit(raw);
      return;
    }
    raw = raw.replace(/\./g, ",").replace(/[^\d,]/g, "");
    const firstComma = raw.indexOf(",");
    if (firstComma !== -1) {
      raw = raw.slice(0, firstComma + 1) + raw.slice(firstComma + 1).replace(/,/g, "");
    }
    setDisplay(raw);
    emit(raw.replace(",", "."));
  };

  // ── Blur ────────────────────────────────────────────────────────────────
  const handleBlur = (e) => {
    const num = parseFloat(display.replace(",", "."));
    if (!isNaN(num) && min !== undefined && num < min) {
      setDisplay(toDisplay(String(min)));
      emit(String(min));
    }
    if (onBlur) onBlur(e);
  };

  // ── Clear ───────────────────────────────────────────────────────────────
  const handleClear = () => {
    setDisplay("");
    emit("");
  };

  const showClear = !disabled && display !== "" && display !== null;

  // ── Shared button sx ────────────────────────────────────────────────────
  const stepBtnSx = {
    bgcolor: "grey.200",
    borderRadius: "6px",
    width: 28,
    height: 28,
    "&:hover": { bgcolor: "grey.300" },
    "&.Mui-disabled": { opacity: 0.35 },
  };

  return (
    <TextField
      label={label}
      value={display}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
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
        startAdornment: (
          <InputAdornment position="start">
            <IconButton
              tabIndex={-1}
              aria-label="decrease"
              onClick={() => applyStep("down")}
              disabled={disabled}
              size="small"
              sx={stepBtnSx}
            >
              <RemoveIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              tabIndex={-1}
              aria-label="increase"
              onClick={() => applyStep("up")}
              disabled={disabled}
              size="small"
              sx={stepBtnSx}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
            {showClear && (
              <IconButton
                tabIndex={-1}
                aria-label="clear"
                onClick={handleClear}
                edge="end"
                size="small"
                sx={{ ml: 0.25 }}
              >
                <ClearIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </InputAdornment>
        ),
      }}
      // Pass through any remaining props (e.g. inputProps for placeholder/step)
      {...rest}
    />
  );
};

export default NumericInput;
