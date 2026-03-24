import React, { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Grow,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

import ExperimentsAPI from "../../api/experiments";
import { AppButton } from "../index";
import {
  emptyBuilding,
  extractApiError,
  glassDeleteIconButtonSx,
  glassGreenButtonSx,
  glassPanelSx,
  glassViewIconButtonSx,
} from "./constants";
import BuildingForm from "./BuildingForm";

/**
 * Buildings tab — owns all buildings-related state and API calls.
 *
 * Props:
 *   experimentId       — current experiment ID
 *   onReadinessRefresh — call after any create/update/delete to refresh readiness
 *   onPageError        — surface fatal API errors to the page level
 *   onBuildingsChange  — called with the current buildings array after every mutation
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

  // ── Validation ────────────────────────────────────────────────────────
  const maintenanceCostError = (() => {
    const capex = Number(buildingDraft.eem_capex) || 0;
    const maint = Number(buildingDraft.eem_maintenance_cost) || 0;
    if (capex > 0 && maint > 0 && maint > capex * 0.1) {
      return `Must not exceed 10% of CAPEX (max €${(capex * 0.1).toFixed(0)}).`;
    }
    return "";
  })();

  const yearOfConstructionError = (() => {
    const y = buildingDraft.year_of_construction;
    if (y !== "" && y !== null && Number(y) <= 1900) return "Must be after 1900.";
    return "";
  })();

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
        buildingDraft.year_of_construction === "" ? null : Number(buildingDraft.year_of_construction),
      floor_area:
        buildingDraft.floor_area === "" ? null : Number(buildingDraft.floor_area),
      eem_capex:
        buildingDraft.eem_capex === "" ? null : Number(buildingDraft.eem_capex),
      eem_energy_savings:
        buildingDraft.eem_energy_savings === "" ? null : Number(buildingDraft.eem_energy_savings),
      eem_maintenance_cost:
        buildingDraft.eem_maintenance_cost === "" ? null : Number(buildingDraft.eem_maintenance_cost),
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
        const updated = await ExperimentsAPI.patchBuilding(experimentId, editingBuildingId, payload);
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

                  <Typography sx={{ flex: 1, fontWeight: 800, fontStyle: "italic" }} noWrap>
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

  // ── Building form screen ───────────────────────────────────────────────
  return (
    <BuildingForm
      editingBuildingId={editingBuildingId}
      buildings={buildings}
      buildingDraft={buildingDraft}
      setBuildingDraft={setBuildingDraft}
      buildingFormError={buildingFormError}
      buildingSaveLoading={buildingSaveLoading}
      buildingBusyId={buildingBusyId}
      yearOfConstructionError={yearOfConstructionError}
      lifetimeError={lifetimeError}
      maintenanceCostError={maintenanceCostError}
      onDelete={deleteBuilding}
      onSave={saveBuilding}
      onCancel={() => { setScreen("list"); setEditingBuildingId(null); }}
    />
  );
};

export default BuildingsTab;
