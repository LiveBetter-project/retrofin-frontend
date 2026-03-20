import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import ExperimentsAPI from "../api/experiments";
import { AppButton } from "../components";
import BuildingsTab from "../components/experiment-input/BuildingsTab";
import FinancingTab from "../components/experiment-input/FinancingTab";
import SchemeInfoBox from "../components/experiment-input/SchemeInfoBox";
import {
  extractApiError,
  glassGhostButtonSx,
  glassGreenButtonSx,
  glassTabPillSx,
} from "../components/experiment-input/constants";

// ---------------------------------------------------------------------------
// ExperimentInput
//
// Coordinator component: owns tab state, readiness, run lifecycle, page-level
// errors. Buildings and financing concerns are fully delegated to child tabs.
//
// URL: /experiments/input?id=<experimentId>
// ---------------------------------------------------------------------------
const ExperimentInput = () => {
  const [searchParams] = useSearchParams();
  const experimentId = searchParams.get("id");
  const navigate = useNavigate();

  const [tab, setTab] = useState("buildings");
  // Lazy-mount pattern: once a tab is added it stays mounted (hidden via display:none)
  const [mountedTabs, setMountedTabs] = useState(() => new Set(["buildings"]));

  const [coreLoading, setCoreLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [experiment, setExperiment] = useState(null);

  // Track child state for local readiness + equity
  const [buildings, setBuildings] = useState([]);
  const [fsItems, setFsItems] = useState([]);

  const [runLoading, setRunLoading] = useState(false);

  // Equity dialog (confirmation before adding equity)
  const [equityDialogOpen, setEquityDialogOpen] = useState(false);
  const [equityActionLoading, setEquityActionLoading] = useState(false);

  // Ref to FinancingTab imperative handle
  const financingTabRef = useRef(null);

  // ── Load experiment metadata on mount ────────────────────────────────
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
        const exp = await ExperimentsAPI.get(experimentId);
        if (!mounted) return;
        setExperiment(exp || null);
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
  // No-op: readiness is now computed locally from buildings + fsItems.
  // Keep the call signature so child tabs don't need changes.
  const refreshReadiness = async () => {};

  // ── Local readiness: >= 1 building AND >= 1 selected scheme ──────────
  const isReady = buildings.length >= 1 && fsItems.length >= 1;
  const hasEquity = fsItems.some((x) => x.scheme_key === "equity");

  // ── Tab switch ────────────────────────────────────────────────────────
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

  // ── Equity checkbox logic ─────────────────────────────────────────────
  const handleEquityToggle = () => {
    if (hasEquity) {
      // Uncheck: remove the equity scheme
      setEquityActionLoading(true);
      Promise.resolve(financingTabRef.current?.removeEquity()).finally(() =>
        setEquityActionLoading(false),
      );
    } else {
      // Check: open confirmation dialog (equity clears all other schemes)
      setEquityDialogOpen(true);
    }
  };

  const handleEquityConfirm = async () => {
    setEquityDialogOpen(false);
    setEquityActionLoading(true);
    try {
      await financingTabRef.current?.addEquity();
    } finally {
      setEquityActionLoading(false);
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

      {/* EQUITY CHECKBOX — shown below Run button when on financing tab */}
      {tab === "financing" && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          <Paper
            elevation={0}
            sx={(theme) => ({
              display: "inline-flex",
              alignItems: "center",
              px: 2,
              py: 0.75,
              borderRadius: "999px",
              border: "1px solid",
              borderColor: hasEquity
                ? alpha(theme.palette.success.main, 0.4)
                : alpha(theme.palette.common.white, 0.55),
              background: hasEquity
                ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${alpha(theme.palette.success.light, 0.08)} 100%)`
                : `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.72)} 0%, ${alpha(theme.palette.grey[100], 0.5)} 100%)`,
              backdropFilter: "blur(14px)",
              boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.6)}, 0 6px 16px ${alpha(theme.palette.common.black, 0.07)}`,
            })}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={hasEquity}
                  onChange={handleEquityToggle}
                  disabled={equityActionLoading || runLoading}
                  size="small"
                  sx={{ color: "success.main", "&.Mui-checked": { color: "success.main" } }}
                />
              }
              label={
                <Typography sx={{ fontWeight: 800, fontStyle: "italic", fontSize: 14 }}>
                  Equity (Self-Financing)
                </Typography>
              }
              sx={{ m: 0 }}
            />
          </Paper>
        </Box>
      )}

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

        <Box onClick={() => switchTab("financing")} sx={glassTabPillSx(tab === "financing")}>
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
          {mountedTabs.has("buildings") && (
            <Box sx={{ display: tab === "buildings" ? undefined : "none" }}>
              <BuildingsTab
                experimentId={experimentId}
                onReadinessRefresh={refreshReadiness}
                onPageError={setPageError}
                onBuildingsChange={setBuildings}
              />
            </Box>
          )}

          {mountedTabs.has("financing") && (
            <Box sx={{ display: tab === "financing" ? undefined : "none" }}>
              <FinancingTab
                ref={financingTabRef}
                experimentId={experimentId}
                buildings={buildings}
                onReadinessRefresh={refreshReadiness}
                onPageError={setPageError}
                onSchemesChange={setFsItems}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* EQUITY CONFIRMATION DIALOG */}
      <Dialog
        open={equityDialogOpen}
        onClose={() => setEquityDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: (theme) => ({
            borderRadius: 3,
            background: theme.palette.common.white,
            boxShadow: `0 24px 60px ${alpha(theme.palette.common.black, 0.18)}`,
          }),
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontStyle: "italic" }}>
          Switch to Equity (Self-Financing)?
        </DialogTitle>
        <DialogContent>
          <SchemeInfoBox schemeKey="equity" compact={false} />
          {fsItems.filter((x) => x.scheme_key !== "equity").length > 0 && (
            <Typography sx={{ mt: 1.5, fontSize: 14, color: "warning.dark", fontWeight: 700 }}>
              ⚠ Selecting equity will remove the{" "}
              {fsItems.filter((x) => x.scheme_key !== "equity").length} other financing scheme
              {fsItems.filter((x) => x.scheme_key !== "equity").length !== 1 ? "s" : ""} currently
              added to this experiment. Equity is mutually exclusive with all other schemes.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setEquityDialogOpen(false)}
            sx={glassGhostButtonSx}
          >
            Cancel
          </Button>
          <Button onClick={handleEquityConfirm} sx={glassGreenButtonSx}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExperimentInput;
