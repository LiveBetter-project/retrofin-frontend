import React from "react";
import { Box, Typography } from "@mui/material";

import { CHART_H, fmtPct } from "./outputHelpers";

// ---------------------------------------------------------------------------
// SuccessChart - vertical CSS bars ordered by the parent-provided ranking
// ---------------------------------------------------------------------------

const SuccessChart = ({ data, colorMap }) => {
  const maxVal = Math.max(...data.map((d) => Number(d.successProb) || 0), 0.0001);

  return (
    <Box>
      {/* Bars */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          height: CHART_H + 28,
          borderBottom: "2px solid",
          borderColor: "divider",
          px: 2,
          gap: { xs: 1, md: 2 },
        }}
      >
        {data.map((d) => {
          const barPx = Math.max(4, Math.round(((Number(d.successProb) || 0) / maxVal) * CHART_H));
          return (
            <Box
              key={d.schemeType}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: "100%",
              }}
            >
              <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>
                {fmtPct(d.successProb)}
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  height: barPx,
                  bgcolor: colorMap[d.schemeType],
                  borderRadius: "4px 4px 0 0",
                }}
              />
            </Box>
          );
        })}
      </Box>

      {/* Legend */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: { xs: 1, md: 1.5 },
          mt: 2,
          justifyContent: "center",
        }}
      >
        {data.map((d) => (
          <Box key={d.schemeType} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                bgcolor: colorMap[d.schemeType],
                borderRadius: 0.5,
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: 13 }}>{d.schemeName}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SuccessChart;
