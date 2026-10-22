import React from "react";
import { EvidenceChart } from "../../data-app-public.jsx";

// Express count axes in explicit thousands so the browser's default locale
// cannot turn English chart units into Chinese compact-number suffixes.
// Reviewed source rows stay untouched and remain available in source inspection.
export function EnglishEvidenceChart({ rows, sourceRows, spec, ...props }) {
  const countFields = new Set(["stations", "points", "AC", "DC"]);
  const fields = spec.fields || [spec.y];
  if (!fields.length || !fields.every(field => countFields.has(field))) {
    return <EvidenceChart {...props} rows={rows} sourceRows={sourceRows} spec={spec} />;
  }
  const aliases = Object.fromEntries(fields.map(field => [field, `${field}Thousands`]));
  const displayRows = rows.map(row => ({
    ...row,
    ...Object.fromEntries(fields.map(field => [aliases[field], row[field] == null ? row[field] : row[field] / 1000])),
  }));
  const points = fields.some(field => ["points", "AC", "DC"].includes(field));
  const displaySpec = {
    ...spec,
    y: aliases[spec.y],
    ...(spec.fields ? { fields: fields.map(field => aliases[field]) } : {}),
    yLabel: points ? "Charging points (thousands)" : "Stations (thousands)",
    valueDecimals: 3,
    legend: {
      ...spec.legend,
      labels: { ...spec.legend?.labels, ...Object.fromEntries(fields.map(field => [aliases[field], field])) },
    },
  };
  return <EvidenceChart {...props} rows={displayRows} sourceRows={sourceRows} spec={displaySpec} />;
}
