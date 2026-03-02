import React from "react";
import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import Logo from "../Logo";

const Header = () => {
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
            Risk Assessment Simulator
            </Typography>
        </Container>
      </Toolbar>
    </AppBar>
  );
};

export default Header;