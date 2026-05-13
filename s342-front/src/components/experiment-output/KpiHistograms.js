import React, { useMemo } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const MAIN_HISTOGRAM_KEYS = ["IRR", "ROI", "PBP", "DPP"];
const CASHFLOW_HISTOGRAM_KEYS = ["NPV"];

const KPI_META = {
  NPV: { label: "NPV", type: "currency" },
  IRR: { label: "IRR", type: "percent" },
  ROI: { label: "ROI", type: "percent" },
  PBP: { label: "PBP", type: "years" },
  DPP: { label: "DPP", type: "years" },
};

const histogramOverlayPlugin = {
  id: "histogramOverlay",
  beforeDatasetsDraw(chart, _args, pluginOptions) {
    const { ctx, chartArea, scales } = chart;
    const xScale = scales.x;

    if (!ctx || !chartArea || !xScale || !pluginOptions) return;

    const drawLine = (value, color, dash = [], width = 1.5) => {
      if (!Number.isFinite(value)) return;
      const x = xScale.getPixelForValue(value);
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash(dash);
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
      ctx.restore();
    };

    const { p10, p50, p90, censorValue, projectLifetime } = pluginOptions;

    if (Number.isFinite(p10) && Number.isFinite(p90)) {
      const left = xScale.getPixelForValue(p10);
      const right = xScale.getPixelForValue(p90);
      ctx.save();
      ctx.fillStyle = alpha("#1565c0", 0.09);
      ctx.fillRect(left, chartArea.top, right - left, chartArea.bottom - chartArea.top);
      ctx.restore();
    }

    drawLine(p10, alpha("#1565c0", 0.9), [6, 4], 1.25);
    drawLine(p50, alpha("#1565c0", 1), [], 2);
    drawLine(p90, alpha("#1565c0", 0.9), [6, 4], 1.25);

    if (Number.isFinite(projectLifetime)) {
      drawLine(projectLifetime, alpha("#111111", 0.85), [], 1.5);
    }
    if (Number.isFinite(censorValue)) {
      drawLine(censorValue, alpha("#c62828", 0.95), [2, 4], 1.5);
    }
  },
};

const formatCurrency = (value) => {
  const n = Number(value);
  if (!isFinite(n)) return "0€";
  return `${Math.round(n).toLocaleString()}€`;
};

const formatCompactCurrency = (value) => {
  const n = Number(value);
  if (!isFinite(n)) return "0€";
  const abs = Math.abs(n);
  if (abs >= 1000000) return `${(n / 1000000).toFixed(1)}M€`;
  if (abs >= 1000) return `${(n / 1000).toFixed(1)}k€`;
  return `${Math.round(n)}€`;
};

const formatPercent = (value) => {
  const n = Number(value);
  if (!isFinite(n)) return "0%";
  return `${(n * 100).toFixed(1)}%`;
};

const formatCompactPercent = (value) => {
  const n = Number(value);
  if (!isFinite(n)) return "0%";
  return `${(n * 100).toFixed(0)}%`;
};

const formatYears = (value) => {
  const n = Number(value);
  if (!isFinite(n)) return "0 yr";
  return `${n.toFixed(1)} yr`;
};

const formatCompactYears = (value) => {
  const n = Number(value);
  if (!isFinite(n)) return "0";
  return `${n.toFixed(0)}`;
};

const formatValue = (type, value) => {
  if (type === "currency") return formatCurrency(value);
  if (type === "percent") return formatPercent(value);
  if (type === "years") return formatYears(value);
  return `${value}`;
};

const formatCompactValue = (type, value) => {
  if (type === "currency") return formatCompactCurrency(value);
  if (type === "percent") return formatCompactPercent(value);
  if (type === "years") return formatCompactYears(value);
  return `${value}`;
};

const isPaybackHistogram = (title) => title === "PBP" || title === "DPP";

