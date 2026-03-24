import React from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import { AppButton, NumericInput, TextInput } from "../index";
import {
  cancelButtonSx,
  glassDeleteIconButtonSx,
  glassGreenButtonSx,
  quietGreenPillSx,
} from "./constants";

// ---------------------------------------------------------------------------
// BuildingForm — form for creating or editing a single building
// ---------------------------------------------------------------------------

const BuildingForm = ({
  editingBuildingId,
  buildings,
  buildingDraft,
  setBuildingDraft,
  buildingFormError,
  buildingSaveLoading,
  buildingBusyId,
  yearOfConstructionError,
  lifetimeError,
  maintenanceCostError,
  onDelete,
  onSave,
  onCancel,
}) => (
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
          onClick={() => onDelete(editingBuildingId)}
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
        onClick={onCancel}
        sx={cancelButtonSx}
      >
        Cancel
      </AppButton>
      <AppButton
        fullWidth={false}
        onClick={onSave}
        loading={buildingSaveLoading}
        sx={glassGreenButtonSx}
      >
        Save
      </AppButton>
    </Stack>
  </Box>
);

export default BuildingForm;
