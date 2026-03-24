import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import ExperimentsAPI from "../api/experiments";
import { AppButton } from "../components/index";
import {
  extractApiError,
  glassGreenButtonSx,
  pageHeaderPillSx,
} from "../components/experiment-input/constants";
import { CHART_COLORS, normalizeResults } from "../components/experiment-output/outputHelpers";
import KpiCards from "../components/experiment-output/KpiCards";
import KpiMatrix from "../components/experiment-output/KpiMatrix";
import SectionHeader from "../components/experiment-output/SectionHeader";
import SuccessChart from "../components/experiment-output/SuccessChart";

// ---------------------------------------------------------------------------
// Help popover content — page-specific JSX, passed as props to SectionHeader
// ---------------------------------------------------------------------------

const SUCCESS_HELP = (
  <Box>
    <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 1 }}>Success Probability</Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 0.75 }}>
      <strong>Success</strong> = share of simulation outcomes where NPV &gt; 0.
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 0.75 }}>
      Bars show that success share per financing scheme.
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 700, mb: 0.5 }}>
      Scenario labels:
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 0.25 }}>
      • <strong>Median</strong>: typical outcome (p50 percentile).
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 0.25 }}>
      • <strong>Worst</strong>: pessimistic scenario (p10 percentile).
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 0.75 }}>
      • <strong>Best</strong>: optimistic scenario (p95 percentile).
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
      KPI cards show median values for the best-performing scheme.
    </Typography>
  </Box>
);

const APPROVAL_HELP = (
  <Box>
    <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 1 }}>Probabilities of Approval</Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 700, mb: 0.5 }}>
      Scenario labels:
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 0.25 }}>
      • <strong>Median</strong>: typical outcome (p50 percentile).
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 0.25 }}>
      • <strong>Worst</strong>: pessimistic scenario (p10 percentile).
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1 }}>
      • <strong>Best</strong>: optimistic scenario (p95 percentile).
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 700, mb: 0.5 }}>
      KPI definitions:
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 0.25 }}>
      • <strong>NPV</strong>: Net Present Value
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 0.25 }}>
      • <strong>IRR</strong>: Internal Rate of Return
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 0.25 }}>
      • <strong>ROI</strong>: Return on Investment
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 0.25 }}>
      • <strong>DPP</strong>: Discounted Payback Period
    </Typography>
    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
      • <strong>PBP</strong>: Payback Period
    </Typography>
  </Box>
);

// ---------------------------------------------------------------------------
// ExperimentOutput — main page
// ---------------------------------------------------------------------------