const HistogramCard = ({ title, histogram, theme, compact = false }) => {
  const meta = KPI_META[title];
  const chartHeight = compact ? 205 : 250;

  const chartPayload = useMemo(() => {
    const edges = histogram?.bin_edges || [];
    const feasibleCounts = histogram?.feasible_counts || [];
    const infeasibleCounts = histogram?.infeasible_counts || [];

    if (edges.length < 2) return null;

    const centers = edges.slice(0, -1).map((edge, idx) => (edge + edges[idx + 1]) / 2);
    const barThickness = Math.max(4, Math.min(18, Math.floor(320 / Math.max(centers.length, 1))));

    return {
      datasets: [
        {
          label: "Feasible",
          data: centers.map((center, idx) => ({
            x: center,
            y: feasibleCounts[idx] || 0,
            rangeStart: edges[idx],
            rangeEnd: edges[idx + 1],
          })),
          backgroundColor: alpha(theme.palette.success.main, 0.82),
          borderColor: theme.palette.success.dark,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          stack: "counts",
          barThickness,
          maxBarThickness: 18,
        },
        {
          label: "Infeasible",
          data: centers.map((center, idx) => ({
            x: center,
            y: infeasibleCounts[idx] || 0,
            rangeStart: edges[idx],
            rangeEnd: edges[idx + 1],
          })),
          backgroundColor: alpha(theme.palette.error.main, 0.8),
          borderColor: theme.palette.error.dark,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          stack: "counts",
          barThickness,
          maxBarThickness: 18,
        },
      ],
    };
  }, [histogram, theme]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    parsing: false,
    plugins: {
      legend: {
        position: "top",
        align: "start",
        labels: {
          usePointStyle: true,
          pointStyle: "rectRounded",
          boxWidth: 10,
          boxHeight: 10,
          color: theme.palette.text.primary,
          font: {
            size: 11,
            weight: 700,
          },
        },
      },
      tooltip: {
        backgroundColor: alpha(theme.palette.common.black, 0.88),
        padding: 10,
        titleFont: {
          size: 12,
          weight: 800,
        },
        bodyFont: {
          size: 11,
          weight: 600,
        },
        callbacks: {
          title(items) {
            const raw = items[0]?.raw;
            if (!raw) return title;
            return `${title}: ${formatValue(meta.type, raw.rangeStart)} to ${formatValue(meta.type, raw.rangeEnd)}`;
          },
          label(context) {
            return `${context.dataset.label}: ${context.raw?.y ?? 0}`;
          },
        },
      },
      histogramOverlay: {
        p10: histogram?.p10,
        p50: histogram?.p50,
        p90: histogram?.p90,
        censorValue: isPaybackHistogram(title) ? null : histogram?.censor_value,
        projectLifetime: histogram?.project_lifetime,
      },
    },
    scales: {
      x: {
        type: "linear",
        stacked: true,
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          maxTicksLimit: 6,
          font: {
            size: 11,
            weight: 700,
          },
          callback: (value) => formatCompactValue(meta.type, value),
        },
      },
      y: {
        beginAtZero: true,
        stacked: true,
        grid: {
          color: alpha(theme.palette.text.primary, 0.08),
        },
        border: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          precision: 0,
          font: {
            size: 11,
            weight: 700,
          },
        },
        title: {
          display: true,
          text: "Frequency",
          color: theme.palette.text.secondary,
          font: {
            size: 11,
            weight: 700,
          },
        },
      },
    },
  }), [histogram, meta.type, theme, title]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? 1.5 : 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(theme.palette.common.black, 0.08),
        backgroundColor: alpha(theme.palette.common.white, 0.55),
      }}
    >
      <Typography sx={{ fontWeight: 900, fontSize: compact ? 15 : 16, mb: 0.5 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 12, color: "text.secondary", mb: compact ? 1 : 1.5 }}>
        P10-P90 band with P50 marker.
      </Typography>

      {chartPayload ? (
        <Box sx={{ height: chartHeight }}>
          <Bar data={chartPayload} options={options} plugins={[histogramOverlayPlugin]} />
        </Box>
      ) : (
        <Box sx={{ height: chartHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography sx={{ color: "text.disabled", fontWeight: 700, fontStyle: "italic" }}>
            No histogram data available.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

const SuccessProbabilitiesCard = ({ scheme, theme, compact = false }) => {
  const lifetime = scheme?.kpiHistograms?.PBP?.project_lifetime;
  const legendSpacerHeight = compact ? 38 : 44;
  const chartHeight = compact ? 167 : 206;

  const labels = [
    "Pr(NPV > 0)",
    `Pr(PBP < ${lifetime ?? "T"}y)`,
    `Pr(DPP < ${lifetime ?? "T"}y)`,
  ];

  const data = {
    labels,
    datasets: [
      {
        label: "Probability",
        data: [
          scheme?.probabilities?.npvPositive ?? 0,
          scheme?.probabilities?.pbpWithinLifetime ?? 0,
          scheme?.probabilities?.dppWithinLifetime ?? 0,
        ],
        backgroundColor: [
          alpha("#4169e1", 0.9),
          alpha("#1e88e5", 0.9),
          alpha("#0d47a1", 0.9),
        ],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: alpha(theme.palette.common.black, 0.88),
        callbacks: {
          label: (context) => formatPercent(context.raw),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            size: 11,
            weight: 700,
          },
        },
      },
      y: {
        min: 0,
        max: 1,
        grid: {
          color: alpha(theme.palette.text.primary, 0.08),
        },
        border: { display: false },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value) => formatPercent(value),
          font: {
            size: 11,
            weight: 700,
          },
        },
      },
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? 1.5 : 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(theme.palette.common.black, 0.08),
        backgroundColor: alpha(theme.palette.common.white, 0.55),
      }}
    >
      <Typography sx={{ fontWeight: 900, fontSize: compact ? 15 : 16, mb: 0.5 }}>
        Success Probabilities
      </Typography>
      <Typography sx={{ fontSize: 12, color: "text.secondary", mb: compact ? 1 : 1.5 }}>
        Probability of clearing the key thresholds.
      </Typography>
      <Box aria-hidden sx={{ height: legendSpacerHeight }} />
      <Box sx={{ height: chartHeight }}>
        <Bar data={data} options={options} />
      </Box>
    </Paper>
  );
};

