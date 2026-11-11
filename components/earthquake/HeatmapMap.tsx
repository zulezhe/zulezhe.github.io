"use client"

import { useEffect, useRef, useState } from "react"
import type { Meta, Grid, Boundary } from "./types"
import DensityMap from "../map/DensityMap"
import type { DensityScheme } from "../map/DensityMap"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Expression = any
import styles from "./EarthquakePulse.module.css"
import type { EqCopy } from "./copy"

type Props = {
  basePath: string
  meta: Meta
  grid: Grid
  boundary: Boundary
  theme: "light" | "dark"
  mode: "energy" | "count"
  focusProvince: number | null
  copy: EqCopy
  localeTag: string
}

const COUNT_RAMP: DensityScheme = {
  id: "count",
  metric: "fCount",
  ramp: [
    { t: 0.0, color: "rgba(37,42,84,0.0)" },
    { t: 0.2, color: "#3b5bbf" },
    { t: 0.4, color: "#2f9e8f" },
    { t: 0.55, color: "#e5b144" },
    { t: 0.75, color: "#e07b2f" },
    { t: 1.0, color: "#d6452e" },
  ],
  rangeLabel: "event count",
}

const ENERGY_RAMP: DensityScheme = {
  id: "energy",
  metric: "fEnergy",
  ramp: [
    { t: 0.0, color: "rgba(37,42,84,0.0)" },
    { t: 0.2, color: "#5a4fbf" },
    { t: 0.4, color: "#2f8fbf" },
    { t: 0.55, color: "#26b5a0" },
    { t: 0.75, color: "#e5aa2f" },
    { t: 1.0, color: "#ee6a2f" },
  ],
  rangeLabel: "released energy",
}

const YEAR_COUNT = 10
const PLAY_MS = 15_000

/** Blend two per-frame weight arrays into one getter expression. */
function frameMetric(array: "wy" | "we" | "wyc" | "wec", frame: number): Expression {
  const k = Math.floor(frame)
  const frac = frame - k
  if (k >= YEAR_COUNT - 1) return ["get", `${array}${YEAR_COUNT - 1}`]
  const a = ["get", `${array}${k}`]
  const b = ["get", `${array}${k + 1}`]
  if (frac < 0.001) return a
  if (frac > 0.999) return b
  return ["+", ["*", a, 1 - frac], ["*", b, frac]]
}

export default function HeatmapMap({ basePath, meta, grid, boundary, theme, mode, focusProvince, copy, localeTag }: Props) {
  const scheme = mode === "energy" ? ENERGY_RAMP : COUNT_RAMP
  const focus = focusProvince !== null ? meta.provinces[focusProvince]?.id ?? null : null

  const [frame, setFrame] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [cumulative, setCumulative] = useState(false)
  const rafRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)

  useEffect(() => {
    frameRef.current = frame
  }, [frame])

  useEffect(() => {
    if (!playing) return
    lastTickRef.current = performance.now()
    if (frameRef.current === null) {
      frameRef.current = 0
      setFrame(0)
    }
    const tick = (now: number) => {
      const delta = now - lastTickRef.current
      lastTickRef.current = now
      const current = frameRef.current ?? 0
      const next = current + (YEAR_COUNT / PLAY_MS) * delta
      if (next >= YEAR_COUNT - 1) {
        frameRef.current = YEAR_COUNT - 1
        setFrame(YEAR_COUNT - 1)
        setPlaying(false)
        return
      }
      frameRef.current = next
      setFrame(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing])

  const togglePlay = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    if (frame !== null && frame >= YEAR_COUNT - 1) {
      frameRef.current = 0
      setFrame(0)
    }
    setPlaying(true)
  }

  const scrubTo = (yearIndex: number) => {
    setPlaying(false)
    frameRef.current = yearIndex
    setFrame(yearIndex)
  }

  const resetToDecade = () => {
    setPlaying(false)
    frameRef.current = null
    setFrame(null)
  }

  // Property array read at the current frame: annual or cumulative weights.
  const array = mode === "energy" ? (cumulative ? "wec" : "we") : cumulative ? "wyc" : "wy"
  const metric: Expression =
    frame === null ? ["get", scheme.metric] : frameMetric(array, frame)
  const activeYear = frame === null ? null : Math.round(frame)
  const activeYearValue = activeYear !== null ? meta.years[Math.min(activeYear, YEAR_COUNT - 1)].year : null

  return (
    <div className={styles.mapWrap}>
      <div className={styles.mapToolbar}>
        <button type="button" className={styles.playButton} onClick={togglePlay} aria-pressed={playing}>
          {playing ? copy.pause : copy.play}
        </button>
        <div className={styles.segmented} role="group" aria-label={copy.mapTimelineModeAria}>
          <button type="button" aria-pressed={!cumulative} onClick={() => setCumulative(false)}>{copy.mapByYear}</button>
          <button type="button" aria-pressed={cumulative} onClick={() => setCumulative(true)}>{copy.mapCumulative}</button>
        </div>
        {activeYearValue !== null ? (
          <button type="button" className={styles.mapDecadeChip} onClick={resetToDecade}>
            {copy.mapDecadeReset}
          </button>
        ) : null}
        {activeYearValue !== null ? (
          <span className={styles.mapYearBadge} aria-live="polite">{activeYearValue}</span>
        ) : null}
      </div>
      <DensityMap
        basePath={basePath}
        sourceUrl="/interactive/europe-earthquakes/data/heatpoints.geojson"
        boundaryUrl="/interactive/europe-earthquakes/data/europe_boundary.geojson"
        scheme={scheme}
        theme={theme}
        focus={focus}
        metricExpression={metric}
      />
      <div className={styles.mapTimeline}>
        <input
          id="eq-map-year"
          type="range"
          min={0}
          max={YEAR_COUNT - 1}
          step={1}
          value={activeYear ?? 0}
          onChange={event => scrubTo(Number(event.target.value))}
          aria-label={copy.mapTimelineAria}
          aria-valuetext={activeYearValue !== null ? String(activeYearValue) : copy.mapDecadeReset}
          className={styles.mapYearSlider}
        />
        {copy.mapPlayNote ? <p className={styles.mapPlayNote}>{copy.mapPlayNote}</p> : null}
      </div>
    </div>
  )
}
