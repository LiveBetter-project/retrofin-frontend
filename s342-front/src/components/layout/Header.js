import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import Logo from "../Logo";
import API from "../../api/api";
import { useAuth } from "../../context/AuthProvider";

const BRAND = {
  primaryDark: "#353535",
  pink: "#F03157",
  green: "#278A21",
  sand: "#ECC896",
  white: "#FFFFFF",
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      profile.username || profile.name || profile.email || profile.id || "User"
    );
  }, [profile]);

  const pageLabel = useMemo(() => {
    const path = location.pathname;

    if (path === "/") return "Overview";
    if (path.startsWith("/dashboard")) return "Dashboard";
    if (path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/auth")) return "Authentication";

    return (
      path
        .split("/")
        .filter(Boolean)
        .map((part) =>
          part.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        )
        .join(" / ") || "Overview"
    );
  }, [location.pathname]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/auth?mode=login", { replace: true });
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          top: 12,
          background: "transparent",
          boxShadow: "none",
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              mt: 1.5,
              mb: 1,
              borderRadius: "22px",
              border: scrolled
                ? "1px solid rgba(53,53,53,0.10)"
                : "1px solid rgba(53,53,53,0.06)",
              background: scrolled
                ? "rgba(255,255,255,0.82)"
                : "rgba(255,255,255,0.72)",
              backdropFilter: scrolled ? "blur(18px)" : "blur(12px)",
              WebkitBackdropFilter: scrolled ? "blur(18px)" : "blur(12px)",
              boxShadow: scrolled
                ? "0 14px 40px rgba(0,0,0,0.10)"
                : "0 8px 24px rgba(0,0,0,0.05)",
              transition:
                "background 180ms ease, box-shadow 180ms ease, border-color 180ms ease, backdrop-filter 180ms ease",
              overflow: "hidden",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "linear-gradient(90deg, rgba(236,200,150,0.10) 0%, rgba(236,200,150,0.04) 22%, rgba(255,255,255,0) 52%)",
              },
            }}
          >
            <Toolbar
              disableGutters
              sx={{
                minHeight: 74,
                px: { xs: 1.25, sm: 1.75, md: 2 },
                gap: 1.5,
              }}
            >
              {/* Left zone */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.25}
                sx={{ minWidth: 0, flex: "0 0 auto", flexShrink: 0 }}
              >
                {isAuthenticated && (
                  <IconButton
                    onClick={() => setOpen((v) => !v)}
                    aria-label="Toggle menu"
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "14px",
                      color: BRAND.primaryDark,
                      background: "rgba(255,255,255,0.46)",
                      border: "1px solid rgba(53,53,53,0.08)",
                      transition: "all 0.18s ease",
                      "&:hover": {
                        background: "rgba(236,200,150,0.20)",
                        borderColor: "rgba(236,200,150,0.55)",
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                )}

                <Box
                  component={RouterLink}
                  to="/"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    minWidth: 0,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 52,
                      px: 1.1,
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.52)",
                      border: "1px solid rgba(53,53,53,0.08)",
                    }}
                  >
                    <Logo height={38} />
                  </Box>

                  <Box
                    sx={{
                      display: { xs: "none", sm: "block" },
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: 1.2,
                        textTransform: "uppercase",
                        color: "rgba(53,53,53,0.55)",
                        lineHeight: 1.1,
                        mb: 0.35,
                      }}
                    >
                      LiveBetter
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { sm: 13, md: 14 },
                        fontWeight: 700,
                        color: BRAND.primaryDark,
                        letterSpacing: 0.35,
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Risk Assessment Simulator
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              {/* Center zone */}
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  px: 1,
                  minWidth: 0,
                }}
              >
                <Chip
                  label={pageLabel}
                  variant="outlined"
                  sx={{
                    maxWidth: "100%",
                    height: 34,
                    borderRadius: "999px",
                    borderColor: "rgba(53,53,53,0.10)",
                    background: "rgba(255,255,255,0.38)",
                    color: "rgba(53,53,53,0.82)",
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: 0.55,
                    textTransform: "uppercase",
                    "& .MuiChip-label": {
                      px: 1.75,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  }}
                />
              </Box>

              {/* Right zone */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  flex: "0 0 auto",
                  flexShrink: 0,
                  justifyContent: "flex-end",
                }}
              >
                {isAuthenticated && (
                  <>
                    <Box
                      onClick={() => navigate("/settings")}
                      role="button"
                      aria-label="Open account menu"
                      sx={{
                        display: { xs: "none", sm: "flex" },
                        alignItems: "center",
                        gap: 1,
                        pl: 0.9,
                        pr: 0.8,
                        py: 0.7,
                        borderRadius: "999px",
                        cursor: "pointer",
                        userSelect: "none",
                        background: "rgba(255,255,255,0.46)",
                        border: "1px solid rgba(53,53,53,0.08)",
                        transition: "all 0.18s ease",
                        "&:hover": {
                          background: "rgba(236,200,150,0.20)",
                          borderColor: "rgba(236,200,150,0.55)",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          bgcolor: "rgba(240,49,87,0.12)",
                          color: BRAND.pink,
                          fontSize: 15,
                          fontWeight: 800,
                        }}
                      >
                        {(displayName || "U").charAt(0).toUpperCase()}
                      </Avatar>

                      <Box sx={{ minWidth: 0, maxWidth: 140 }}>
                        <Typography
                          noWrap
                          sx={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: BRAND.primaryDark,
                            lineHeight: 1.1,
                          }}
                        >
                          {displayName}
                        </Typography>
                        <Typography
                          noWrap
                          sx={{
                            fontSize: 11.5,
                            color: "rgba(53,53,53,0.55)",
                            lineHeight: 1.2,
                            mt: 0.2,
                          }}
                        >
                          {profile?.email || "Account"}
                        </Typography>
                      </Box>

                      <ChevronRightRoundedIcon
                        sx={{
                          color: "rgba(53,53,53,0.45)",
                          fontSize: 20,
                        }}
                      />
                    </Box>
                  </>
                )}
              </Stack>
            </Toolbar>
          </Box>
        </Container>
      </AppBar>

      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            m: 1.5,
            ml: 1.5,
            height: "calc(100% - 24px)",
            borderRadius: "24px",
            border: "1px solid rgba(53,53,53,0.08)",
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.16)",
            overflow: "hidden",
            backgroundImage:
              "linear-gradient(180deg, rgba(236,200,150,0.14) 0%, rgba(255,255,255,0.00) 28%)",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              p: 1.25,
              borderRadius: "18px",
              background: "rgba(255,255,255,0.66)",
              border: "1px solid rgba(53,53,53,0.08)",
              mb: 2,
            }}
          >
            <Avatar
              sx={{
                width: 46,
                height: 46,
                bgcolor: "rgba(240,49,87,0.12)",
                color: BRAND.pink,
                fontWeight: 800,
              }}
            >
              {(displayName || "U").charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: BRAND.primaryDark,
                }}
                noWrap
              >
                {displayName}
              </Typography>
              <Typography
                sx={{
                  color: "rgba(53,53,53,0.60)",
                  fontSize: 13,
                  mt: 0.35,
                }}
                noWrap
              >
                {profile?.email || ""}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 1.5, borderColor: "rgba(53,53,53,0.08)" }} />

          <List disablePadding sx={{ display: "grid", gap: 0.75 }}>
            <ListItemButton
              onClick={() => {
                setOpen(false);
                navigate("/dashboard");
              }}
              sx={{
                borderRadius: "16px",
                minHeight: 48,
                "&:hover": {
                  backgroundColor: "rgba(236,200,150,0.16)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: BRAND.primaryDark }}>
                <DashboardOutlinedIcon />
              </ListItemIcon>
              <ListItemText
                primary="Dashboard"
                primaryTypographyProps={{
                  sx: { fontWeight: 700, color: BRAND.primaryDark },
                }}
              />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                setOpen(false);
                navigate("/settings");
              }}
              sx={{
                borderRadius: "16px",
                minHeight: 48,
                "&:hover": {
                  backgroundColor: "rgba(236,200,150,0.16)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: BRAND.primaryDark }}>
                <SettingsOutlinedIcon />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                primaryTypographyProps={{
                  sx: { fontWeight: 700, color: BRAND.primaryDark },
                }}
              />
            </ListItemButton>

            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: "16px",
                minHeight: 48,
                "&:hover": {
                  backgroundColor: "rgba(240,49,87,0.08)",
                },
              }}
            >
              <ListItemIcon sx={{ color: BRAND.pink, minWidth: 38 }}>
                <LogoutOutlinedIcon />
              </ListItemIcon>
              <ListItemText
                primary="Log out"
                primaryTypographyProps={{
                  sx: { color: BRAND.pink, fontWeight: 800 },
                }}
              />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
