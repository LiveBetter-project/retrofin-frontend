import React from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";

const ExperimentOutput = () => {
  const [searchParams] = useSearchParams();
  const experimentId = searchParams.get("id");

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        Output
      </Typography>
      <Typography sx={{ color: "text.secondary" }}>
        Experiment: {experimentId}
      </Typography>
    </Box>
  );
};

export default ExperimentOutput;