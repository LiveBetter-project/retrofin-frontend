import React from "react";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { NumericInput, TextInput } from "../index";
import { labelFromKey, coerceNumber } from "./constants";

/**
 * Renders editable parameter fields for a financing scheme.
 *
 * Props:
 *   def        — scheme definition from the catalog (has a `fields` array)
 *   params     — current draft param values { [fieldName]: value }
 *   setParams  — state setter for params
 *   onBlurSave — called on field blur to auto-save
 */
const SchemeFields = ({ def, params, setParams, onBlurSave }) => {
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

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {fields.map((field) => {
        const isInt = field.type === "integer";
        const isNum = isInt || field.type === "number";

        return (
          <Grid item xs={12} md={6} key={field.name}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography
                sx={{
                  width: 210,
                  textAlign: "right",
                  fontWeight: 900,
                  fontStyle: "italic",
                }}
              >
                {field.label || labelFromKey(field.name)}
                {field.required ? " *" : ""}
              </Typography>

              <Box sx={{ flex: 1 }}>
                {isNum ? (
                  <NumericInput
                    name={field.name}
                    value={params?.[field.name] ?? ""}
                    integer={isInt}
                    min={field.minimum ?? 0}
                    step={isInt ? 1 : undefined}
                    onChange={(e) => {
                      const next = coerceNumber(e.target.value, field.type);
                      setParams((prev) => ({ ...(prev || {}), [field.name]: next }));
                    }}
                    onBlur={onBlurSave}
                  />
                ) : (
                  <TextInput
                    name={field.name}
                    value={params?.[field.name] ?? ""}
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
  );
};

export default SchemeFields;
