import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import FilterListIcon from "@mui/icons-material/FilterList";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import ExperimentsAPI from "../api/experiments";
import { AppButton } from "../components/index";
import {
  extractApiError,
  glassGreenButtonSx,
  labelFromKey,
  pageHeaderPillSx,
  quietGreenPillSx,
} from "../components/experiment-input/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHART_H = 180; // bar chart height in px

const CHART_COLORS = [
  "#278A21", "#0d47a1", "#e65100", "#6a1b9a",
  "#00838f", "#c62828", "#558b2f", "#37474f",
];

// KPI rows shown in the matrix, in the required order
const KPI_ROWS = [
  { key: "npv", label: "NPV",  format: "currency" },
  { key: "irr", label: "IRR",  format: "percent"  },
  { key: "roi", label: "ROI",  format: "percent"  },
  { key: "dpp", label: "DPP",  format: "years"    },
  { key: "pbp", label: "PBP",  format: "years"    },
];

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtVal(format, value) {
  if (value == null) return "—";
  const n = Number(value);
  if (!isFinite(n)) return "—";
  if (format === "percent")  return `${(n * 100).toFixed(2)}%`;
  if (format === "currency") return `€${Math.round(n).toLocaleString()}`;
  if (format === "years")    return `${n.toFixed(1)} yr`;
  return n.toFixed(2);
}

