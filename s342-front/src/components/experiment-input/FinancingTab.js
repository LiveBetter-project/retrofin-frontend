import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  CircularProgress,
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

import ExperimentsAPI from "../../api/experiments";
import { AppButton } from "../index";
import {
  SCHEME_DEFAULTS,
  SCHEME_SECTIONS,
  extractApiError,
  glassDeleteIconButtonSx,
  glassGreenButtonSx,
  glassPanelSx,
  paramsEqual,
} from "./constants";
import SchemeInfoBox from "./SchemeInfoBox";
import SchemeFields from "./SchemeFields";

/**
 * Financing tab — owns all financing-scheme state and API calls.
 *
 * Props:
 *   experimentId       — current experiment ID
 *   buildings          — array of building objects (for capex / lifetime validation)
 *   onReadinessRefresh — call after any add/remove/save to refresh readiness
 *   onPageError        — surface fatal API errors to the page level
 *   onSchemesChange    — called with the current fsItems array after every mutation
 *
 * Exposed via ref (useImperativeHandle):
 *   addEquity()    — remove all non-equity schemes then add equity
 *   removeEquity() — remove the equity scheme if present
 */
const FinancingTab = React.forwardRef(function FinancingTab(
  { experimentId, buildings = [], onReadinessRefresh, onPageError, onSchemesChange },
  ref,
) {
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
  // Entry animation
  const [animateRows, setAnimateRows] = useState(false);

  // Keep a live ref to fsItems/fsDraftById for use in imperative handle
  const fsItemsRef = useRef(fsItems);
  const removeSchemeRef = useRef(null);
  const removeAllAndAddEquityRef = useRef(null);
  useEffect(() => { fsItemsRef.current = fsItems; }, [fsItems]);

  // ── Validation values from buildings ──────────────────────────────────
  const totalCapex = useMemo(
    () => buildings.reduce((s, b) => s + (Number(b.eem_capex) || 0), 0),
    [buildings],
  );
  const minLifetime = useMemo(() => {
    if (!buildings.length) return null;
    const m = buildings.reduce((mn, b) => Math.min(mn, Number(b.eem_lifetime) || Infinity), Infinity);
    return isFinite(m) ? m : null;
  }, [buildings]);

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
        if (onSchemesChange) onSchemesChange(items);

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
      const frame = requestAnimationFrame(() => setAnimateRows(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [loading]);

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

  // ── Capex overflow check ──────────────────────────────────────────────
  const getSchemeFinancingAmount = (schemeKey, params) => {
    const amountFields = ["loan_amount", "guaranteed_savings_amount", "lease_payment"];
    for (const f of amountFields) {
      if (params?.[f] != null && params[f] !== "") return Number(params[f]) || 0;
    }
    return 0;
  };

  const getCapexWarning = (editingKey, editingParams) => {
    if (!totalCapex) return "";
    const amount = getSchemeFinancingAmount(editingKey, editingParams);
    if (amount > totalCapex) {
      return `Financing amount (€${amount.toLocaleString()}) exceeds total building CAPEX (€${totalCapex.toLocaleString()}).`;
    }
    return "";
  };

  // ── Has blocking field errors ─────────────────────────────────────────
  const hasFieldErrors = (fsId, schemeKey) => {
    const def = defsByKey?.[schemeKey];
    if (!def?.fields) return false;
    const params = fsDraftById?.[fsId] ?? {};
    const perFieldError = def.fields.some((field) => {
      const val = params[field.name];
      if (val === "" || val === undefined || val === null) return false;
      const n = Number(val);
      if (isNaN(n)) return false;
      if (field.name.includes("_percent") && n > 1) return true;
      if (field.name === "term_years") {
        const maxTerm = minLifetime != null ? Math.min(100, minLifetime) : 100;
        if (n > maxTerm) return true;
      }
      return false;
    });
    if (perFieldError) return true;
    // Cross-field: equity_crowdfunding platform_fee_percent + crowd_share_percent <= 1
    if (schemeKey === "equity_crowdfunding") {
      const fee = Number(params.platform_fee_percent) || 0;
      const share = Number(params.crowd_share_percent) || 0;
      if (fee + share > 1) return true;
    }
    return false;
  };

  // ── Add scheme ────────────────────────────────────────────────────────
  const onSelectAddScheme = async (schemeKey) => {
    if (!schemeKey) return;
    if (addedSchemeKeys.has(schemeKey)) return;
    setAddSchemeLoading(true);
    setAddSchemeError("");
    try {
      // If equity is active, remove it first
      if (schemeKey !== "equity") {
        const equityItem = fsItems.find((x) => x.scheme_key === "equity");
        if (equityItem) {
          await ExperimentsAPI.removeExperimentFinancingScheme(experimentId, equityItem.id);
          setFsItems((prev) => prev.filter((x) => x.id !== equityItem.id));
          setFsDraftById((prev) => { const n = { ...(prev || {}) }; delete n[equityItem.id]; return n; });
          setSavedParamsById((prev) => { const n = { ...(prev || {}) }; delete n[equityItem.id]; return n; });
        }
      }
      const created = await ExperimentsAPI.addExperimentFinancingScheme(experimentId, {
        scheme_type: schemeKey,
        params: {},
      });
      const def = await ensureDef(schemeKey);
      setDefsByKey((prev) => ({ ...(prev || {}), [schemeKey]: def }));
      const defaults = SCHEME_DEFAULTS[schemeKey] || {};
      const nextItems = [...fsItems.filter((x) => x.scheme_key !== "equity"), created].filter(Boolean);
      setFsDraftById((prev) => ({ ...(prev || {}), [created.id]: { ...defaults } }));
      setSavedParamsById((prev) => ({ ...(prev || {}), [created.id]: created.params ?? {} }));
      setFsItems(nextItems);
      if (onSchemesChange) onSchemesChange(nextItems);
      await onReadinessRefresh();
    } catch (err) {
      const { msg, details } = extractApiError(err, "Failed to add financing scheme.");
      const detailText = details?.map((d) => `${d.path}: ${d.message}`).join(" | ");
      setAddSchemeError(detailText ? `${msg} (${detailText})` : msg);
    } finally {
      setAddSchemeLoading(false);
    }
  };

  // ── Remove all other schemes then add equity ──────────────────────────
  const removeAllAndAddEquity = async () => {
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
      const nextItems = [created];
      setFsDraftById({ [created.id]: {} });
      setSavedParamsById({ [created.id]: {} });
      setFsItems(nextItems);
      if (onSchemesChange) onSchemesChange(nextItems);
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
      const nextItems = (fsItems || []).filter((x) => x.id !== fsId);
      setFsItems(nextItems);
      if (onSchemesChange) onSchemesChange(nextItems);
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
  const patchSchemeParams = async (fsId, schemeKey) => {
    if (hasFieldErrors(fsId, schemeKey)) return;
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

  // Keep live refs for imperative handle
  removeSchemeRef.current = removeScheme;
  removeAllAndAddEquityRef.current = removeAllAndAddEquity;

  // ── Imperative handle (for ExperimentInput equity checkbox) ───────────
  useImperativeHandle(ref, () => ({
    addEquity: () => removeAllAndAddEquityRef.current(),
    removeEquity: () => {
      const equityItem = fsItemsRef.current.find((x) => x.scheme_key === "equity");
      if (equityItem) return removeSchemeRef.current(equityItem.id);
    },
  }), []);

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
          fontSize: 16,
        }}
      >
        Add at least one Financing Scheme and fill in the necessary fields to run the experiment
      </Typography>

      {addSchemeError && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {addSchemeError}
        </Alert>
      )}

      {/* ── Accordion scheme picker with inline config blocks ── */}
      <Box>
        {SCHEME_SECTIONS.map((section, sectionIdx) => {
          const schemesInSection = section.schemes.filter((key) =>
            catalogOptions.some((o) => o.key === key),
          );
          if (!schemesInSection.length) return null;

          return (
            <Grow
              key={section.label}
              in={animateRows}
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
                      const fsItem = alreadyAdded
                        ? (fsItems || []).find((x) => x.scheme_key === key)
                        : null;

                      if (alreadyAdded && fsItem) {
                        // ── Inline config block ──
                        const def = defsByKey?.[key];
                        const params = fsDraftById?.[fsItem.id] ?? fsItem.params ?? {};
                        const dirty = isDirtyScheme(fsItem.id);
                        const saving = Boolean(fsSaveById?.[fsItem.id]);
                        const capexWarning = getCapexWarning(key, params);
                        const fieldErrors = hasFieldErrors(fsItem.id, key);

                        return (
                          <Paper
                            key={key}
                            elevation={0}
                            sx={(theme) => ({
                              ...glassPanelSx(theme),
                              p: 2,
                              borderColor: alpha(theme.palette.success.main, 0.35),
                            })}
                          >
                            {/* Header */}
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              sx={{ mb: 1 }}
                            >
                              <Typography sx={{ fontWeight: 900, fontStyle: "italic", fontSize: 17 }}>
                                <Box component="span" sx={{ color: "success.main" }}>✓</Box>{" "}
                                {name}
                              </Typography>
                              <IconButton
                                aria-label="Remove scheme"
                                onClick={() => removeScheme(fsItem.id)}
                                disabled={fsBusyId === fsItem.id}
                                sx={glassDeleteIconButtonSx}
                              >
                                {fsBusyId === fsItem.id ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <DeleteOutlineIcon />
                                )}
                              </IconButton>
                            </Stack>

                            <SchemeInfoBox schemeKey={key} compact={false} />

                            {fsErrorById?.[fsItem.id] && (
                              <Alert severity="error" sx={{ borderRadius: 2, mb: 1 }}>
                                {fsErrorById[fsItem.id]}
                              </Alert>
                            )}
                            {capexWarning && (
                              <Alert severity="warning" sx={{ borderRadius: 2, mb: 1 }}>
                                {capexWarning}
                              </Alert>
                            )}


                            <SchemeFields
                              def={def}
                              params={params}
                              schemeKey={key}
                              minLifetime={minLifetime}
                              setParams={(updater) =>
                                setFsDraftById((prev) => {
                                  const curr = prev?.[fsItem.id] ?? {};
                                  const nextP =
                                    typeof updater === "function" ? updater(curr) : updater;
                                  return { ...(prev || {}), [fsItem.id]: nextP };
                                })
                              }
                              onBlurSave={() => patchSchemeParams(fsItem.id, key)}
                            />

                            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
                              <AppButton
                                fullWidth={false}
                                variant="outlined"
                                onClick={() => patchSchemeParams(fsItem.id, key)}
                                loading={saving}
                                disabled={!dirty || saving || fieldErrors}
                                sx={glassGreenButtonSx}
                              >
                                Save params
                              </AppButton>
                            </Stack>
                          </Paper>
                        );
                      }

                      // ── Scheme preview with Add button ──
                      return (
                        <Paper
                          key={key}
                          elevation={0}
                          sx={(theme) => ({
                            ...glassPanelSx(theme),
                            p: 1.75,
                          })}
                        >
                          <Stack direction="row" alignItems="flex-start" spacing={2}>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontWeight: 800, fontStyle: "italic", mb: 0.5 }}>
                                {name}
                              </Typography>
                              <SchemeInfoBox schemeKey={key} compact />
                            </Box>

                            <AppButton
                              fullWidth={false}
                              variant="contained"
                              startIcon={<AddOutlinedIcon />}
                              onClick={() => onSelectAddScheme(key)}
                              disabled={addSchemeLoading}
                              sx={(theme) => ({
                                ...glassGreenButtonSx(theme),
                                px: 2.2,
                                minWidth: 90,
                                mt: 0.25,
                                flexShrink: 0,
                              })}
                            >
                              Add
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
    </Stack>
  );
});

export default FinancingTab;
