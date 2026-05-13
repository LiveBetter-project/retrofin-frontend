import React, { useMemo } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

const POSITIVE_COLOR = "#2e7d32";
const NEGATIVE_COLOR = "#c62828";

const formatCurrency = (value) => {
  const n = Number(value);
  if (!isFinite(n)) return "€";
  return `${Math.round(n).toLocaleString()}€`;
};

const formatCompactCurrency = (value) => {
  const n = Number(value);
  if (!isFinite(n)) return "€";

  const abs = Math.abs(n);
  if (abs >= 1000000) return `${(n / 1000000).toFixed(1)}M€`;
  if (abs >= 1000) return `${(n / 1000).toFixed(1)}k€`;
  return `${Math.round(n)}€`;
};

const CashFlows = ({
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

  const chartData = useMemo(() => activeScheme?.cashflows ?? [], [activeScheme]);

  const maxAbsValue = useMemo(() => {
    const values = chartData.flatMap((item) => [
      Math.abs(Number(item.inflow) || 0),
      Math.abs(Number(item.outflow) || 0),
    ]);
    return Math.max(...values, 1);
  }, [chartData]);

  const data = useMemo(() => {
    const labels = chartData.map((item) => `Y${item.year}`);
    const inflows = chartData.map((item) => Number(item.inflow) || 0);
    const outflows = chartData.map((item) => -(Number(item.outflow) || 0));

    return {
      labels,
      datasets: [
        {
          label: "Inflows",
          data: inflows,
          backgroundColor: alpha(POSITIVE_COLOR, 0.9),
          borderColor: POSITIVE_COLOR,
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
          barPercentage: 0.82,
          categoryPercentage: 0.72,
        },
        {
          label: "Outflows",
          data: outflows,
          backgroundColor: alpha(NEGATIVE_COLOR, 0.9),
          borderColor: NEGATIVE_COLOR,
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
          barPercentage: 0.82,
          categoryPercentage: 0.72,
        },
      ],
    };
  }, [chartData]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
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
            size: 12,
            weight: 700,
          },
        },
      },
      tooltip: {
        backgroundColor: alpha(theme.palette.common.black, 0.88),
        padding: 12,
        titleFont: {
          size: 13,
          weight: 800,
        },
        bodyFont: {
          size: 12,
          weight: 600,
        },
        displayColors: true,
        callbacks: {
          label(context) {
            const value = Number(context.raw) || 0;
            return `${context.dataset.label}: ${formatCurrency(Math.abs(value))}`;
          },
          afterBody(items) {
            const inflow = Number(items.find((item) => item.dataset.label === "Inflows")?.raw) || 0;
            const outflow = Math.abs(Number(items.find((item) => item.dataset.label === "Outflows")?.raw) || 0);
            return `Net: ${formatCurrency(inflow - outflow)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            size: 12,
            weight: 700,
          },
        },
      },
      y: {
        min: -maxAbsValue * 1.18,
        max: maxAbsValue * 1.18,
        grid: {
          color: (context) => (
            context.tick.value === 0
              ? alpha(theme.palette.text.primary, 0.28)
              : alpha(theme.palette.text.primary, 0.08)
          ),
          lineWidth: (context) => (context.tick.value === 0 ? 2 : 1),
        },
        border: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            size: 11,
            weight: 700,
          },
          callback: (value) => formatCompactCurrency(value),
        },
      },
    },
  }), [maxAbsValue, theme]);

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

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          p: { xs: 2, md: 3 },
          border: "1px solid",
          borderColor: alpha(theme.palette.common.black, 0.08),
          background: `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.82)} 0%, ${alpha(
            theme.palette.success.main,
            0.05,
          )} 100%)`,
          boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.7)}`,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 22 }}>
              {activeScheme?.schemeName}
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
              Hover the chart to inspect yearly inflows, outflows, and net cashflow.
            </Typography>
          </Box>

          <Box
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: 2.5,
              backgroundColor: alpha(theme.palette.common.white, 0.66),
              border: "1px solid",
              borderColor: alpha(theme.palette.common.black, 0.08),
            }}
          >
            <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 700 }}>
              Total repayment (p50)
            </Typography>
            <Typography sx={{ fontSize: 20, fontWeight: 900, color: theme.palette.text.primary }}>
              {formatCurrency(activeScheme?.totalRepayment?.p50)}
            </Typography>
          </Box>
        </Stack>

        {chartData.length === 0 ? (
          <Box
            sx={{
              minHeight: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ color: "text.disabled", fontWeight: 700, fontStyle: "italic" }}>
              No cashflow data available yet.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              height: { xs: 340, md: 420 },
              p: { xs: 1, md: 1.5 },
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.common.white, 0.42),
            }}
          >
            <Bar data={data} options={options} />
          </Box>
        )}
      </Paper>
    </Stack>
  );
};

export default CashFlows;
