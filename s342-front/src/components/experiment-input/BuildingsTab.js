import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Grid,
  Grow,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

import ExperimentsAPI from "../../api/experiments";
import { AppButton, NumericInput, TextInput } from "../index";
import {
  cancelButtonSx,
  emptyBuilding,
  extractApiError,
  glassDeleteIconButtonSx,
  glassGreenButtonSx,
  glassPanelSx,
  glassViewIconButtonSx,
  quietGreenPillSx,
} from "./constants";

/**
 * Buildings tab — owns all buildings-related state and API calls.
 *
 * Props:
 *   experimentId       — current experiment ID
 *   onReadinessRefresh — call after any create/update/delete to refresh readiness
 *   onPageError        — surface fatal API errors to the page level
 */
const BuildingsTab = ({ experimentId, onReadinessRefresh, onPageError, onBuildingsChange }) => {
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState([]);

  const [screen, setScreen] = useState("list");
  const [editingBuildingId, setEditingBuildingId] = useState(null);
  const [buildingDraft, setBuildingDraft] = useState({ ...emptyBuilding });
  const [buildingFormError, setBuildingFormError] = useState("");
  const [buildingSaveLoading, setBuildingSaveLoading] = useState(false);
  const [buildingBusyId, setBuildingBusyId] = useState(null);

  // ── Initial load ──────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const blds = await ExperimentsAPI.listBuildings(experimentId);
        if (!mounted) return;
        const list = Array.isArray(blds) ? blds : [];
        setBuildings(list);
        if (onBuildingsChange) onBuildingsChange(list);
        if (list.length === 0) setScreen("form");
      } catch (err) {
        if (!mounted) return;
        const { msg } = extractApiError(err, "Failed to load buildings.");
        onPageError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // experimentId is stable for the lifetime of this component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentId]);

  // ── Open form ─────────────────────────────────────────────────────────
  const openCreateBuilding = () => {
    setEditingBuildingId(null);
    setBuildingDraft({ ...emptyBuilding });
    setBuildingFormError("");
    setScreen("form");
  };

  const openEditBuilding = (b) => {
    setEditingBuildingId(b?.id || null);
    setBuildingDraft({
      name: b?.name ?? "",
      country: b?.country ?? "",
      region: b?.region ?? "",
      year_of_construction: b?.year_of_construction ?? "",
      floor_area: b?.floor_area ?? "",
      eem_capex: b?.eem_capex ?? "",
      eem_energy_savings: b?.eem_energy_savings ?? "",
      eem_maintenance_cost: b?.eem_maintenance_cost ?? "",
      eem_lifetime: b?.eem_lifetime ?? "",
    });
    setBuildingFormError("");
    setScreen("form");
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const deleteBuilding = async (buildingId) => {
    setBuildingBusyId(buildingId);
    try {
      await ExperimentsAPI.removeBuilding(experimentId, buildingId);
      setBuildings((prev) => {
        const next = prev.filter((x) => x.id !== buildingId);
        if (onBuildingsChange) onBuildingsChange(next);
        return next;
      });
      await onReadinessRefresh();
      if (editingBuildingId === buildingId) {
        setScreen("list");
        setEditingBuildingId(null);
      }
    } catch (err) {
      const { msg } = extractApiError(err, "Failed to delete building.");
      onPageError(msg);
    } finally {
      setBuildingBusyId(null);
    }
  };

  // ── Maintenance cost validation (≤ 10% of capex) ─────────────────────
  const maintenanceCostError = (() => {
    const capex = Number(buildingDraft.eem_capex) || 0;
    const maint = Number(buildingDraft.eem_maintenance_cost) || 0;
    if (capex > 0 && maint > 0 && maint > capex * 0.1) {
      return `Must not exceed 10% of CAPEX (max €${(capex * 0.1).toFixed(0)}).`;
    }
    return "";
  })();

  // ── Year of construction validation (> 1900) ──────────────────────────
  const yearOfConstructionError = (() => {
    const y = buildingDraft.year_of_construction;
    if (y !== "" && y !== null && Number(y) <= 1900) return "Must be after 1900.";
    return "";
  })();

  // ── Lifetime validation (≤ 100) ───────────────────────────────────────
  const lifetimeError = (() => {
    const lt = buildingDraft.eem_lifetime;
    if (lt !== "" && lt !== null && Number(lt) > 100) return "Maximum lifetime is 100 years.";
    return "";
  })();

  // ── Save ──────────────────────────────────────────────────────────────
  const saveBuilding = async () => {
    if (yearOfConstructionError) {
      setBuildingFormError(`Year of Construction: ${yearOfConstructionError}`);
      return;
    }
    if (lifetimeError) {
      setBuildingFormError(`Lifetime: ${lifetimeError}`);
      return;
    }
    if (maintenanceCostError) {
      setBuildingFormError(`Annual Maintenance Cost: ${maintenanceCostError}`);
      return;
    }
    setBuildingSaveLoading(true);
    setBuildingFormError("");
    const payload = {
      name: buildingDraft.name,
      country: buildingDraft.country,
      region: buildingDraft.region,
      year_of_construction:
        buildingDraft.year_of_construction === ""
          ? null
          : Number(buildingDraft.year_of_construction),
      floor_area:
        buildingDraft.floor_area === "" ? null : Number(buildingDraft.floor_area),
      eem_capex:
        buildingDraft.eem_capex === "" ? null : Number(buildingDraft.eem_capex),
      eem_energy_savings:
        buildingDraft.eem_energy_savings === ""
          ? null
          : Number(buildingDraft.eem_energy_savings),
      eem_maintenance_cost:
        buildingDraft.eem_maintenance_cost === ""
          ? null
          : Number(buildingDraft.eem_maintenance_cost),
      eem_lifetime:
        buildingDraft.eem_lifetime === "" ? null : Number(buildingDraft.eem_lifetime),
    };
    try {
      if (!editingBuildingId) {
        const created = await ExperimentsAPI.createBuilding(experimentId, payload);
        setBuildings((prev) => {
          const next = [created, ...prev].filter(Boolean);
          if (onBuildingsChange) onBuildingsChange(next);
          return next;
        });
      } else {
        const updated = await ExperimentsAPI.patchBuilding(
          experimentId,
          editingBuildingId,
          payload,
        );
        setBuildings((prev) => {
          const next = prev.map((x) => (x.id === editingBuildingId ? updated : x));
          if (onBuildingsChange) onBuildingsChange(next);
          return next;
        });
      }
      setScreen("list");
      setEditingBuildingId(null);
      await onReadinessRefresh();
    } catch (err) {
      const { msg, details } = extractApiError(err, "Failed to save building.");
      const detailText = details?.map((d) => `${d.path}: ${d.message}`).join(" | ");
      setBuildingFormError(detailText ? `${msg} (${detailText})` : msg);
    } finally {
      setBuildingSaveLoading(false);
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

  if (screen === "list") {
    return (
      <Box>
        <Typography
          sx={{
            textAlign: "center",
            color: "text.disabled",
            fontWeight: 900,
            fontStyle: "italic",
            fontSize: 16,
            mb: 2,
          }}
        >
          Add at least one Building and fill in the necessary fields to run the experiment
        </Typography>
        <Stack spacing={2}>
          {(buildings || []).map((b, idx) => (
            <Grow key={b.id} in timeout={350 + idx * 110} style={{ transformOrigin: "50% 0%" }}>
              <Paper elevation={0} sx={glassPanelSx}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <HomeOutlinedIcon sx={{ color: "text.primary" }} />

                  <Typography
                    sx={{ flex: 1, fontWeight: 800, fontStyle: "italic" }}
                    noWrap
                  >
                    <Box component="span" sx={{ color: "success.main" }}>
                      Building {idx + 1}:
                    </Box>{" "}
                    {b?.name || "Untitled building"}
                  </Typography>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton
                      aria-label="Edit building"
                      onClick={() => openEditBuilding(b)}
                      sx={glassViewIconButtonSx}
                    >
                      <EditOutlinedIcon />
                    </IconButton>
                    <IconButton
                      aria-label="Delete building"
                      onClick={() => deleteBuilding(b.id)}
                      disabled={buildingBusyId === b.id}
                      sx={glassDeleteIconButtonSx}
                    >
                      {buildingBusyId === b.id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <DeleteOutlineIcon />
                      )}
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>
            </Grow>
          ))}
        </Stack>

        {buildings.length === 0 && (
          <Stack alignItems="center" sx={{ mt: 3 }}>
            <AppButton
              fullWidth={false}
              onClick={openCreateBuilding}
              startIcon={<AddOutlinedIcon />}
              sx={glassGreenButtonSx}
            >
              Add Building
            </AppButton>
          </Stack>
        )}
      </Box>
    );
  }

  // ── Building form ──────────────────────────────────────────────────────
  return (
    <Box>
      {buildingFormError && (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          {buildingFormError}
        </Alert>
      )}

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box sx={quietGreenPillSx}>
          <Typography sx={{ color: "primary.main", fontWeight: 900, fontStyle: "italic" }}>
            {editingBuildingId
              ? `Building ${buildings.findIndex((b) => b.id === editingBuildingId) + 1}`
              : "New Building"}
          </Typography>
        </Box>
        {editingBuildingId && (
          <IconButton
            aria-label="Delete building"
            onClick={() => deleteBuilding(editingBuildingId)}
            disabled={buildingBusyId === editingBuildingId}
            sx={glassDeleteIconButtonSx}
          >
            {buildingBusyId === editingBuildingId ? (
              <CircularProgress size={20} />
            ) : (
              <DeleteOutlineIcon />
            )}
          </IconButton>
        )}
      </Stack>

      <Typography
        sx={{
          textAlign: "center",
          fontWeight: 900,
          fontStyle: "italic",
          color: "success.main",
          fontSize: 20,
          mb: 1,
        }}
      >
        General Details
      </Typography>

      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* General details */}
        <Grid
          container
          columnSpacing={6}
          rowSpacing={2}
          sx={{ width: "100%", maxWidth: 980, justifyContent: "center", mb: 3 }}
        >
          <Grid
            item
            xs={12}
            md={6}
            sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-end" } }}
          >
            <Stack spacing={2} sx={{ width: 420 }}>
              {[
                { label: "Name", field: "name" },
                { label: "Country", field: "country" },
                { label: "Region", field: "region" },
              ].map(({ label, field }) => (
                <Stack direction="row" alignItems="center" spacing={2} key={field}>
                  <Typography
                    sx={{
                      width: 150,
                      textAlign: "right",
                      fontWeight: 900,
                      fontStyle: "italic",
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </Typography>
                  <Box sx={{ width: 240, flexShrink: 0 }}>
                    <TextInput
                      value={buildingDraft[field]}
                      onChange={(e) =>
                        setBuildingDraft((p) => ({ ...p, [field]: e.target.value }))
                      }
                    />
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
            sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-start" } }}
          >
            <Box
              sx={{
                width: 420,
                display: "flex",
                alignItems: "center",
                minHeight: { xs: "auto", md: 172 },
              }}
            >
              <Stack spacing={2} sx={{ width: "100%" }}>
                {[
                  { label: "Year of Construction", field: "year_of_construction", integer: true, min: 1901, step: 1, errorFn: () => yearOfConstructionError },
                  { label: "Floor Area (m²)", field: "floor_area", min: 0, step: 50 },
                ].map(({ label, field, integer, min, step, errorFn }) => (
                  <Stack direction="row" alignItems="flex-start" spacing={2} key={field}>
                    <Typography
                      sx={{
                        width: 150,
                        textAlign: "right",
                        fontWeight: 900,
                        fontStyle: "italic",
                        flexShrink: 0,
                        pt: errorFn?.() ? 0.5 : 0,
                      }}
                    >
                      {label}
                    </Typography>
                    <Box sx={{ width: 240, flexShrink: 0 }}>
                      <NumericInput
                        value={buildingDraft[field]}
                        integer={integer}
                        min={min}
                        step={step}
                        error={errorFn?.()}
                        onChange={(e) =>
                          setBuildingDraft((p) => ({ ...p, [field]: e.target.value }))
                        }
                      />
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Grid>
        </Grid>

        {/* EEM section */}
        <Divider
          sx={(theme) => ({
            my: 2.5,
            width: "100%",
            maxWidth: 980,
            borderColor: alpha(theme.palette.common.white, 0.55),
          })}
        />

        <Typography
          sx={{
            textAlign: "center",
            fontWeight: 900,
            fontStyle: "italic",
            color: "success.main",
            fontSize: 20,
            mb: 2,
          }}
        >
          Energy Efficiency Measures
        </Typography>

        <Grid
          container
          columnSpacing={6}
          rowSpacing={2}
          sx={{ width: "100%", maxWidth: 980, justifyContent: "center" }}
        >
          <Grid
            item
            xs={12}
            md={6}
            sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-end" } }}
          >
            <Stack spacing={2} sx={{ width: 420 }}>
              {[
                { label: "Total CAPEX (€)", field: "eem_capex", min: 0, step: 1000 },
                { label: "Annual Energy Savings (kWh)", field: "eem_energy_savings", min: 0, step: 100 },
              ].map(({ label, field, min, step }) => (
                <Stack direction="row" alignItems="center" spacing={2} key={field}>
                  <Typography
                    sx={{
                      width: 170,
                      textAlign: "right",
                      fontWeight: 900,
                      fontStyle: "italic",
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </Typography>
                  <Box sx={{ width: 220, flexShrink: 0 }}>
                    <NumericInput
                      value={buildingDraft[field]}
                      min={min}
                      step={step}
                      onChange={(e) =>
                        setBuildingDraft((p) => ({ ...p, [field]: e.target.value }))
                      }
                    />
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
            sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-start" } }}
          >
            <Stack spacing={2} sx={{ width: 420 }}>
              {[
                { label: "Annual Maintenance Cost (€)", field: "eem_maintenance_cost", min: 0, step: 1000, errorFn: () => maintenanceCostError },
                { label: "Lifetime (years)", field: "eem_lifetime", integer: true, min: 1, step: 1, errorFn: () => lifetimeError },
              ].map(({ label, field, integer, min, step, errorFn }) => (
                <Stack direction="row" alignItems="flex-start" spacing={2} key={field}>
                  <Typography
                    sx={{
                      width: 170,
                      textAlign: "right",
                      fontWeight: 900,
                      fontStyle: "italic",
                      flexShrink: 0,
                      pt: errorFn?.() ? 0.5 : 0,
                    }}
                  >
                    {label}
                  </Typography>
                  <Box sx={{ width: 220, flexShrink: 0 }}>
                    <NumericInput
                      value={buildingDraft[field]}
                      integer={integer}
                      min={min}
                      step={step}
                      error={errorFn?.()}
                      onChange={(e) =>
                        setBuildingDraft((p) => ({ ...p, [field]: e.target.value }))
                      }
                    />
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 3 }}>
        <AppButton
          fullWidth={false}
          variant="outlined"
          onClick={() => {
            setScreen("list");
            setEditingBuildingId(null);
          }}
          sx={cancelButtonSx}
        >
          Cancel
        </AppButton>
        <AppButton
          fullWidth={false}
          onClick={saveBuilding}
          loading={buildingSaveLoading}
          sx={glassGreenButtonSx}
        >
          Save
        </AppButton>
      </Stack>
    </Box>
  );
};

export default BuildingsTab;
