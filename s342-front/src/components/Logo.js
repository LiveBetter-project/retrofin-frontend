import React from "react";
import { Box } from "@mui/material";
import LiveBetterLogo from "../assets/LiveBetter_Logo.svg";

const Logo = ({ height = 36, alt = "LiveBetter", sx }) => {
  return (
    <Box
      component="img"
      src={LiveBetterLogo}
      alt={alt}
      sx={{
        display: "block",
        height,
        width: "auto",
        ...sx,
      }}
    />
  );
};

export default Logo;