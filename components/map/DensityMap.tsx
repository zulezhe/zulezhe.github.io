"use client"

import { useEffect, useRef } from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import styles from "./density-map.module.css"

// Static exports don't emit MapLibre's worker module, so we must point the
// library at a vendored copy. This must run at module scope (before any map /
// worker pool is created), otherwise MapLibre falls back to an empty worker
// URL and the map renders nothing. NEXT_PUBLIC_BASE_PATH is inlined by Next.
const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "")
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl(`${base}/vendor/maplibre-gl-worker.mjs`)
}

const BASEMAPS: Record<"light" | "dark", string> = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
}

export type DensityRamp = { t: number; color: string }[]
export type DensityScheme = {
  id: string
  metric: string
  ramp: DensityRamp
  rangeLabel: string
}

type Props = {
  basePath: string
  sourceUrl: string
  boundaryUrl: string
  scheme: DensityScheme
  theme: "light" | "dark"
  focus: string | null
  /**
   * Expression that reads the current weight metric from each feature.
   * Defaults to the scheme's static metric; playback passes a per-frame
   * blend expression so the heat map can animate through the years.
   */
  metricExpression?: Expression
  className?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Expression = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StyleLayer = any

/** Build an interpolate() expression mapping 0..1 on `metric` to the theme ramp. */
function rampExpression(metric: string, ramp: DensityRamp): Expression {
  return ["interpolate", ["linear"], ["get", metric], ...ramp.flatMap(item => [item.t, item.color])]
}

/** Heatmap-color ramp: 0-transparent at the low end for a soft glow. */
function heatColorExpression(ramp: DensityRamp): Expression {
  const stops = ramp.map(item => [item.t, item.color] as [number, string])
  return ["interpolate", ["linear"], ["heatmap-density"], ...stops.flat()]
}

/** Constrain heatmap weight to 0..1 so a single stray cell can't blow out the ramp.
 *  The year weights are linearly normalised to the decade max, so quiet years
 *  sit low and the 2023 surge sits near 1 — this ramp keeps the quiet years
 *  legible while still letting the surge stand out. */
function heatWeightExpression(metric: Expression): Expression {
  return [
    "interpolate",
    ["linear"],
    metric,
    0,
    0,
    0.1,
    0.25,
    0.3,
    0.6,
    0.6,
    0.9,
    1,
    1,
  ] as Expression
}

function dimColor(isDark: boolean): string {
  return isDark ? "rgba(160,160,175,0.5)" : "rgba(60,60,75,0.45)"
}

export default function DensityMap({ basePath, sourceUrl, boundaryUrl, scheme, theme, focus, metricExpression, className }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const metric = metricExpression ?? (["get", scheme.metric] as Expression)

  function apply(theme: "light" | "dark", scheme: DensityScheme, focus: string | null, metric: Expression) {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const abs = (p: string) => `${basePath}${p}`
    if (!map.getSource("density")) {
      map.addSource("density", { type: "geojson", data: abs(sourceUrl) })
    }
    if (!map.getSource("boundary")) {
      map.addSource("boundary", { type: "geojson", data: abs(boundaryUrl) })
    }

    if (!map.getLayer("density-heat")) {
      map.addLayer(
        {
          id: "density-heat",
          type: "heatmap",
          source: "density",
          maxzoom: 7.5,
          paint: {
            // Weight hotspots by the chosen metric.
            "heatmap-weight": heatWeightExpression(metric),
            // Soft kernels at low zoom, crisper as you zoom in.
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 12, 4, 28, 7.5, 40],
            // Boost overall glow so Mediterranean/Anatolia stand out at a glance.
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1.2, 7.5, 2.2],
            "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 5.5, 1, 7.5, 0],
            "heatmap-color": heatColorExpression(scheme.ramp),
          },
        } as StyleLayer,
      )
    }

    if (!map.getLayer("density-point")) {
      map.addLayer(
        {
          id: "density-point",
          type: "circle",
          source: "density",
          minzoom: 6.5,
          paint: {
            "circle-radius": ["interpolate", ["linear"], metric, 0, 1, 0.25, 2.5, 1, 5],
            "circle-color": "transparent",
            "circle-opacity": 0,
            "circle-stroke-color": dimColor(theme === "dark"),
            "circle-stroke-width": 1,
          },
        } as StyleLayer,
      )
    }

    if (!map.getLayer("boundary-line")) {
      map.addLayer({
        id: "boundary-line",
        type: "line",
        source: "boundary",
        paint: {
          "line-color": dimColor(theme === "dark"),
          "line-width": 0.7,
        },
      } as StyleLayer)
    }
    // Keep the boundary above the heat map.
    if (map.getLayer("boundary-line")) {
      map.moveLayer("boundary-line")
    }

    const heat = map.getLayer("density-heat")
    if (heat) {
      heat.setPaintProperty("heatmap-weight", heatWeightExpression(metric))
      heat.setPaintProperty("heatmap-color", heatColorExpression(scheme.ramp))
      heat.setFilter(focus ? ["==", ["get", "province"], focus] : ["all"])
    }
    const point = map.getLayer("density-point")
    if (point) {
      point.setPaintProperty("circle-radius", ["interpolate", ["linear"], metric, 0, 1, 0.25, 2.5, 1, 5])
      point.setFilter(focus ? ["==", ["get", "province"], focus] : ["all"])
    }
    const boundary = map.getLayer("boundary-line")
    if (boundary) {
      boundary.setPaintProperty("line-color", dimColor(theme === "dark"))
    }
  }

  useEffect(() => {
    const node = container.current
    if (!node) return
    const abs = (p: string) => `${basePath}${p}`
    const map = new maplibregl.Map({
      container: node,
      style: BASEMAPS[theme],
      center: [18, 52],
      zoom: 3.6,
      minZoom: 2,
      maxZoom: 9,
      attributionControl: false,
      fadeDuration: 0,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
    map.on("load", () => apply(theme, scheme, focus, metric))

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(node)
    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-apply styling / focus whenever relevant props change after load.
  useEffect(() => {
    apply(theme, scheme, focus, metric)
  })

  return <div ref={container} className={`${styles.map} ${className ?? ""}`} aria-label={`Density map: ${scheme.rangeLabel}`} />
}