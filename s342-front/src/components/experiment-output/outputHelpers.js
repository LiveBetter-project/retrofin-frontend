import { labelFromKey } from "../experiment-input/constants";

// ---------------------------------------------------------------------------
// Chart constants
// ---------------------------------------------------------------------------

export const CHART_H = 180; // bar chart height in px

export const CHART_COLORS = [
  "#278A21", "#0d47a1", "#e65100", "#6a1b9a",
  "#00838f", "#c62828", "#558b2f", "#37474f",
];

// KPI rows shown in the matrix, in the required order
export const KPI_ROWS = [
  { key: "npv", label: "NPV",  format: "currency" },
  { key: "irr", label: "IRR",  format: "percent"  },
  { key: "roi", label: "ROI",  format: "percent"  },
  { key: "dpp", label: "DPP",  format: "years"    },
  { key: "pbp", label: "PBP",  format: "years"    },
];

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function fmtVal(format, value) {
  if (value == null) return "—";
  const n = Number(value);
  if (!isFinite(n)) return "—";
  if (format === "percent")  return `${(n * 100).toFixed(2)}%`;
  if (format === "currency") return `€${Math.round(n).toLocaleString()}`;
  if (format === "years")    return `${n.toFixed(1)} yr`;
  return n.toFixed(2);
}

export function fmtPct(value) {
  if (value == null) return "—";
  const n = Number(value);
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Data normalization
// Centralise all raw→display field mapping here so JSX stays clean.
// ---------------------------------------------------------------------------

export function normalizeResults(items) {
  return (items || []).map((item) => ({
    schemeType:  item.scheme_type,
    schemeName:  labelFromKey(item.scheme_type),
    successProb: item.pr_npv_positive, // Pr(NPV > 0)
    p50: {
      irr: item.irr_p50, npv: item.npv_p50,
      roi: item.roi_p50, dpp: item.dpp_p50, pbp: item.pbp_p50,
    },
    p10: {
      irr: item.irr_p10, npv: item.npv_p10,
      roi: item.roi_p10, dpp: item.dpp_p10, pbp: item.pbp_p10,
    },
    p95: {
      irr: item.irr_p95, npv: item.npv_p95,
      roi: item.roi_p95, dpp: item.dpp_p95, pbp: item.pbp_p95,
    },
  }));
}