const KpiHistograms = ({
  schemes = [],
  colorMap = {},
  selectedScheme = null,
  onSelectScheme = () => {},
}) => {
  const theme = useTheme();

  const activeScheme = useMemo(() => {
    if (!schemes.length) return null;
    return schemes.find((scheme) => scheme.schemeType === selectedScheme) ?? schemes[0];
  }, [schemes, selectedScheme]);

  if (!schemes.length) return null;

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {schemes.map((scheme) => {
          const isActive = scheme.schemeType === activeScheme?.schemeType;
          return (
            <Button
              key={scheme.schemeType}
              variant={isActive ? "contained" : "outlined"}
              onClick={() => onSelectScheme(scheme.schemeType)}
              sx={{
                borderRadius: 999,
                px: 1.75,
                py: 0.75,
                fontWeight: 800,
                textTransform: "none",
                color: isActive ? theme.palette.common.white : theme.palette.text.primary,
                borderColor: alpha(colorMap[scheme.schemeType] || theme.palette.success.main, 0.45),
                backgroundColor: isActive
                  ? colorMap[scheme.schemeType] || theme.palette.success.main
                  : alpha(theme.palette.common.white, 0.58),
              }}
            >
              {scheme.schemeName}
            </Button>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "repeat(2, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        {MAIN_HISTOGRAM_KEYS.map((key) => (
          <HistogramCard
            key={key}
            title={KPI_META[key].label}
            histogram={activeScheme?.kpiHistograms?.[key]}
            theme={theme}
            compact
          />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "repeat(2, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        {CASHFLOW_HISTOGRAM_KEYS.map((key) => (
          <HistogramCard
            key={key}
            title={KPI_META[key].label}
            histogram={activeScheme?.kpiHistograms?.[key]}
            theme={theme}
          />
        ))}


        <SuccessProbabilitiesCard scheme={activeScheme} theme={theme} compact />
      </Box>
    </Stack>
  );
};

export default KpiHistograms;
