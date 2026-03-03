import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import API from "../api/api";
import { useAuth } from "../context/AuthProvider";

const Settings = () => {
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    if (!isAuthenticated) {
      setLoading(false);
      setProfile(null);
      return;
    }

    setLoading(true);
    setError("");

    API.getProfile()
      .then((p) => {
        if (!mounted) return;
        setProfile(p || null);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Failed to load user profile.");
        setProfile(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const data = useMemo(() => {
    if (!profile) return null;

    const first = profile.first_name || "";
    const last = profile.last_name || "";

    const rest = [
      { label: "Username", value: profile.username || "" },
      { label: "Email", value: profile.email || "" },
      { label: "User ID", value: profile.id || "" },
    ].filter((x) => x.value !== "");

    return { first, last, rest };
  }, [profile]);

  return (
    <Box sx={{ maxWidth: 550, mx: "auto" }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        Settings
      </Typography>

      {/* Pink frame */}
      <Box
        sx={{
          bgcolor: "secondary.main",
          p: { xs: 1, md: 0.3 }, // frame thickness
          borderRadius: 2.5,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: (t) => t.palette.grey[200], // same grey as dashboard
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography sx={{ color: "error.main", fontWeight: 700 }}>
              {error}
            </Typography>
          ) : !data ? (
            <Typography sx={{ color: "text.secondary" }}>
              No profile fields returned by backend.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {/* First + Last side-by-side */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="First Name"
                    value={data.first}
                    disabled
                    fullWidth
                    variant="outlined"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Last Name"
                    value={data.last}
                    disabled
                    fullWidth
                    variant="outlined"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>

              {/* Remaining fields full width */}
              {data.rest.map((f) => (
                <TextField
                  key={f.label}
                  label={f.label}
                  value={f.value}
                  disabled
                  fullWidth
                  variant="outlined"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Settings;