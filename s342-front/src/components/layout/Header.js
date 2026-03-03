import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

import Logo from "../Logo";
import API from "../../api/api";
import { useAuth } from "../../context/AuthProvider";

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    if (!isAuthenticated) {
      setProfile(null);
      return;
    }

    API.getProfile()
      .then((p) => {
        if (!mounted) return;
        setProfile(p || null);
      })
      .catch(() => {
        if (!mounted) return;
        setProfile(null);
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const displayName = useMemo(() => {
    if (!profile) return "User";
    return (
      profile.username ||
      profile.name ||
      profile.email ||
      profile.id ||
      "User"
    );
  }, [profile]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/auth?mode=login", { replace: true });
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        zIndex: (t) => t.zIndex.drawer + 1,
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: 72 }}>
        <Container
          maxWidth="lg"
          sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
        >
          {isAuthenticated && (
            <IconButton
              onClick={() => setOpen((v) => !v)}
              aria-label="Open menu"
              sx={{ mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box
            component={RouterLink}
            to="/"
            sx={{ display: "flex", alignItems: "center", gap: 0 }}
          >
            <Logo height={52} />
          </Box>

          <Box sx={{ flex: 1 }} />

          <Typography
            sx={{
              fontWeight: 800,
              fontStyle: "italic",
              fontSize: 20,
              color: "text.primary",
            }}
          >
            Juan's Glorious Risk Assessment Simulator
          </Typography>
        </Container>
      </Toolbar>

      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 300, p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <AccountCircleOutlinedIcon />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>
                {displayName}
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 13 }} noWrap>
                {profile?.email || ""}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          <List disablePadding>
            <ListItemButton
              onClick={() => {
                setOpen(false);
                navigate("/dashboard");
              }}
            >
              <ListItemIcon>
                <DashboardOutlinedIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                setOpen(false);
                navigate("/settings");
              }}
            >
              <ListItemIcon>
                <SettingsOutlinedIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>

            <ListItemButton onClick={handleLogout}>
              <ListItemIcon sx={{ color: "secondary.main", minWidth: 36 }}>
                <LogoutOutlinedIcon />
              </ListItemIcon>
              <ListItemText
                primary="Log out"
                primaryTypographyProps={{ sx: { color: "secondary.main", fontWeight: 800 } }}
              />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Header;