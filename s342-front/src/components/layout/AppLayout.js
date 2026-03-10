import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, Container } from "@mui/material";
import Header from "./Header";
import Footer from "./Footer";

const AppLayout = () => {
  const { pathname } = useLocation();

  // Adjust this only if your auth routes have different paths.
  const isAuthRoute = /^\/(login|register)(\/)?$/.test(pathname);

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
          ? "linear-gradient(180deg, #FFFDF9 0%, #F8F1E8 48%, #F5ECE3 100%)"
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
              inset: "-14% -10%",
              zIndex: 0,
              pointerEvents: "none",
              opacity: 1,
              filter: "blur(14px)",
              background: `
                radial-gradient(48% 62% at -6% 48%, rgba(240,49,87,0.34) 0%, rgba(240,49,87,0.18) 34%, rgba(240,49,87,0) 72%),
                radial-gradient(52% 64% at 106% 52%, rgba(236,200,150,0.50) 0%, rgba(236,200,150,0.24) 36%, rgba(236,200,150,0) 72%),
                radial-gradient(60% 24% at 50% -4%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.38) 38%, rgba(255,255,255,0) 74%),
                radial-gradient(60% 24% at 50% 104%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.28) 38%, rgba(255,255,255,0) 74%)
              `,
              animation: "authWaveA 12s ease-in-out infinite alternate",
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
              inset: "-10%",
              zIndex: 0,
              pointerEvents: "none",
              opacity: 0.95,
              filter: "blur(10px)",
              background: `
                radial-gradient(28% 22% at 18% 18%, rgba(236,200,150,0.28) 0%, rgba(236,200,150,0.10) 42%, rgba(236,200,150,0) 74%),
                radial-gradient(24% 20% at 84% 20%, rgba(240,49,87,0.24) 0%, rgba(240,49,87,0.10) 42%, rgba(240,49,87,0) 74%),
                radial-gradient(22% 18% at 82% 82%, rgba(39,138,33,0.14) 0%, rgba(39,138,33,0.06) 40%, rgba(39,138,33,0) 74%),
                linear-gradient(135deg, transparent 0%, transparent 66%, rgba(255,255,255,0.44) 66.2%, transparent 66.7%),
                linear-gradient(25deg, transparent 0%, transparent 73%, rgba(53,53,53,0.04) 73.2%, transparent 73.8%)
              `,
              animation: "authWaveB 16s ease-in-out infinite alternate",
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