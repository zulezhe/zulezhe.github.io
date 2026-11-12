"use client"

import { useEffect, useRef } from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import styles from "./HkEvCharging.module.css"

// Same constraint as DensityMap: static exports don't emit MapLibre's worker
// module, so the library must point at the vendored copy before any map is
// created. .js extension because some CDNs serve .mjs with a strict MIME check.
const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "")
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl(`${base}/vendor/maplibre-gl-worker.js`)
}

const BASEMAPS: Record<"light" | "dark", string> = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
}

export type HkClassMode = "all" | "std" | "med" | "dc"

export type HkStation = {
  name: string
  address: string
  std: number
  med: number
  dc: number
}

type Props = {
  dataUrl: string
  theme: "light" | "dark"
  districtIndex: number | null
  mode: HkClassMode
  onSelect: (station: HkStation | null) => void
  localeTag: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Expression = any

function classExpression(mode: HkClassMode): Expression {
  if (mode === "std") return ["get", "s"]
  if (mode === "med") return ["get", "m"]
  if (mode === "dc") return ["get", "dc"]
  return ["+", ["+", ["get", "s"], ["get", "m"]], ["get", "dc"]]
}

function radiusExpression(mode: HkClassMode): Expression {
  return [
    "interpolate", ["linear"], classExpression(mode),
    0, 3,
    3, 4.5,
    10, 6.5,
    30, 9,
    80, 12,
    200, 16,
    400, 20,
  ]
}

// Circle hue tracks the DC share of each location: blue = mostly slow AC,
// amber/red = fast-charging dominated. In DC mode the field is 0 or 1.
const DC_SHARE = [
  "interpolate", ["linear"],
  ["/", ["get", "dc"], ["max", ["+", ["+", ["get", "s"], ["get", "m"]], ["get", "dc"]], 1]],
  0, "#4e79c7",
  0.3, "#2f9e8f",
  0.6, "#e5a52f",
  1, "#d6452e",
] as Expression

export default function HkMap({ dataUrl, theme, districtIndex, mode, onSelect, localeTag }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const latest = useRef({ districtIndex, mode, onSelect, localeTag })
  latest.current = { districtIndex, mode, onSelect, localeTag }

  function paint() {
    const map = mapRef.current
    if (!map) return
    // The style may still be streaming in (first load, theme swap). Re-arm on
    // the next idle instead of dropping the update entirely.
    if (!map.isStyleLoaded()) {
      map.once("idle", paint)
      return
    }
    const { districtIndex: district, mode: classMode } = latest.current

    if (!map.getSource("stations")) {
      map.addSource("stations", { type: "geojson", data: dataUrl })
    }

    const filters: Expression[] = []
    if (classMode === "dc") filters.push([">", ["get", "dc"], 0])
    if (classMode === "med") filters.push([">", ["get", "m"], 0])
    if (classMode === "std") filters.push([">", ["get", "s"], 0])
    if (district !== null) filters.push(["==", ["get", "di"], district])

    if (!map.getLayer("stations-point")) {
      map.addLayer({
        id: "stations-point",
        type: "circle",
        source: "stations",
        paint: {
          "circle-radius": radiusExpression(classMode),
          "circle-color": DC_SHARE,
          "circle-opacity": 0.75,
          "circle-stroke-color": "rgba(30,30,40,0.5)",
          "circle-stroke-width": 0.8,
        },
      } as Expression)
      map.on("click", "stations-point", event => {
        const feature = event.features?.[0]
        if (!feature) return
        const properties = feature.properties ?? {}
        latest.current.onSelect({
          name: String(properties.n ?? ""),
          address: String(properties.a ?? ""),
          std: Number(properties.s) || 0,
          med: Number(properties.m) || 0,
          dc: Number(properties.dc) || 0,
        })
      })
      map.on("mouseenter", "stations-point", () => { map.getCanvas().style.cursor = "pointer" })
      map.on("mouseleave", "stations-point", () => { map.getCanvas().style.cursor = "" })
    } else {
      map.setFilter("stations-point", ["all", ...filters])
      map.setPaintProperty("stations-point", "circle-radius", radiusExpression(classMode))
    }
  }

  useEffect(() => {
    const node = container.current
    if (!node) return
    const map = new maplibregl.Map({
      container: node,
      style: BASEMAPS[theme],
      center: [114.17, 22.32],
      zoom: 10.2,
      minZoom: 9.5,
      maxZoom: 15,
      attributionControl: false,
      fadeDuration: 0,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
    map.on("load", () => paint())
    map.on("sourcedata", event => {
      if (event.sourceId === "stations" && event.isSourceLoaded) paint()
    })
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(node)
    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-apply filters and sizing when the controls change.
  useEffect(() => {
    paint()
  })

  // Swap basemap when the theme actually toggles. Skip the first run: setStyle
  // during the initial style load races it and stalls the render pipeline.
  const prevTheme = useRef(theme)
  useEffect(() => {
    if (prevTheme.current === theme) return
    prevTheme.current = theme
    const map = mapRef.current
    if (!map) return
    map.setStyle(BASEMAPS[theme])
    map.once("style.load", paint)
  }, [theme])

  return <div ref={container} className={styles.map} aria-label="Hong Kong charging station map" />
}
