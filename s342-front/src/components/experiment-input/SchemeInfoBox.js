import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { SCHEME_INFO, INFO_COLORS } from "./constants";

const SchemeInfoBox = ({ schemeKey, compact = false }) => {
  const info = SCHEME_INFO[schemeKey] || {};
  if (!info.description) return null;

  const InfoLabel = ({ label, color }) => (
    <Typography
      sx={{
        fontSize: compact ? 10 : 11,
        fontWeight: 900,
        color,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        mb: 0.25,
        mt: compact ? 0.75 : 1,
      }}
    >
      {label}
    </Typography>
  );

  const BulletList = ({ items }) =>
    items.map((item, i) => (
      <Typography
        key={i}
        sx={{ fontSize: compact ? 12 : 13, color: "text.secondary", lineHeight: 1.5 }}
      >
        {"• "}
        {item}
      </Typography>
    ));

  return (
    <Box
      sx={
        compact
          ? { pb: 0.5 }
          : (theme) => ({
              border: "1px solid",
              borderColor: alpha(theme.palette.common.white, 0.45),
              borderRadius: 2.5,
              px: 2.2,
              py: 1.5,
              mb: 1.5,
              background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.76)} 0%, ${alpha(
                theme.palette.success.main,
                0.07,
              )} 100%)`,
              backdropFilter: "blur(14px)",
              boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.58)}, 0 10px 24px ${alpha(
                theme.palette.common.black,
                0.06,
              )}`,
            })
      }
    >
      <Typography
        sx={{
          fontSize: 13,
          color: "text.secondary",
          fontStyle: "italic",
          mb: 0.5,
        }}
      >
        {info.description}
      </Typography>

      <Stack direction="row" flexWrap="wrap" columnGap={3} rowGap={0}>
        {info.lender && (
          <Box>
            <InfoLabel label="Lender" color={INFO_COLORS.lender} />
            <Typography sx={{ fontSize: compact ? 12 : 13 }}>{info.lender}</Typography>
          </Box>
        )}
        {info.projectSize && (
          <Box>
            <InfoLabel label="Project Size" color={INFO_COLORS.projectSize} />
            <Typography sx={{ fontSize: compact ? 12 : 13 }}>{info.projectSize}</Typography>
          </Box>
        )}
        {info.goodFor && (
          <Box>
            <InfoLabel label="Good For" color={INFO_COLORS.goodFor} />
            <Typography sx={{ fontSize: compact ? 12 : 13 }}>{info.goodFor}</Typography>
          </Box>
        )}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          columnGap: 1,
          rowGap: 1,
          mt: 0.5,
        }}
      >
        {info.advantages?.length > 0 && (
          <Box>
            <InfoLabel label="Advantages" color={INFO_COLORS.advantages} />
            <BulletList items={info.advantages} />
          </Box>
        )}
        {info.disadvantages?.length > 0 && (
          <Box>
            <InfoLabel label="Disadvantages" color={INFO_COLORS.disadvantages} />
            <BulletList items={info.disadvantages} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SchemeInfoBox;
