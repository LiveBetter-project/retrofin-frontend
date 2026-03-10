import React from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";

const ExperimentOutput = () => {
  const { experimentId } = useParams();

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