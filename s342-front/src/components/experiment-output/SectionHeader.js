import React, { useState } from "react";
import { Box, IconButton, Popover, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { quietGreenPillSx } from "../experiment-input/constants";

// ---------------------------------------------------------------------------
// SectionHeader — quiet green pill + optional info popover + optional subtitle
// ---------------------------------------------------------------------------

const SectionHeader = ({ children, helpContent, subtitle }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  return (
    <Box sx={{ mb: subtitle ? 1 : 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          component="span"
          sx={(theme) => ({ ...quietGreenPillSx(theme), display: "inline-flex" })}
        >
          <Typography sx={{ fontWeight: 800, fontStyle: "italic", fontSize: 16 }}>
            {children}
          </Typography>
        </Box>
        {helpContent && (
          <>
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                p: 0.25,
                color: "text.disabled",
                "&:hover": { color: "text.secondary", bgcolor: "transparent" },
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              PaperProps={{
                sx: {
                  borderRadius: 2.5,
                  p: 2,
                  maxWidth: 360,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
                },
              }}
            >
              {helpContent}
            </Popover>
          </>
        )}
      </Box>
      {subtitle && (
        <Typography
          sx={{ fontSize: 13, color: "text.disabled", fontStyle: "italic", mt: 0.75, mb: 1 }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default SectionHeader;
