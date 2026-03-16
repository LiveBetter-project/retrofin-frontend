import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import ExperimentsAPI from "../api/experiments";
import { AppButton } from "../components";
import BuildingsTab from "../components/experiment-input/BuildingsTab";
import FinancingTab from "../components/experiment-input/FinancingTab";
import {
  extractApiError,
  glassGreenButtonSx,
  glassTabPillSx,
} from "../components/experiment-input/constants";

// ---------------------------------------------------------------------------
// ExperimentInput
//
// Coordinator component: owns only cross-cutting concerns (tab state, readiness,
// run lifecycle, page-level errors). Buildings and financing concerns are fully
// delegated to BuildingsTab and FinancingTab respectively.
//
// URL: /experiments/input?id=<experimentId>
// ---------------------------------------------------------------------------
const ExperimentInput = () => {
  const [searchParams] = useSearchParams();
  const experimentId = searchParams.get("id");
  const navigate = useNavigate();

  const [tab, setTab] = useState("buildings");
  // Lazy-mount pattern: once a tab is added to this set it stays mounted
  // (hidden via display:none) so its local state is preserved on tab switches.
  const [mountedTabs, setMountedTabs] = useState(() => new Set(["buildings"]));

  const [coreLoading, setCoreLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [experiment, setExperiment] = useState(null);

  // Readiness drives the Run button
  const [readiness, setReadiness] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);

  // ── Load experiment metadata + readiness on mount ─────────────────────
  useEffect(() => {
    if (!experimentId) {
      setPageError("No experiment ID provided.");
      setCoreLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      setCoreLoading(true);
      setPageError("");
      try {
        const [exp, ready] = await Promise.all([
          ExperimentsAPI.get(experimentId),
          ExperimentsAPI.getReadiness(experimentId),
        ]);
        if (!mounted) return;
        setExperiment(exp || null);
        setReadiness(ready || null);
      } catch (err) {
        if (!mounted) return;
        const { msg } = extractApiError(err, "Failed to load experiment.");
        setPageError(msg);
      } finally {
        if (mounted) setCoreLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [experimentId]);

  // ── Readiness refresh (called by child tabs after data mutations) ──────
  const refreshReadiness = async () => {
    if (!experimentId) return;
    setReadinessLoading(true);
    try {
      const r = await ExperimentsAPI.getReadiness(experimentId);
      setReadiness(r || null);
    } catch {
      // non-fatal
    } finally {
      setReadinessLoading(false);
    }
  };

  // ── Tab switch: ensure the target tab component is mounted ────────────
  const switchTab = (newTab) => {
    setTab(newTab);
    setMountedTabs((prev) => {
      const s = new Set(prev);
      s.add(newTab);
      return s;
    });
  };

  const goNext = () => switchTab("financing");
  const goPrevious = () => switchTab("buildings");

  // ── Run ────────────────────────────────────────────────────────────────
  const isReady = Boolean(readiness?.is_ready);

  const onRun = async () => {
    setRunLoading(true);
    setPageError("");
    try {
      await ExperimentsAPI.run(experimentId);
      navigate(`/experiments/output?id=${experimentId}`);
    } catch (err) {
      const { msg } = extractApiError(err, "Failed to start run.");
      setPageError(msg);
    } finally {
      setRunLoading(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────
  if (coreLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ borderRadius: 2, p: { xs: 2, md: 3 } }}>

      {/* TOP BAR */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box sx={{ width: 220 }}>
          {tab === "financing" && (
            <AppButton
              fullWidth={false}
              variant="contained"
              onClick={goPrevious}
              startIcon={<ArrowBackIosNewRoundedIcon />}
              sx={glassGreenButtonSx}
            >
              Previous
            </AppButton>
          )}
        </Box>

        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "999px",
            px: 4,
            py: 1.1,
            border: "2px solid",
            borderColor: "secondary.main",
            bgcolor: "common.white",
            boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
            cursor: "default",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          <Stack direction="row" spacing={0.75} alignItems="baseline">
            <Typography
              sx={{ color: "success.main", fontWeight: 900, fontStyle: "italic", fontSize: 26 }}
            >
              New
            </Typography>
            <Typography
              sx={{ color: "text.primary", fontWeight: 900, fontStyle: "italic", fontSize: 26 }}
            >
              Experiment
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ width: 220, display: "flex", justifyContent: "flex-end" }}>
          {tab === "buildings" ? (
            <AppButton
              fullWidth={false}
              variant="contained"
              onClick={goNext}
              endIcon={<ArrowForwardIosRoundedIcon />}
              sx={glassGreenButtonSx}
            >
              Next
            </AppButton>
          ) : (
            <AppButton
              fullWidth={false}
              variant="contained"
              onClick={onRun}
              loading={runLoading}
              disabled={!isReady || runLoading}
              endIcon={!runLoading ? <PlayArrowIcon /> : undefined}
              sx={glassGreenButtonSx}
            >
              Run
            </AppButton>
          )}
        </Box>
      </Stack>

      {/* TAB PILLS */}
      <Stack
        direction="row"
        justifyContent="center"
        spacing={2}
        flexWrap="wrap"
        sx={{ mb: 3 }}
      >
        <Box onClick={() => switchTab("buildings")} sx={glassTabPillSx(tab === "buildings")}>
          <Typography
            sx={{
              fontWeight: 800,
              fontStyle: "italic",
              color: tab === "buildings" ? "text.primary" : "text.secondary",
            }}
          >
            Add Buildings
          </Typography>
        </Box>

        <Box
          onClick={() => {
            switchTab("financing");
          }}
          sx={glassTabPillSx(tab === "financing")}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontStyle: "italic",
              color: tab === "financing" ? "text.primary" : "text.secondary",
            }}
          >
            Add Financing Schemes
          </Typography>
        </Box>
      </Stack>

      {/* PAGE-LEVEL ERROR */}
      {pageError && (
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: 2,
            mb: 2,
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: `rgba(${theme.palette.error.main}, 0.18)`,
            background: `linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(240,49,87,0.06) 100%)`,
            backdropFilter: "blur(14px)",
          })}
        >
          <Typography sx={{ color: "error.main", fontWeight: 900 }}>
            {pageError}
          </Typography>
        </Paper>
      )}

      {/* PINK FRAME */}
      <Box
        sx={(theme) => ({
          position: "relative",
          p: { xs: 1.2, md: 0.5 },
          borderRadius: 4,
          backgroundColor: theme.palette.secondary.main,
          boxShadow: `0 22px 60px rgba(0,0,0,0.14)`,
          overflow: "hidden",
        })}
      >
        <Box
          sx={(theme) => ({
            borderRadius: 3.5,
            p: { xs: 2, md: 4 },
            backgroundColor: theme.palette.grey[200],
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35)`,
          })}
        >
          {/* Buildings tab — lazy-mounted, hidden when inactive */}
          {mountedTabs.has("buildings") && (
            <Box sx={{ display: tab === "buildings" ? undefined : "none" }}>
              <BuildingsTab
                experimentId={experimentId}
                onReadinessRefresh={refreshReadiness}
                onPageError={setPageError}
              />
            </Box>
          )}

          {/* Financing tab — lazy-mounted on first visit, hidden when inactive */}
          {mountedTabs.has("financing") && (
            <Box sx={{ display: tab === "financing" ? undefined : "none" }}>
              <FinancingTab
                experimentId={experimentId}
                onReadinessRefresh={refreshReadiness}
                onPageError={setPageError}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ExperimentInput;
