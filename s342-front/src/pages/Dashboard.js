import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import ExperimentsAPI from "../api/experiments";
import TextInput from "../components/TextInput";

const formatDDMMYY = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

/** Generates a default experiment name like the backend would. */
const defaultExpName = () => {
  const ts = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  return `Experiment_${ts}`;
};

const statusChipSx = (status) => {
  const base = { fontWeight: 700, textTransform: "capitalize" };
  if (status === "completed") return { ...base, bgcolor: "success.main", color: "common.white" };
  if (status === "running") return { ...base, bgcolor: "warning.main", color: "common.white" };
  if (status === "failed") return { ...base, bgcolor: "error.main", color: "common.white" };
  if (status === "ready") return { ...base, bgcolor: "primary.main", color: "common.white" };
  return { ...base, bgcolor: "grey.400", color: "common.white" }; // draft or unknown
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // --- Dialog state ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogName, setDialogName] = useState("");

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

  useEffect(() => {
    load();
  }, []);

  // Opens the dialog with a fresh default name
  const onOpenDialog = () => {
    setDialogName(defaultExpName());
    setError("");
    setDialogOpen(true);
  };

  const onCloseDialog = () => {
    if (creating) return; // don't close while submitting
    setDialogOpen(false);
  };

  // Called when the user clicks "Next >" inside the dialog
  const onCreateConfirm = async () => {
    const name = dialogName.trim();
    setCreating(true);
    setError("");
    try {
      const exp = await ExperimentsAPI.create(name ? { name } : {});
      const id = exp?.id;
      if (id) {
        setDialogOpen(false);
        navigate(`/experiments/${id}/input`);
      } else {
        setError("Experiment created but no id was returned.");
      }
    } catch (e) {
      setError("Failed to create experiment.");
    } finally {
      setCreating(false);
    }
  };

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

  const rows = useMemo(() => {
    return items.map((x) => {
      const runDate = x?.latest_run?.finished_at || x?.latest_run?.created_at || x?.updated_at || x?.created_at;
      return {
        id: x?.id,
        name: x?.name || "Untitled Experiment",
        date: formatDDMMYY(runDate),
        status: x?.status || "draft",
      };
    });
  }, [items]);

  return (
    <>
      {/* ── Naming dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={onCloseDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontStyle: "italic", pb: 1 }}>
          Name your experiment
        </DialogTitle>

        <DialogContent sx={{ pt: "20px !important" }}>
          <TextInput
            name="experimentName"
            label="Experiment Name"
            value={dialogName}
            onChange={(e) => setDialogName(e.target.value)}
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !creating) onCreateConfirm();
            }}
          />
          {error && (
            <Typography sx={{ color: "error.main", mt: 1, fontWeight: 700, fontSize: 13 }}>
              {error}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "flex-end" }}>
          <Button
            onClick={onCloseDialog}
            disabled={creating}
            sx={{ color: "text.secondary", fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            onClick={onCreateConfirm}
            disabled={creating || !dialogName.trim()}
            variant="contained"
            endIcon={creating ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardIcon />}
            sx={{
              bgcolor: "success.main",
              "&:hover": { bgcolor: "success.dark" },
              "&.Mui-disabled": { bgcolor: "success.light", color: "common.white" },
              borderRadius: "999px",
              px: 3,
              fontWeight: 800,
            }}
          >
            Next
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Main dashboard ── */}
      <Box
        sx={{
          bgcolor: "secondary.main",       // pink frame
          p: { xs: 1, md: 0.3 },           // thickness of the "margin"
          borderRadius: 2.5,
        }}
      >
        <Box
          sx={{
            bgcolor: (t) => t.palette.grey[200],
            borderRadius: 2,
            p: { xs: 2, md: 4 },
            minHeight: 560,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 2.25,
                py: 1,
                borderRadius: "999px",
                border: "2px solid",
                borderColor: "secondary.main",
                bgcolor: "common.white",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              }}
            >
              <Typography sx={{ fontWeight: 800, fontStyle: "italic" }}>
                Experiment History
              </Typography>
            </Box>

            <Button
              onClick={onOpenDialog}
              disabled={creating}
              variant="contained"
              startIcon={<PlayArrowIcon />}
              sx={{
                bgcolor: "success.main",
                "&:hover": { bgcolor: "success.dark" },
                borderRadius: "999px",
                px: 3,
                py: 1.1,
                fontWeight: 800,
                boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
              }}
            >
              New
            </Button>
          </Stack>

          <Stack direction="row" sx={{ mb: 1.25, px: 1 }}>
            <Typography sx={{ flex: 1, fontWeight: 800, fontStyle: "italic", color: "text.secondary" }}>
              Experiment Title
            </Typography>
            <Typography sx={{ width: 140, fontWeight: 800, fontStyle: "italic", color: "text.secondary", textAlign: "left" }}>
              Date
            </Typography>
            <Typography sx={{ width: 120, fontWeight: 800, fontStyle: "italic", color: "text.secondary", textAlign: "left" }}>
              Status
            </Typography>
            <Box sx={{ width: 120 }} />
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
              {rows.map((r) => (
                <Paper
                  key={r.id}
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor: "success.main",
                    bgcolor: "white",
                    px: 2,
                    py: 1.25,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <BarChartOutlinedIcon sx={{ color: "text.primary" }} />

                    <Typography sx={{ flex: 1, fontWeight: 800, fontStyle: "italic" }}>
                      {r.name}
                    </Typography>

                    <Typography sx={{ width: 140, fontWeight: 800 }}>
                      {r.date}
                    </Typography>

                    <Box sx={{ width: 120 }}>
                      <Chip label={r.status} size="small" sx={statusChipSx(r.status)} />
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ width: 120, justifyContent: "flex-end" }}>
                      <IconButton
                        aria-label="Delete"
                        onClick={() => onDelete(r.id)}
                        disabled={busyId === r.id}
                        sx={{ color: "secondary.main" }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>

                      <IconButton
                        aria-label="View"
                        onClick={() => navigate(`/experiments/${r.id}/output`)}
                        sx={{ color: "text.primary" }}
                      >
                        <VisibilityOutlinedIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </>
  );
};

export default Dashboard;
