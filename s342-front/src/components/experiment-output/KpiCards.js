import React from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { fmtVal } from "./outputHelpers";

// ---------------------------------------------------------------------------
// KpiCards — p50 summary cards for the best scheme
// ---------------------------------------------------------------------------

const KPI_CARD_DEFS = [
  { key: "irr", label: "IRR",            format: "percent" },
  { key: "roi", label: "ROI",            format: "percent" },
  { key: "pbp", label: "Payback Period", format: "years"   },
  { key: "dpp", label: "Disc. Payback",  format: "years"   },
];

const KpiCards = ({ scheme }) => {
  if (!scheme) return null;
  return (
    <Box>
      <Typography
        sx={{ fontWeight: 800, fontStyle: "italic", mb: 1.5, color: "text.secondary", fontSize: 14 }}
      >
        Best scheme:{" "}
        <Box component="span" sx={{ color: "success.main" }}>
          {scheme.schemeName}
        </Box>
      </Typography>
      <Grid container spacing={2}>
        {KPI_CARD_DEFS.map(({ key, label, format }) => (
          <Grid item xs={6} md={3} key={key}>
            <Paper
              elevation={0}
              sx={(theme) => ({
                p: 2,
                borderRadius: 3,
                textAlign: "center",
                border: "1px solid",
                borderColor: alpha(theme.palette.success.main, 0.22),
                background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.85)} 0%, ${alpha(
                  theme.palette.success.main,
                  0.06,
                )} 100%)`,
                boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.7)}, 0 6px 16px ${alpha(
                  theme.palette.common.black,
                  0.07,
                )}`,
              })}
            >
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 0.5 }}>
                {label}
              </Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 900, color: "success.main" }}>
                {fmtVal(format, scheme.p50?.[key])}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default KpiCards;
