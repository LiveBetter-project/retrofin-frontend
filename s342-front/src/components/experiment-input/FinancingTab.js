import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grow,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import ExperimentsAPI from "../../api/experiments";
import { AppButton } from "../index";
import {
  SCHEME_DEFAULTS,
  SCHEME_SECTIONS,
  extractApiError,
  glassDeleteIconButtonSx,
  glassGhostButtonSx,
  glassGreenButtonSx,
  glassPanelSx,
  glassTitlePillSx,
  paramsEqual,
} from "./constants";
import SchemeInfoBox from "./SchemeInfoBox";
import SchemeFields from "./SchemeFields";

/**
 * Financing tab — owns all financing-scheme state and API calls.
 *
 * Props:
 *   experimentId       — current experiment ID
 *   onReadinessRefresh — call after any add/remove/save to refresh readiness
 *   onPageError        — surface fatal API errors to the page level
 */
const FinancingTab = ({ experimentId, onReadinessRefresh, onPageError }) => {
  const [loading, setLoading] = useState(true);

  // Catalog (scheme type definitions)
  const [catalog, setCatalog] = useState([]);
  // Added scheme instances
  const [fsItems, setFsItems] = useState([]);
  // Cached field definitions per scheme key
  const [defsByKey, setDefsByKey] = useState({});
  // Editable draft params per scheme instance id
  const [fsDraftById, setFsDraftById] = useState({});
  // Last-saved params per scheme instance id (for dirty detection)
  const [savedParamsById, setSavedParamsById] = useState({});
  // Per-instance save loading + error state
  const [fsSaveById, setFsSaveById] = useState({});
  const [fsErrorById, setFsErrorById] = useState({});
  // Busy id while removing a scheme
  const [fsBusyId, setFsBusyId] = useState(null);
  // Picker add state
  const [addSchemeLoading, setAddSchemeLoading] = useState(false);
  const [addSchemeError, setAddSchemeError] = useState("");
  // Equity confirmation dialog
  const [equityConfirmOpen, setEquityConfirmOpen] = useState(false);
  // Auto-scroll to newly added scheme
  const [scrollToId, setScrollToId] = useState(null);
  const schemeBlockRefs = useRef({});
  // Entry animation
  const [animateSchemeRows, setAnimateSchemeRows] = useState(false);

  // ── Initial load ──────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [cat, selected] = await Promise.all([
          ExperimentsAPI.listFinancingSchemeCatalog(),
          ExperimentsAPI.listExperimentFinancingSchemes(experimentId),
        ]);
        if (!mounted) return;
        setCatalog(Array.isArray(cat) ? cat : []);
        const items = Array.isArray(selected) ? selected : [];
        setFsItems(items);

        // Seed saved params from server data
        const saved = {};
        items.forEach((fs) => { saved[fs.id] = fs.params ?? {}; });
        setSavedParamsById(saved);
      } catch (err) {
        if (!mounted) return;
        const { msg } = extractApiError(err, "Failed to load financing schemes.");
        onPageError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentId]);

  // ── Load field definitions for all loaded scheme instances ────────────
  useEffect(() => {
    const keys = Array.from(
      new Set((fsItems || []).map((x) => x.scheme_key).filter(Boolean)),
    );
    if (!keys.length) return;

    let mounted = true;
    (async () => {
      try {
        await Promise.all(keys.map((k) => ensureDef(k)));
        if (!mounted) return;
        // Populate drafts for newly loaded items (that don't have a draft yet)
        setFsDraftById((prev) => {
          const next = { ...(prev || {}) };
          (fsItems || []).forEach((fs) => {
            if (!fs?.id) return;
            if (next[fs.id] === undefined) next[fs.id] = fs.params || {};
          });
          return next;
        });
      } catch {
        // non-fatal
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fsItems]);

  // ── Entry animation ───────────────────────────────────────────────────
  useEffect(() => {
    if (!loading) {
      const frame = requestAnimationFrame(() => setAnimateSchemeRows(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [loading]);

  // ── Scroll to newly added scheme ──────────────────────────────────────
  useEffect(() => {
    if (!scrollToId || !schemeBlockRefs.current[scrollToId]) return;
    schemeBlockRefs.current[scrollToId].scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
    setScrollToId(null);
  }, [scrollToId, fsItems]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const catalogOptions = useMemo(
    () =>
      (Array.isArray(catalog) ? catalog : [])
        .map((x) => ({ key: x.key ?? x.scheme_key, name: x.name ?? x.display_name ?? x.key }))
        .filter((x) => x.key),
    [catalog],
  );

  const addedSchemeKeys = useMemo(
    () => new Set((fsItems || []).map((x) => x.scheme_key).filter(Boolean)),
    [fsItems],
  );

  const ensureDef = async (schemeKey) => {
    if (!schemeKey) return null;
    if (defsByKey?.[schemeKey]) return defsByKey[schemeKey];
    const def = await ExperimentsAPI.getFinancingSchemeDefinition(schemeKey);
    setDefsByKey((prev) => ({ ...(prev || {}), [schemeKey]: def }));
    return def;
  };

  const isDirtyScheme = (fsId) =>
    !paramsEqual(fsDraftById?.[fsId], savedParamsById?.[fsId]);

  // ── Add scheme ────────────────────────────────────────────────────────
  const onSelectAddScheme = async (schemeKey) => {
    if (!schemeKey) return;
    if (addedSchemeKeys.has(schemeKey)) return;
    setAddSchemeLoading(true);
    setAddSchemeError("");
    try {
      const created = await ExperimentsAPI.addExperimentFinancingScheme(experimentId, {
        scheme_type: schemeKey,
        params: {},
      });
      const def = await ensureDef(schemeKey);
      setDefsByKey((prev) => ({ ...(prev || {}), [schemeKey]: def }));
      const defaults = SCHEME_DEFAULTS[schemeKey] || {};
      setFsDraftById((prev) => ({ ...(prev || {}), [created.id]: { ...defaults } }));
      setSavedParamsById((prev) => ({ ...(prev || {}), [created.id]: created.params ?? {} }));
      setFsItems((prev) => [...prev, created].filter(Boolean));
      setScrollToId(created.id);
      await onReadinessRefresh();
    } catch (err) {
      const { msg, details } = extractApiError(err, "Failed to add financing scheme.");
      const detailText = details?.map((d) => `${d.path}: ${d.message}`).join(" | ");
      setAddSchemeError(detailText ? `${msg} (${detailText})` : msg);
    } finally {
      setAddSchemeLoading(false);
    }
  };

  // ── Equity exclusive: remove all others then add equity ───────────────
  const removeAllAndAddEquity = async () => {
    setEquityConfirmOpen(false);
    setAddSchemeLoading(true);
    setAddSchemeError("");
    try {
      await Promise.all(
        fsItems.map((fs) =>
          ExperimentsAPI.removeExperimentFinancingScheme(experimentId, fs.id),
        ),
      );
      setFsItems([]);
      setFsDraftById({});
      setSavedParamsById({});
      const created = await ExperimentsAPI.addExperimentFinancingScheme(experimentId, {
        scheme_type: "equity",
        params: {},
      });
      const def = await ensureDef("equity");
      setDefsByKey((prev) => ({ ...(prev || {}), equity: def }));
      setFsDraftById({ [created.id]: {} });
      setSavedParamsById({ [created.id]: {} });
      setFsItems([created]);
      setScrollToId(created.id);
      await onReadinessRefresh();
    } catch (err) {
      const { msg } = extractApiError(err, "Failed to switch to Equity financing.");
      onPageError(msg);
    } finally {
      setAddSchemeLoading(false);
    }
  };

  // ── Remove scheme ─────────────────────────────────────────────────────
  const removeScheme = async (fsId) => {
    setFsBusyId(fsId);
    try {
      await ExperimentsAPI.removeExperimentFinancingScheme(experimentId, fsId);
      setFsItems((prev) => prev.filter((x) => x.id !== fsId));
      setFsDraftById((prev) => {
        const next = { ...(prev || {}) };
        delete next[fsId];
        return next;
      });
      setSavedParamsById((prev) => {
        const next = { ...(prev || {}) };
        delete next[fsId];
        return next;
      });
      await onReadinessRefresh();
    } catch (err) {
      const { msg } = extractApiError(err, "Failed to remove financing scheme.");
      onPageError(msg);
    } finally {
      setFsBusyId(null);
    }
  };

  // ── Save scheme params ────────────────────────────────────────────────
  const patchSchemeParams = async (fsId) => {
    setFsSaveById((p) => ({ ...(p || {}), [fsId]: true }));
    setFsErrorById((p) => ({ ...(p || {}), [fsId]: "" }));
    try {
      const params = fsDraftById?.[fsId] || {};
      const updated = await ExperimentsAPI.patchExperimentFinancingScheme(
        experimentId,
        fsId,
        { params },
      );
      setFsItems((prev) => prev.map((x) => (x.id === fsId ? updated : x)));
      setSavedParamsById((prev) => ({ ...(prev || {}), [fsId]: params }));
      await onReadinessRefresh();
    } catch (err) {
      const { msg, details } = extractApiError(err, "Failed to save scheme params.");
      const detailText = details?.map((d) => `${d.path}: ${d.message}`).join(" | ");
      setFsErrorById((p) => ({
        ...(p || {}),
        [fsId]: detailText ? `${msg} (${detailText})` : msg,
      }));
    } finally {
      setFsSaveById((p) => ({ ...(p || {}), [fsId]: false }));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography
        sx={{
          textAlign: "center",
          color: "text.disabled",
          fontWeight: 900,
          fontStyle: "italic",
          fontSize: 18,
        }}
      >
        Fill in the necessary fields to run the experiment
      </Typography>

      {addSchemeError && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {addSchemeError}
        </Alert>
      )}

      {/* ── Added scheme blocks ── */}
      {(fsItems || []).map((fs, idx) => {
        const def = defsByKey?.[fs.scheme_key];
        const params = fsDraftById?.[fs.id] ?? fs.params ?? {};
        const dirty = isDirtyScheme(fs.id);
        const saving = Boolean(fsSaveById?.[fs.id]);

        return (
          <Grow
            key={fs.id}
            in={animateSchemeRows}
            timeout={350 + idx * 110}
            style={{ transformOrigin: "50% 0%" }}
          >
            <Paper
              ref={(el) => { schemeBlockRefs.current[fs.id] = el; }}
              elevation={0}
              sx={(theme) => ({ ...glassPanelSx(theme), p: 2, scrollMarginTop: "80px" })}
            >
              {/* Header */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography sx={{ fontWeight: 900, fontStyle: "italic", fontSize: 18 }}>
                  <Box component="span" sx={{ color: "success.main" }}>
                    Scheme {idx + 1}:
                  </Box>{" "}
                  {fs.display_name || fs.scheme_key}
                </Typography>
                <IconButton
                  aria-label="Remove scheme"
                  onClick={() => removeScheme(fs.id)}
                  disabled={fsBusyId === fs.id}
                  sx={glassDeleteIconButtonSx}
                >
                  {fsBusyId === fs.id ? (
                    <CircularProgress size={20} />
                  ) : (
                    <DeleteOutlineIcon />
                  )}
                </IconButton>
              </Stack>

              <SchemeInfoBox schemeKey={fs.scheme_key} compact={false} />

              {fsErrorById?.[fs.id] && (
                <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                  {fsErrorById[fs.id]}
                </Alert>
              )}

              {Array.isArray(defsByKey?.[fs.scheme_key]?.fields) &&
                defsByKey[fs.scheme_key].fields.length > 0 && (
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                    <Typography sx={{ fontSize: 15, color: "text.disabled", fontStyle: "italic" }}>
                      Use keyboard ↑ ↓ arrows to step through numeric values
                    </Typography>
                  </Stack>
                )}

              <SchemeFields
                def={def}
                params={params}
                setParams={(updater) =>
                  setFsDraftById((prev) => {
                    const curr = prev?.[fs.id] ?? {};
                    const nextP = typeof updater === "function" ? updater(curr) : updater;
                    return { ...(prev || {}), [fs.id]: nextP };
                  })
                }
                onBlurSave={() => patchSchemeParams(fs.id)}
              />

              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
                <AppButton
                  fullWidth={false}
                  variant="outlined"
                  onClick={() => patchSchemeParams(fs.id)}
                  loading={saving}
                  disabled={!dirty || saving}
                  sx={glassGreenButtonSx}
                >
                  Save params
                </AppButton>
              </Stack>
            </Paper>
          </Grow>
        );
      })}

      {/* ── Accordion scheme picker ── */}
      <Box>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
          <Box sx={glassTitlePillSx}>
            <Typography sx={{ fontWeight: 800, fontStyle: "italic", color: "text.primary" }}>
              {addSchemeLoading ? "Adding scheme…" : "+ Add a Financing Scheme"}
            </Typography>
          </Box>
        </Box>

        {SCHEME_SECTIONS.map((section, sectionIdx) => {
          const schemesInSection = section.schemes.filter((key) =>
            catalogOptions.some((o) => o.key === key),
          );
          if (!schemesInSection.length) return null;

          return (
            <Grow
              key={section.label}
              in={animateSchemeRows}
              timeout={300 + sectionIdx * 90}
              style={{ transformOrigin: "50% 0%" }}
            >
              <Accordion
                disableGutters
                elevation={0}
                sx={(theme) => ({
                  border: "1px solid",
                  borderColor: alpha(theme.palette.common.white, 0.4),
                  borderRadius: "18px !important",
                  mb: 1.2,
                  overflow: "hidden",
                  background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.7)} 0%, ${alpha(
                    theme.palette.success.main,
                    0.05,
                  )} 100%)`,
                  backdropFilter: "blur(14px)",
                  boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.56)}, 0 10px 24px ${alpha(
                    theme.palette.common.black,
                    0.06,
                  )}`,
                  "&:before": { display: "none" },
                  "&.Mui-expanded": {
                    borderColor: alpha(theme.palette.success.main, 0.28),
                  },
                })}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    minHeight: 48,
                    px: 2,
                    "& .MuiAccordionSummary-content": { my: 0.9 },
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontStyle: "italic" }}>
                    {section.label}
                  </Typography>
                </AccordionSummary>

                <AccordionDetails sx={{ pt: 0, pb: 1.5, px: 2 }}>
                  <Stack spacing={1.5}>
                    {schemesInSection.map((key) => {
                      const catalogEntry = catalogOptions.find((o) => o.key === key);
                      const name = catalogEntry?.name || key;
                      const alreadyAdded = addedSchemeKeys.has(key);

                      return (
                        <Paper
                          key={key}
                          elevation={0}
                          sx={(theme) => ({
                            ...glassPanelSx(theme),
                            p: 1.75,
                            borderColor: alreadyAdded
                              ? alpha(theme.palette.success.main, 0.35)
                              : alpha(theme.palette.common.white, 0.4),
                            opacity: alreadyAdded ? 0.88 : 1,
                          })}
                        >
                          <Stack direction="row" alignItems="flex-start" spacing={2}>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontWeight: 800, fontStyle: "italic", mb: 0.5 }}>
                                {name}
                                {alreadyAdded && (
                                  <Box
                                    component="span"
                                    sx={{
                                      ml: 1,
                                      fontSize: 12,
                                      color: "success.main",
                                      fontStyle: "normal",
                                      fontWeight: 700,
                                    }}
                                  >
                                    ✓ Added
                                  </Box>
                                )}
                              </Typography>
                              <SchemeInfoBox schemeKey={key} compact />
                            </Box>

                            <AppButton
                              fullWidth={false}
                              variant="contained"
                              startIcon={<AddOutlinedIcon />}
                              onClick={() => {
                                if (key === "equity" && fsItems.length > 0) {
                                  setEquityConfirmOpen(true);
                                } else {
                                  onSelectAddScheme(key);
                                }
                              }}
                              disabled={addSchemeLoading || alreadyAdded}
                              sx={(theme) => ({
                                ...glassGreenButtonSx(theme),
                                px: 2.2,
                                minWidth: 90,
                                mt: 0.25,
                                flexShrink: 0,
                                ...(alreadyAdded && {
                                  color: alpha(theme.palette.common.white, 0.8),
                                  background: alpha(theme.palette.success.main, 0.45),
                                  boxShadow: "none",
                                  transform: "none",
                                  filter: "none",
                                }),
                              })}
                            >
                              {alreadyAdded ? "Added" : "Add"}
                            </AppButton>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Grow>
          );
        })}
      </Box>

      {/* ── Equity confirmation dialog ── */}
      <Dialog
        open={equityConfirmOpen}
        onClose={() => setEquityConfirmOpen(false)}
        PaperProps={{
          sx: (theme) => ({
            borderRadius: 3,
            border: "1px solid",
            borderColor: alpha(theme.palette.common.white, 0.45),
            background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.92)} 0%, ${alpha(
              theme.palette.warning.main,
              0.06,
            )} 100%)`,
            backdropFilter: "blur(18px)",
            boxShadow: `0 24px 60px ${alpha(theme.palette.common.black, 0.18)}`,
          }),
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontStyle: "italic" }}>
          Switch to Equity (Self-Financing)?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Equity means you are financing{" "}
            <strong>100% of the project yourself</strong>. Selecting it will remove all{" "}
            {fsItems.length} other financing scheme
            {fsItems.length !== 1 ? "s" : ""} currently added to this experiment.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setEquityConfirmOpen(false)} sx={glassGhostButtonSx}>
            Cancel
          </Button>
          <Button onClick={removeAllAndAddEquity} sx={glassGreenButtonSx}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default FinancingTab;
