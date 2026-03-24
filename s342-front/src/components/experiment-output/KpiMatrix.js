import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import FilterListIcon from "@mui/icons-material/FilterList";

import { fmtVal, KPI_ROWS } from "./outputHelpers";

// ---------------------------------------------------------------------------
// KpiMatrix — comparison table with expand/collapse and scheme filter
// ---------------------------------------------------------------------------

const KpiMatrix = ({ schemes, colorMap }) => {
  const [expandedKpis, setExpandedKpis] = useState({});
  const [filterAnchor, setFilterAnchor]  = useState(null);

  // Derive initial set from scheme types; re-sync when schemes list changes
  const schemeKey = schemes.map((s) => s.schemeType).join(",");
  const [selectedTypes, setSelectedTypes] = useState(
    () => new Set(schemes.map((s) => s.schemeType)),
  );
  useEffect(() => {
    setSelectedTypes(new Set(schemes.map((s) => s.schemeType)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemeKey]);

  const visible = useMemo(
    () => schemes.filter((s) => selectedTypes.has(s.schemeType)),
    [schemes, selectedTypes],
  );

  const toggleKpi = (key) =>
    setExpandedKpis((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleType = (type) =>
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });

  const handleBulkFilter = () => {
    if (selectedTypes.size === schemes.length) {
      setSelectedTypes(new Set());
    } else {
      setSelectedTypes(new Set(schemes.map((s) => s.schemeType)));
    }
  };

  return (
    <Box>
      {/* Filter button */}
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <IconButton
          size="small"
          onClick={(e) => setFilterAnchor(e.currentTarget)}
          sx={{ borderRadius: 2, gap: 0.5 }}
        >
          <FilterListIcon fontSize="small" />
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Filter</Typography>
        </IconButton>
        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
        >
          <MenuItem dense onClick={handleBulkFilter}>
            <Checkbox
              indeterminate={selectedTypes.size > 0 && selectedTypes.size < schemes.length}
              checked={schemes.length > 0 && selectedTypes.size === schemes.length}
              size="small"
              sx={{ p: 0.5, mr: 0.5 }}
            />
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
              {schemes.length > 0 && selectedTypes.size === schemes.length
                ? "Deselect all"
                : "Select all"}
            </Typography>
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          {schemes.map((s) => (
            <MenuItem key={s.schemeType} dense onClick={() => toggleType(s.schemeType)}>
              <Checkbox
                checked={selectedTypes.has(s.schemeType)}
                size="small"
                sx={{ p: 0.5, mr: 0.5, color: colorMap[s.schemeType] }}
              />
              {s.schemeName}
            </MenuItem>
          ))}
        </Menu>
      </Stack>

      {/* Matrix table */}
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, minWidth: 120, bgcolor: "grey.100" }}>KPI</TableCell>
              <TableCell sx={{ fontWeight: 800, minWidth: 110, bgcolor: "grey.100" }}>Scenario</TableCell>
              {visible.map((s) => (
                <TableCell
                  key={s.schemeType}
                  sx={{ fontWeight: 800, textAlign: "center", bgcolor: "grey.100", minWidth: 110 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        bgcolor: colorMap[s.schemeType],
                        borderRadius: "50%",
                        flexShrink: 0,
                      }}
                    />
                    <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{s.schemeName}</Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {KPI_ROWS.map(({ key, label, format }) => {
              const expanded = Boolean(expandedKpis[key]);
              return (
                <React.Fragment key={key}>
                  {/* p50 — default/median row */}
                  <TableRow sx={{ bgcolor: expanded ? alpha("#278A21", 0.03) : undefined }}>
                    <TableCell sx={{ fontWeight: 900, fontStyle: "italic" }}>
                      <Stack direction="row" alignItems="center" spacing={0.25}>
                        <IconButton size="small" onClick={() => toggleKpi(key)} sx={{ p: 0.25 }}>
                          {expanded
                            ? <ExpandLessIcon fontSize="small" />
                            : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                        <Typography sx={{ fontWeight: 900, fontStyle: "italic", fontSize: 14 }}>
                          {label}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>Median</TableCell>
                    {visible.map((s) => (
                      <TableCell key={s.schemeType} sx={{ textAlign: "center", fontWeight: 700 }}>
                        {fmtVal(format, s.p50?.[key])}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* p10 — worst */}
                  {expanded && (
                    <TableRow sx={{ bgcolor: alpha("#c62828", 0.025) }}>
                      <TableCell />
                      <TableCell sx={{ fontSize: 12, color: "error.light", fontStyle: "italic" }}>
                        Worst
                      </TableCell>
                      {visible.map((s) => (
                        <TableCell
                          key={s.schemeType}
                          sx={{ textAlign: "center", fontSize: 13, color: "text.secondary" }}
                        >
                          {fmtVal(format, s.p10?.[key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}

                  {/* p95 — best */}
                  {expanded && (
                    <TableRow sx={{ bgcolor: alpha("#278A21", 0.025) }}>
                      <TableCell />
                      <TableCell sx={{ fontSize: 12, color: "success.main", fontStyle: "italic" }}>
                        Best
                      </TableCell>
                      {visible.map((s) => (
                        <TableCell
                          key={s.schemeType}
                          sx={{ textAlign: "center", fontSize: 13, color: "text.secondary" }}
                        >
                          {fmtVal(format, s.p95?.[key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default KpiMatrix;
