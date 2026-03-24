import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grow,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";

import ExperimentsAPI from "../api/experiments";
import { extractApiError, pageHeaderPillSx } from "../components/experiment-input/constants";
import CreateExperimentDialog from "../components/dashboard/CreateExperimentDialog";
import RenameExperimentDialog from "../components/dashboard/RenameExperimentDialog";

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

const formatDDMMYY = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

const defaultExpName = () => {
  const ts = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  return `Experiment_${ts}`;
};

const statusChipSx = (status) => {
  const base = { fontWeight: 700, textTransform: "capitalize" };
  if (status === "completed") return { ...base, bgcolor: "success.main", color: "common.white" };
  if (status === "running")   return { ...base, bgcolor: "warning.main", color: "common.white" };
  if (status === "failed")    return { ...base, bgcolor: "error.main",   color: "common.white" };
  if (status === "ready")     return { ...base, bgcolor: "primary.main", color: "common.white" };
  return { ...base, bgcolor: "grey.400", color: "common.white" }; // draft or unknown
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

const Dashboard = () => {
  const navigate = useNavigate();

  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [busyId,   setBusyId]   = useState(null);
  const [creating, setCreating] = useState(false);
  const [error,    setError]    = useState("");

  // Create dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogName, setDialogName] = useState("");

  // Rename dialog state
  const [renameId,      setRenameId]      = useState(null);
  const [renameName,    setRenameName]    = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError,   setRenameError]   = useState("");

  const [animateRows, setAnimateRows] = useState(false);

  // ── Data load ────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await ExperimentsAPI.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Failed to load experiments.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Create handlers ───────────────────────────────────────────────────────
  const onOpenDialog = () => {
    setDialogName(defaultExpName());
    setError("");
    setDialogOpen(true);
  };

  const onCloseDialog = () => {
    if (creating) return;
    setDialogOpen(false);
  };

  const onCreateConfirm = async () => {
    const name = dialogName.trim();
    setCreating(true);
    setError("");
    try {
      const exp = await ExperimentsAPI.create(name ? { name } : {});
      const id = exp?.id;
      if (id) {
        setDialogOpen(false);
        navigate(`/experiments/input?id=${id}`);
      } else {
        setError("Experiment created but no id was returned.");
      }
    } catch (e) {
      setError("Failed to create experiment.");
    } finally {
      setCreating(false);
    }
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const onDelete = async (experimentId) => {
    setBusyId(experimentId);
    setError("");
    try {
      await ExperimentsAPI.remove(experimentId);
      setItems((prev) => prev.filter((x) => x.id !== experimentId));
    } catch (e) {
      setError("Failed to delete experiment.");
    } finally {
      setBusyId(null);
    }
  };

  // ── Rename handlers ───────────────────────────────────────────────────────
  const openRename = (row) => {
    setRenameId(row.id);
    setRenameName(row.name);
    setRenameError("");
  };

  const closeRename = () => {
    if (renameLoading) return;
    setRenameId(null);
    setRenameName("");
    setRenameError("");
  };

  const onRenameConfirm = async () => {
    const name = renameName.trim();
    if (!name) { setRenameError("Name cannot be blank."); return; }
    const conflict = items.find((x) => x.id !== renameId && x.name === name);
    if (conflict) { setRenameError("An experiment with this name already exists."); return; }
    setRenameLoading(true);
    setRenameError("");
    try {
      const updated = await ExperimentsAPI.patch(renameId, { name });
      setItems((prev) =>
        prev.map((x) => x.id === renameId ? { ...x, name: updated.name ?? name } : x),
      );
      closeRename();
    } catch (err) {
      const { msg } = extractApiError(err, "Failed to rename experiment.");
      setRenameError(msg);
    } finally {
      setRenameLoading(false);
    }
  };

  // ── Derived rows ──────────────────────────────────────────────────────────
  const rows = useMemo(() => items.map((x) => {
    const runDate =
      x?.latest_run?.finished_at ||
      x?.latest_run?.created_at  ||
      x?.updated_at              ||
      x?.created_at;
    return {
      id:     x?.id,
      name:   x?.name || "Untitled Experiment",
      date:   formatDDMMYY(runDate),
      status: x?.status || "draft",
    };
  }), [items]);

  useEffect(() => {
    if (loading) { setAnimateRows(false); return; }
    const frame = requestAnimationFrame(() => setAnimateRows(true));
    return () => cancelAnimationFrame(frame);
  }, [loading, rows.length]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <CreateExperimentDialog
        open={dialogOpen}
        onClose={onCloseDialog}
        name={dialogName}
        onNameChange={(e) => setDialogName(e.target.value)}
        creating={creating}
        error={dialogOpen ? error : ""}
        onConfirm={onCreateConfirm}
      />

      <RenameExperimentDialog
        open={Boolean(renameId)}
        onClose={closeRename}
        name={renameName}
        onNameChange={(e) => { setRenameName(e.target.value); setRenameError(""); }}
        loading={renameLoading}
        error={renameError}
        onConfirm={onRenameConfirm}
      />

      {/* ── Dashboard header ── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box sx={{ width: 220 }} />

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
              History
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ width: 220, display: "flex", justifyContent: "flex-end" }}>
          <Button
            onClick={onOpenDialog}
            disabled={creating}
            variant="contained"
            startIcon={<PlayArrowIcon />}
            sx={(theme) => ({
              color: theme.palette.common.white,
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              border: "1px solid",
              borderColor: alpha(theme.palette.common.white, 0.24),
              borderRadius: "999px",
              px: 3.2,
              py: 1.1,
              fontWeight: 800,
              backdropFilter: "blur(14px)",
              boxShadow: `0 14px 32px ${alpha(theme.palette.success.main, 0.3)}`,
              transition: "transform 180ms ease, box-shadow 180ms ease, filter 180ms ease",
              "&:hover": {
                background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
                transform: "translateY(-2px)",
                boxShadow: `0 18px 36px ${alpha(theme.palette.success.main, 0.36)}`,
                filter: "brightness(1.03)",
              },
              "&.Mui-disabled": {
                color: alpha(theme.palette.common.white, 0.8),
                background: alpha(theme.palette.success.main, 0.45),
              },
            })}
          >
            New
          </Button>
        </Box>
      </Stack>

      {/* ── Main dashboard ── */}
      <Box
        sx={(theme) => ({
          position: "relative",
          p: "4px",
          borderRadius: 4,
          backgroundColor: theme.palette.secondary.main,
          boxShadow: `0 22px 60px ${alpha(theme.palette.common.black, 0.14)}`,
          overflow: "hidden",
        })}
      >
        <Box
          sx={(theme) => ({
            borderRadius: 3.5,
            p: { xs: 2, md: 4 },
            minHeight: 560,
            backgroundColor: theme.palette.grey[200],
            boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.35)}`,
          })}
        >
          <Stack direction="row" sx={{ mb: 1.25, px: 1 }}>
            <Typography sx={{ flex: 1, fontWeight: 800, fontStyle: "italic", color: "text.secondary" }}>
              Experiment Title
            </Typography>
            <Typography
              sx={{ width: 140, fontWeight: 800, fontStyle: "italic", color: "text.secondary", textAlign: "center" }}
            >
              Date
            </Typography>
            <Typography
              sx={{ width: 120, fontWeight: 800, fontStyle: "italic", color: "text.secondary", textAlign: "center" }}
            >
              Status
            </Typography>
            <Box sx={{ width: 144 }} />
          </Stack>

          {error && !dialogOpen && (
            <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Typography sx={{ color: "error.main", fontWeight: 700 }}>{error}</Typography>
            </Paper>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : rows.length === 0 ? (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 800 }}>No experiments yet.</Typography>
              <Typography sx={{ color: "text.secondary" }}>Create one with "New".</Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {rows.map((r, index) => (
                <Grow
                  key={r.id}
                  in={animateRows}
                  timeout={350 + index * 110}
                  style={{ transformOrigin: "50% 0%" }}
                >
                  <Paper
                    elevation={0}
                    sx={(theme) => ({
                      borderRadius: 3,
                      px: 2,
                      py: 1.35,
                      border: "1px solid",
                      borderColor: alpha(theme.palette.common.white, 0.45),
                      background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.72)} 0%, ${alpha(
                        theme.palette.success.main,
                        0.08,
                      )} 100%)`,
                      backdropFilter: "blur(16px)",
                      boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.58)}, 0 12px 30px ${alpha(
                        theme.palette.common.black,
                        0.08,
                      )}`,
                      transition: "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
                      "&:hover": {
                        transform: "translateY(-4px) scale(1.01)",
                        borderColor: alpha(theme.palette.success.main, 0.35),
                        boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.62)}, 0 18px 38px ${alpha(
                          theme.palette.common.black,
                          0.12,
                        )}`,
                      },
                    })}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <BarChartOutlinedIcon sx={{ color: "text.primary" }} />

                      <Typography sx={{ flex: 1, fontWeight: 800, fontStyle: "italic" }}>
                        {r.name}
                      </Typography>

                      <Typography sx={{ width: 140, fontWeight: 800, textAlign: "center" }}>
                        {r.date}
                      </Typography>

                      <Box sx={{ width: 120, display: "flex", justifyContent: "center" }}>
                        <Chip label={r.status} size="small" sx={statusChipSx(r.status)} />
                      </Box>

                      <Stack direction="row" spacing={0.75} sx={{ width: 144, justifyContent: "flex-end" }}>
                        {/* View */}
                        <IconButton
                          aria-label="View"
                          onClick={() =>
                            r.status === "draft"
                              ? navigate(`/experiments/input?id=${r.id}`)
                              : navigate(`/experiments/output?id=${r.id}`)
                          }
                          sx={(theme) => ({
                            color: "text.primary",
                            bgcolor: alpha(theme.palette.common.white, 0.45),
                            border: "1px solid",
                            borderColor: alpha(theme.palette.common.white, 0.4),
                            backdropFilter: "blur(10px)",
                            transition: "background-color 180ms ease, transform 180ms ease",
                            "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.1), transform: "translateY(-1px)" },
                          })}
                        >
                          <VisibilityOutlinedIcon />
                        </IconButton>
                        {/* Rename */}
                        <IconButton
                          aria-label="Rename"
                          onClick={() => openRename(r)}
                          disabled={busyId === r.id}
                          sx={(theme) => ({
                            color: "text.primary",
                            bgcolor: alpha(theme.palette.common.white, 0.45),
                            border: "1px solid",
                            borderColor: alpha(theme.palette.common.white, 0.4),
                            backdropFilter: "blur(10px)",
                            transition: "background-color 180ms ease, transform 180ms ease",
                            "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.1), transform: "translateY(-1px)" },
                          })}
                        >
                          <DriveFileRenameOutlineIcon />
                        </IconButton>
                        {/* Delete */}
                        <IconButton
                          aria-label="Delete"
                          onClick={() => onDelete(r.id)}
                          disabled={busyId === r.id}
                          sx={(theme) => ({
                            color: "secondary.main",
                            bgcolor: alpha(theme.palette.common.white, 0.45),
                            border: "1px solid",
                            borderColor: alpha(theme.palette.common.white, 0.4),
                            backdropFilter: "blur(10px)",
                            transition: "background-color 180ms ease, transform 180ms ease",
                            "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.12), transform: "translateY(-1px)" },
                          })}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grow>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </>
  );
};

export default Dashboard;
