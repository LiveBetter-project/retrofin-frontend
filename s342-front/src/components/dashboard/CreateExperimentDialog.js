import React from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import TextInput from "../TextInput";

const CreateExperimentDialog = ({ open, onClose, name, onNameChange, creating, error, onConfirm }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="xs"
    fullWidth
    PaperProps={{
      sx: (theme) => ({
        borderRadius: 4,
        p: 1,
        border: "1px solid",
        borderColor: alpha(theme.palette.common.white, 0.55),
        background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.82)} 0%, ${alpha(
          theme.palette.grey[100],
          0.64,
        )} 100%)`,
        backdropFilter: "blur(20px)",
        boxShadow: `0 24px 60px ${alpha(theme.palette.common.black, 0.18)}`,
      }),
    }}
  >
    <DialogTitle sx={{ fontWeight: 800, fontStyle: "italic", pb: 1 }}>
      Name your experiment
    </DialogTitle>

    <DialogContent sx={{ pt: "20px !important" }}>
      <TextInput
        name="experimentName"
        label="Experiment Name"
        value={name}
        onChange={onNameChange}
        autoComplete="off"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !creating) onConfirm();
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
        onClick={onClose}
        disabled={creating}
        sx={{ color: "text.secondary", fontWeight: 700 }}
      >
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        disabled={creating || !name.trim()}
        variant="contained"
        endIcon={
          creating ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <ArrowForwardIcon />
          )
        }
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
        Next
      </Button>
    </DialogActions>
  </Dialog>
);

export default CreateExperimentDialog;
