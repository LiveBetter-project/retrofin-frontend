import React from "react";
import { Alert, Box, Grid, Stack, Typography } from "@mui/material";
import { NumericInput, TextInput } from "../index";
import { labelFromKey, coerceNumber } from "./constants";

/**
 * Renders editable parameter fields for a financing scheme.
 *
 * Props:
 *   def          — scheme definition from the catalog (has a `fields` array)
 *   params       — current draft param values { [fieldName]: value }
 *   setParams    — state setter for params
 *   onBlurSave   — called on field blur to auto-save
 *   schemeKey    — scheme type key (for cross-field validation)
 *   minLifetime  — minimum building lifetime across the experiment (for term validation)
 */
const SchemeFields = ({ def, params, schemeKey, setParams, onBlurSave, minLifetime }) => {
  const fields = def?.fields;

  if (!Array.isArray(fields)) {
    return (
      <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
        {def ? "No fields defined for this scheme." : "Loading scheme fields…"}
      </Typography>
    );
  }

  if (fields.length === 0) {
    return (
      <Typography sx={{ color: "success.main", fontWeight: 700, fontStyle: "italic" }}>
        No additional inputs required for this scheme.
      </Typography>
    );
  }

  const getFieldError = (field, val) => {
    if (val === "" || val === undefined || val === null) return "";
    const n = Number(val);
    if (isNaN(n)) return "";
    if (field.name.includes("_percent") && n > 1) return "Must be ≤ 1.0 (100%).";
    if (
      field.name === "term_years" &&
      minLifetime != null &&
      isFinite(minLifetime) &&
      n > minLifetime
    ) {
      return `Must be ≤ ${minLifetime} yr (min building lifetime).`;
    }
    return "";
  };

  // Cross-field: equity_crowdfunding — platform_fee_percent + crowd_share_percent <= 1
  const crossFieldError = (() => {
    if (schemeKey === "equity_crowdfunding") {
      const fee = Number(params?.platform_fee_percent) || 0;
      const share = Number(params?.crowd_share_percent) || 0;
      if (fee + share > 1) {
        return `Platform Fee + Crowd Share = ${(fee + share).toFixed(4)} — must sum to ≤ 1.0 (100%).`;
      }
    }
    return "";
  })();

  return (
    <>
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {fields.map((field) => {
        const isInt = field.type === "integer";
        const isNum = isInt || field.type === "number";
        const val = params?.[field.name] ?? "";
        const fieldError = getFieldError(field, val);

        return (
          <Grid item xs={12} md={6} key={field.name}>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Typography
                sx={{
                  width: 210,
                  textAlign: "right",
                  fontWeight: 900,
                  fontStyle: "italic",
                  pt: fieldError ? 0.5 : 0,
                }}
              >
                {field.label || labelFromKey(field.name)}
                {field.required ? " *" : ""}
              </Typography>

              <Box sx={{ flex: 1 }}>
                {isNum ? (
                  <NumericInput
                    name={field.name}
                    value={val}
                    integer={isInt}
                    min={field.minimum ?? 0}
                    step={isInt ? 1 : undefined}
                    error={fieldError}
                    onChange={(e) => {
                      const next = coerceNumber(e.target.value, field.type);
                      setParams((prev) => ({ ...(prev || {}), [field.name]: next }));
                    }}
                    onBlur={onBlurSave}
                  />
                ) : (
                  <TextInput
                    name={field.name}
                    value={val}
                    onChange={(e) => {
                      setParams((prev) => ({ ...(prev || {}), [field.name]: e.target.value }));
                    }}
                    onBlur={onBlurSave}
                  />
                )}
              </Box>
            </Stack>
          </Grid>
        );
      })}
    </Grid>
    {crossFieldError && (
      <Alert severity="error" sx={{ borderRadius: 2, mt: 1.5 }}>
        {crossFieldError}
      </Alert>
    )}
    </>
  );
};

export default SchemeFields;
