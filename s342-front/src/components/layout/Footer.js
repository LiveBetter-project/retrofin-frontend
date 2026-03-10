import React from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import GitHubIcon from "@mui/icons-material/GitHub";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";
import LifeLogo from "../../assets/life_logo.jpg";
import SiteLogo from "../../assets/LiveBetter_Logo.svg";

const BRAND = {
  primaryDark: "#353535",
  pink: "#F03157",
  green: "#278A21",
  sand: "#ECC896",
  white: "#FFFFFF",
};

const socialLinks = [
  {
    label: "Email",
    href: "mailto:contact@livebetter.eu",
    icon: <MailOutlineIcon fontSize="small" />,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/livebetter-project/",
    icon: <LinkedInIcon fontSize="small" />,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/livebetter.project.eu/",
    icon: <InstagramIcon fontSize="small" />,
  },
  {
    label: "GitHub",
    href: "https://github.com/LiveBetter-project",
    icon: <GitHubIcon fontSize="small" />,
  },
];

const Footer = () => {
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box component="footer" sx={{ mt: 6 }}>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 0,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          background:
            "linear-gradient(145deg, #232323 0%, #2E2E2E 40%, #3E393B 72%, #5A4751 100%)",
          color: BRAND.white,
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `
              radial-gradient(circle at 90% 88%, rgba(240, 49, 87, 0.18) 0%, rgba(236, 200, 150, 0.16) 18%, rgba(255,255,255,0) 42%),
              linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 30%)
            `,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.16,
            backgroundImage: `
              linear-gradient(120deg, transparent 0%, transparent 57%, rgba(255,255,255,0.14) 57.2%, transparent 57.5%),
              linear-gradient(150deg, transparent 0%, transparent 73%, rgba(255,255,255,0.10) 73.2%, transparent 73.5%),
              linear-gradient(30deg, transparent 0%, transparent 74%, rgba(255,255,255,0.08) 74.2%, transparent 74.5%)
            `,
          },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{ position: "relative", zIndex: 1, py: { xs: 3, md: 3 } }}
        >
          <Grid container spacing={{ xs: 4, md: 5 }}>
            <Grid item xs={12} md={7}>
              <Stack spacing={2} sx={{ maxWidth: 620 }}>
                <Box
                  component="img"
                  src={SiteLogo}
                  alt="LiveBetter"
                  sx={{
                    height: { xs: 42, md: 50 },
                    width: "auto",
                    display: "block",
                  }}
                />

                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.82)",
                    fontSize: 15,
                    lineHeight: 1.85,
                    maxWidth: 580,
                  }}
                >
                  LiveBetter accelerates deep renovation in Europe with a
                  Standardised Digital Buildings Hub, high-quality data, and 15
                  market-ready AI-powered services from 24 EU-funded projects.
                  Through 6 unique real-world Business Cases and cross-sector
                  collaboration, it turns better building data into real
                  renovation action.
                </Typography>

                <Stack direction="row" spacing={1.25}>
                  {socialLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                      rel={item.href.startsWith("mailto:") ? undefined : "noreferrer"}
                      aria-label={item.label}
                      sx={{
                        width: 40,
                        height: 40,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        color: BRAND.white,
                        border: "1px solid rgba(255,255,255,0.18)",
                        bgcolor: "rgba(255,255,255,0.03)",
                        transition: "all 0.18s ease",
                        "&:hover": {
                          bgcolor: "rgba(236,200,150,0.12)",
                          borderColor: "rgba(236,200,150,0.55)",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      {item.icon}
                    </Link>
                  ))}
                </Stack>

                <Button
                  onClick={handleBackToTop}
                  startIcon={<KeyboardDoubleArrowUpIcon />}
                  variant="outlined"
                  sx={{
                    alignSelf: "flex-start",
                    px: 2.2,
                    py: 1.1,
                    borderRadius: "999px",
                    color: BRAND.white,
                    borderColor: "rgba(255,255,255,0.22)",
                    bgcolor: "rgba(255,255,255,0.02)",
                    textTransform: "uppercase",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.7,
                    "&:hover": {
                      borderColor: "rgba(236,200,150,0.55)",
                      bgcolor: "rgba(236,200,150,0.08)",
                    },
                  }}
                >
                  Back to the top
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack spacing={3}>
                <Box>
                  <Typography
                    sx={{
                      mb: 1.5,
                      fontWeight: 700,
                      fontSize: 18,
                      color: BRAND.white,
                    }}
                  >
                    Contact Us
                  </Typography>

                  <Stack spacing={1.2}>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.84)",
                        fontSize: 15,
                        lineHeight: 1.7,
                      }}
                    >
                      Prof. Vaggelis Marinakis{" "}
                      <Link
                        href="mailto:vmarinakis@epu.ntua.gr"
                        underline="hover"
                        sx={{ color: BRAND.sand }}
                      >
                        vmarinakis@epu.ntua.gr
                      </Link>
                    </Typography>

                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.84)",
                        fontSize: 15,
                        lineHeight: 1.7,
                      }}
                    >
                      Dr. Elissaios Sarmas{" "}
                      <Link
                        href="mailto:esarmas@epu.ntua.gr"
                        underline="hover"
                        sx={{ color: BRAND.sand }}
                      >
                        esarmas@epu.ntua.gr
                      </Link>
                    </Typography>

                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.84)",
                        fontSize: 15,
                        lineHeight: 1.7,
                      }}
                    >
                      Vasilis Michalakopoulos{" "}
                      <Link
                        href="mailto:vmichalakopoulos@epu.ntua.gr"
                        underline="hover"
                        sx={{ color: BRAND.sand }}
                      >
                        vmichalakopoulos@epu.ntua.gr
                      </Link>
                    </Typography>
                  </Stack>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      mb: 1.5,
                      fontWeight: 700,
                      fontSize: 18,
                      color: BRAND.white,
                    }}
                  >
                    LiveBetter Homepage
                  </Typography>

                  <Button
                    href="https://livebetterproject.eu/"
                    target="_blank"
                    rel="noreferrer"
                    variant="contained"
                    sx={{
                      px: 2.5,
                      py: 1,
                      borderRadius: "999px",
                      textTransform: "none",
                      fontWeight: 700,
                      color: "#000",
                      bgcolor: BRAND.sand,
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: "#e4be87",
                        boxShadow: "none",
                      },
                    }}
                  >
                    Homepage
                  </Button>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ mb: 1.5, borderColor: "rgba(255,255,255,0.12)" }} />

              <Box
                sx={{
                  width: "100%",
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ xs: "flex-start", sm: "flex-start" }}
                >
                  <Box
                    component="img"
                    src={LifeLogo}
                    alt="LIFE Programme"
                    sx={{
                      height: 48,
                      width: "auto",
                      flexShrink: 0,
                      borderRadius: 1,
                      bgcolor: "#fff",
                      p: 0.5,
                    }}
                  />
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.78)",
                      fontSize: 14,
                      lineHeight: 1.7,
                      fontStyle: "italic",
                    }}
                  >
                    Co-funded by the European Union under project 101215721.
                    Views and opinions expressed are however those of the
                    author(s) only and do not necessarily reflect those of the
                    European Union or CINEA. Neither the European Union nor the
                    granting authority can be held responsible for them.
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100vw",
            left: "50%",
            transform: "translateX(-50%)",
            bgcolor: BRAND.sand,
            color: "#000",
            borderTop: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <Container maxWidth="lg" sx={{ py: 1.25 }}>
            <Typography
              sx={{
                textAlign: "center",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: 0.2,
              }}
            >
              COPYRIGHT © 2025 LiveBetter-project. All rights reserved.
            </Typography>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;