function fmtPct(value) {
  if (value == null) return "—";
  const n = Number(value);
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Data normalization
// Centralise all raw→display field mapping here so JSX stays clean.
// ---------------------------------------------------------------------------

function normalizeResults(items) {
  return (items || []).map((item) => ({
    schemeType:  item.scheme_type,
    schemeName:  labelFromKey(item.scheme_type),
    successProb: item.pr_npv_positive, // Pr(NPV > 0)
    p50: {
      irr: item.irr_p50, npv: item.npv_p50,
      roi: item.roi_p50, dpp: item.dpp_p50, pbp: item.pbp_p50,
    },
    p10: {
      irr: item.irr_p10, npv: item.npv_p10,
      roi: item.roi_p10, dpp: item.dpp_p10, pbp: item.pbp_p10,
    },
    p95: {
      irr: item.irr_p95, npv: item.npv_p95,
      roi: item.roi_p95, dpp: item.dpp_p95, pbp: item.pbp_p95,
    },
  }));
}

// ---------------------------------------------------------------------------
// SuccessChart — vertical CSS bars sorted ascending by Pr(NPV > 0)
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

// ---------------------------------------------------------------------------
// KpiCards — p50 summary cards for the best scheme
// ---------------------------------------------------------------------------

const KPI_CARD_DEFS = [
  { key: "irr", label: "IRR",               format: "percent"  },
  { key: "roi", label: "ROI",               format: "percent"  },
  { key: "pbp", label: "Payback Period",    format: "years"    },
  { key: "dpp", label: "Disc. Payback",     format: "years"    },
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

// ---------------------------------------------------------------------------
// KpiMatrix — comparison table with expand/collapse and scheme filter
// ---------------------------------------------------------------------------

const KpiMatrix = ({ schemes, colorMap }) => {
  const [expandedKpis, setExpandedKpis] = useState({});
  const [filterAnchor, setFilterAnchor]  = useState(null);

  // Derive initial set from scheme types; re-sync when schemes list changes
  const schemeKey = schemes.map((s) => s.schemeType).join(",");
  const [selectedTypes, setSelectedTypes] = useState(
    () => new Set(schemes.map((s) => s.schemeType)),
  );
  useEffect(() => {
    setSelectedTypes(new Set(schemes.map((s) => s.schemeType)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemeKey]);

  const visible = useMemo(
    () => schemes.filter((s) => selectedTypes.has(s.schemeType)),
    [schemes, selectedTypes],
  );

  const toggleKpi = (key) =>
    setExpandedKpis((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleType = (type) =>
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });

  return (
    <Box>
      {/* Filter button */}
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <IconButton
          size="small"
          onClick={(e) => setFilterAnchor(e.currentTarget)}
          sx={{ borderRadius: 2, gap: 0.5 }}
        >
          <FilterListIcon fontSize="small" />
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Filter</Typography>
        </IconButton>
        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
        >
          {schemes.map((s) => (
            <MenuItem key={s.schemeType} dense onClick={() => toggleType(s.schemeType)}>
              <Checkbox
                checked={selectedTypes.has(s.schemeType)}
                size="small"
                sx={{ p: 0.5, mr: 0.5, color: colorMap[s.schemeType] }}
              />
              {s.schemeName}
            </MenuItem>
          ))}
        </Menu>
      </Stack>

      {/* Matrix table */}
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, minWidth: 120, bgcolor: "grey.100" }}>KPI</TableCell>
              <TableCell sx={{ fontWeight: 800, minWidth: 110, bgcolor: "grey.100" }}>Scenario</TableCell>
              {visible.map((s) => (
                <TableCell
                  key={s.schemeType}
                  sx={{ fontWeight: 800, textAlign: "center", bgcolor: "grey.100", minWidth: 110 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        bgcolor: colorMap[s.schemeType],
                        borderRadius: "50%",
                        flexShrink: 0,
                      }}
                    />
                    <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{s.schemeName}</Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {KPI_ROWS.map(({ key, label, format }) => {
              const expanded = Boolean(expandedKpis[key]);
              return (
                <React.Fragment key={key}>
                  {/* p50 — default/median row */}
                  <TableRow sx={{ bgcolor: expanded ? alpha("#278A21", 0.03) : undefined }}>
                    <TableCell sx={{ fontWeight: 900, fontStyle: "italic" }}>
                      <Stack direction="row" alignItems="center" spacing={0.25}>
                        <IconButton size="small" onClick={() => toggleKpi(key)} sx={{ p: 0.25 }}>
                          {expanded
                            ? <ExpandLessIcon fontSize="small" />
                            : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                        <Typography sx={{ fontWeight: 900, fontStyle: "italic", fontSize: 14 }}>
                          {label}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>Median</TableCell>
                    {visible.map((s) => (
                      <TableCell key={s.schemeType} sx={{ textAlign: "center", fontWeight: 700 }}>
                        {fmtVal(format, s.p50?.[key])}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* p10 — worst */}
                  {expanded && (
                    <TableRow sx={{ bgcolor: alpha("#c62828", 0.025) }}>
                      <TableCell />
                      <TableCell sx={{ fontSize: 12, color: "error.light", fontStyle: "italic" }}>
                        Worst
                      </TableCell>
                      {visible.map((s) => (
                        <TableCell
                          key={s.schemeType}
                          sx={{ textAlign: "center", fontSize: 13, color: "text.secondary" }}
                        >
                          {fmtVal(format, s.p10?.[key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}

                  {/* p95 — best */}
                  {expanded && (
                    <TableRow sx={{ bgcolor: alpha("#278A21", 0.025) }}>
                      <TableCell />
                      <TableCell sx={{ fontSize: 12, color: "success.main", fontStyle: "italic" }}>
                        Best
                      </TableCell>
                      {visible.map((s) => (
                        <TableCell
                          key={s.schemeType}
                          sx={{ textAlign: "center", fontSize: 13, color: "text.secondary" }}
                        >
                          {fmtVal(format, s.p95?.[key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Help popover content — defined once, reused by SectionHeader instances
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
// SectionHeader — quiet green pill + optional info popover + optional subtitle
// ---------------------------------------------------------------------------

const SectionHeader = ({ children, helpContent, subtitle }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  return (
    <Box sx={{ mb: subtitle ? 1 : 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          component="span"
          sx={(theme) => ({ ...quietGreenPillSx(theme), display: "inline-flex" })}
        >
          <Typography sx={{ fontWeight: 800, fontStyle: "italic", fontSize: 16 }}>
            {children}
          </Typography>
        </Box>
        {helpContent && (
          <>
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                p: 0.25,
                color: "text.disabled",
                "&:hover": { color: "text.secondary", bgcolor: "transparent" },
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              PaperProps={{
                sx: {
                  borderRadius: 2.5,
                  p: 2,
                  maxWidth: 360,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
                },
              }}
            >
              {helpContent}
            </Popover>
          </>
        )}
      </Box>
      {subtitle && (
        <Typography
          sx={{ fontSize: 13, color: "text.disabled", fontStyle: "italic", mt: 0.75, mb: 1 }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

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

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
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

            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ExperimentOutput;
