import React from "react";
import {
  Box,
  Container,
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import LifeLogo from "../../assets/life_logo.jpg";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: (t) => t.palette.grey[100],
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>
              Quick links
            </Typography>
            <Stack spacing={0.75}>
              <Link component={RouterLink} to="/about" underline="hover" color="text.primary">
                About
              </Link>
              <Link component={RouterLink} to="/contact" underline="hover" color="text.primary">
                Contact us
              </Link>
              <Link component={RouterLink} to="/legal" underline="hover" color="text.primary">
                Legal
              </Link>
            </Stack>
          </Grid>

          <Grid item xs={12} md={8}>
            <Stack spacing={0.75} alignItems={{ xs: "flex-start", md: "flex-end" }}>
              <Link
                component={RouterLink}
                to="/privacy"
                underline="hover"
                color="text.primary"
              >
                Privacy and Cookie Policy
              </Link>
              <Typography sx={{ color: "text.secondary" }}>
                COPYRIGHT © 2025 LiveBetter-project
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 3,
            pt: 3,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            gap: 2,
            alignItems: "flex-start",
          }}
        >
          <Box
            component="img"
            src={LifeLogo}
            alt="LIFE Programme"
            sx={{ height: 45, width: "auto", flexShrink: 0 }}
          />
          <Typography sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.5 }}>
            Co-funded by the European Union under project CODENAME. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or CINEA. Neither the European Union nor the granting authority can be held responsible for them.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;