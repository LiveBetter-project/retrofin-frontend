import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, Container } from "@mui/material";
import Header from "./Header";
import Footer from "./Footer";

const AppLayout = () => {
  const { pathname } = useLocation();

  // Adjust this only if your auth routes have different paths.
  const isAuthRoute = /^\/(auth|login|register)(\/)?$/.test(pathname);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        background: isAuthRoute
          ? "linear-gradient(160deg, #1a1821 0%, #201d29 55%, #1c1f26 100%)"
          : "linear-gradient(180deg, #FBFAF7 0%, #F7F4EF 46%, #F3EFEB 100%)",

        "@keyframes authWaveA": {
          "0%": {
            transform: "translate3d(-3%, 0%, 0) scale(1.02)",
          },
          "50%": {
            transform: "translate3d(2%, 3%, 0) scale(1.08)",
          },
          "100%": {
            transform: "translate3d(-1%, -2%, 0) scale(1.04)",
          },
        },

        "@keyframes authWaveB": {
          "0%": {
            transform: "translate3d(2%, -2%, 0) scale(1.04)",
          },
          "50%": {
            transform: "translate3d(-3%, 2%, 0) scale(1.1)",
          },
          "100%": {
            transform: "translate3d(1%, 1%, 0) scale(1.05)",
          },
        },

        "&::before": isAuthRoute
          ? {
              content: '""',
              position: "absolute",
              inset: 0,
              zIndex: 0,
              pointerEvents: "none",
            }
          : {
              content: '""',
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 0,
              opacity: 0.95,
              filter: "blur(8px)",
              background: `
                radial-gradient(circle at 10% 14%, rgba(236,200,150,0.26) 0%, rgba(236,200,150,0.12) 15%, rgba(236,200,150,0) 34%),
                radial-gradient(circle at 88% 18%, rgba(240,49,87,0.12) 0%, rgba(240,49,87,0.06) 14%, rgba(240,49,87,0) 32%),
                radial-gradient(circle at 80% 72%, rgba(236,200,150,0.18) 0%, rgba(236,200,150,0.08) 12%, rgba(236,200,150,0) 30%)
              `,
            },

        "&::after": isAuthRoute
          ? {
              content: '""',
              position: "absolute",
              inset: 0,
              zIndex: 0,
              pointerEvents: "none",
            }
          : {
              content: '""',
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 0,
              opacity: 0.32,
              backgroundImage: `
                linear-gradient(135deg, transparent 0%, transparent 68%, rgba(255,255,255,0.35) 68.2%, transparent 68.5%),
                linear-gradient(25deg, transparent 0%, transparent 74%, rgba(53,53,53,0.03) 74.2%, transparent 74.5%)
              `,
            },
      }}
    >
      {isAuthRoute && (
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <div className="auth-wave auth-wave--1" />
          <div className="auth-wave auth-wave--2" />
          <div className="auth-wave auth-wave--3" />
          <div className="auth-wave auth-wave--4" />
        </Box>
      )}

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Header />
      </Box>

      <Box
        component="main"
        sx={{
          flex: 1,
          py: isAuthRoute ? 0 : { xs: 3, md: 4 },
          position: "relative",
          zIndex: 1,
          display: isAuthRoute ? "flex" : "block",
        }}
      >
        <Container
          maxWidth="lg"
          sx={
            isAuthRoute
              ? {
                  display: "flex",
                  flex: 1,
                  alignItems: "center",
                }
              : undefined
          }
        >
          <Outlet />
        </Container>
      </Box>

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Footer />
      </Box>
    </Box>
  );
};

export default AppLayout;