const ExperimentOutput = () => {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const experimentId    = searchParams.get("id");

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [experiment, setExperiment] = useState(null);
  const [results,    setResults]    = useState([]); // normalised

  useEffect(() => {
    if (!experimentId) {
      setError("No experiment ID provided.");
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [exp, res] = await Promise.all([
          ExperimentsAPI.get(experimentId),
          ExperimentsAPI.getResults(experimentId),
        ]);
        if (!mounted) return;
        setExperiment(exp);
        setResults(normalizeResults(res.items));
      } catch (err) {
        if (!mounted) return;
        const { msg } = extractApiError(err, "Failed to load experiment results.");
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [experimentId]);

  // Assign stable colors per scheme based on original (API) order
  const colorMap = useMemo(
    () => Object.fromEntries(
      results.map((s, i) => [s.schemeType, CHART_COLORS[i % CHART_COLORS.length]])
    ),
    [results],
  );

  // Sort ascending by successProb for the chart
  const sortedForChart = useMemo(
    () => [...results].sort((a, b) => (a.successProb ?? 0) - (b.successProb ?? 0)),
    [results],
  );

  // Best scheme = highest successProb (last in sorted list)
  const bestScheme = sortedForChart.length
    ? sortedForChart[sortedForChart.length - 1]
    : null;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ borderRadius: 2, p: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ borderRadius: 2, p: { xs: 2, md: 3 } }}>

      {/* ── Header row (CSS grid for true center) ── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        {/* Left: experiment name */}
        <Typography
          title={experiment?.name}
          sx={{
            fontWeight: 800,
            fontStyle: "italic",
            color: "text.secondary",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {experiment?.name ?? ""}
        </Typography>

        {/* Center: "Experiment Results" pill */}
        <Box sx={pageHeaderPillSx}>
          <Stack direction="row" spacing={0.75} alignItems="baseline">
            <Typography
              sx={{ color: "success.main", fontWeight: 900, fontStyle: "italic", fontSize: 26 }}
            >
              Experiment
            </Typography>
            <Typography
              sx={{ color: "text.primary", fontWeight: 900, fontStyle: "italic", fontSize: 26 }}
            >
              Results
            </Typography>
          </Stack>
        </Box>

        {/* Right: Save button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <AppButton
            fullWidth={false}
            variant="contained"
            onClick={() => navigate("/")}
            sx={glassGreenButtonSx}
          >
            Save Experiment
          </AppButton>
        </Box>
      </Box>

      {/* ── Pink frame (matches ExperimentInput) ── */}
      <Box
        sx={(theme) => ({
          position: "relative",
          p: "4px",
          borderRadius: 4,
          backgroundColor: theme.palette.secondary.main,
          boxShadow: "0 22px 60px rgba(0,0,0,0.14)",
          overflow: "hidden",
        })}
      >
        <Box
          sx={(theme) => ({
            borderRadius: 3.5,
            p: { xs: 2, md: 4 },
            backgroundColor: theme.palette.grey[200],
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
          })}
        >
          {results.length === 0 ? (
            <Typography
              sx={{
                textAlign: "center",
                color: "text.secondary",
                py: 8,
                fontWeight: 700,
                fontStyle: "italic",
              }}
            >
              No results available for this experiment.
            </Typography>
          ) : (
            <Stack spacing={5}>

              {/* ── Section 1: Success Probability ── */}
              <Box>
                <SectionHeader
                  helpContent={SUCCESS_HELP}
                  subtitle="Success = share of simulation outcomes where NPV is positive. KPI cards show median values for the best scheme."
                >
                  Success Probability
                </SectionHeader>
                <SuccessChart data={sortedForChart} colorMap={colorMap} />
                {bestScheme && (
                  <Box sx={{ mt: 3 }}>
                    <KpiCards scheme={bestScheme} />
                  </Box>
                )}
              </Box>

              {/* ── Section 2: Probabilities of Approval ── */}
              <Box>
                <SectionHeader
                  helpContent={APPROVAL_HELP}
                  subtitle="Median is the typical outcome. Worst and Best show pessimistic and optimistic ranges."
                >
                  Probabilities of Approval
                </SectionHeader>
                <KpiMatrix schemes={results} colorMap={colorMap} />
              </Box>

              {/* ── Section 3: Graph (placeholder) ── */}
              <Box>
                <SectionHeader>Graph</SectionHeader>
                <Paper
                  elevation={0}
                  sx={(theme) => ({
                    borderRadius: 3,
                    border: "1px dashed",
                    borderColor: alpha(theme.palette.common.black, 0.12),
                    background: alpha(theme.palette.common.white, 0.5),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 180,
                  })}
                >
                  <Typography sx={{ color: "text.disabled", fontWeight: 700, fontStyle: "italic" }}>
                    Coming soon
                  </Typography>
                </Paper>
              </Box>

              {/* ── Section 4: Cashflows (placeholder) ── */}
              <Box>
                <SectionHeader>Cashflows</SectionHeader>
                <Paper
                  elevation={0}
                  sx={(theme) => ({
                    borderRadius: 3,
                    border: "1px dashed",
                    borderColor: alpha(theme.palette.common.black, 0.12),
                    background: alpha(theme.palette.common.white, 0.5),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 180,
                  })}
                >
                  <Typography sx={{ color: "text.disabled", fontWeight: 700, fontStyle: "italic" }}>
                    Coming soon
                  </Typography>
                </Paper>
              </Box>

            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ExperimentOutput;
