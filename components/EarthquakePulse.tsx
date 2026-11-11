"use client"

import { useEffect, useMemo, useState } from "react"
import { loadEarthquakeBundle } from "./earthquake/data"
import DepthColumns from "./earthquake/DepthColumns"
import EnergyLedger from "./earthquake/EnergyLedger"
import HeatmapMap from "./earthquake/HeatmapMap"
import PulseWall, { type WallView } from "./earthquake/PulseWall"
import { eqCopy, eqLocaleTag } from "./earthquake/copy"
import styles from "./earthquake/EarthquakePulse.module.css"
import type { Bundle } from "./earthquake/types"
import type { Locale } from "@/lib/i18n/config"
import { fmt } from "@/lib/i18n"

const DAY_MS = 86_400_000

type Props = {
  basePath: string
  locale?: Locale
}

export default function EarthquakePulse({ basePath, locale = "en" }: Props) {
  const copy = eqCopy(locale)
  const localeTag = eqLocaleTag(locale)
  const formatCount = (value: number) => value.toLocaleString(localeTag)
  const formatEnergy = (joules: number) => `${(joules / 1e15).toFixed(1)} PJ`

  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [view, setView] = useState<WallView>({ start: 0, end: 1 })
  const [focusProvince, setFocusProvince] = useState<number | null>(null)
  const [mode, setMode] = useState<"energy" | "count">("energy")
  const [exclude2023, setExclude2023] = useState(false)
  const [viewMode, setViewMode] = useState<"wall" | "map">("wall")

  useEffect(() => {
    const readTheme = () => setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light")
    readTheme()
    const observer = new MutationObserver(readTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let active = true
    loadEarthquakeBundle(basePath)
      .then(data => {
        if (!active) return
        setBundle(data)
        setView({ start: 0, end: data.daily.days })
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : "Could not load the earthquake data.")
      })
    return () => {
      active = false
    }
  }, [basePath])

  const stats = useMemo(() => {
    if (!bundle) return null
    const { headline, provinces, years } = bundle.meta
    const busiest = provinces.reduce((best, province) => (province.count > best.count ? province : best), provinces[0])
    return { headline, busiest }
  }, [bundle])

  const zoomYear = (year: number) => {
    if (!bundle) return
    const startMs = Date.parse(bundle.daily.start)
    const start = Math.floor((Date.UTC(year, 0, 1) - startMs) / DAY_MS)
    const end = Math.floor((Date.UTC(year + 1, 0, 1) - startMs) / DAY_MS)
    setView({ start: Math.max(0, start), end: Math.min(bundle.daily.days, end) })
    setFocusProvince(null)
  }

  if (error) {
    return (
      <section id="explore-earthquakes" className={`${styles.root} not-prose`} lang={locale}>
        <div className={styles.error}>
          <p>{copy.errorTitle}</p>
          <p className={styles.errorDetail}>{error}</p>
          <p>
            {copy.errorHintBefore}{" "}
            <a href={`${basePath}/interactive/europe-earthquakes/data/meta.json`}>{copy.errorDataLink}</a>
            {copy.errorHintAfter}
          </p>
        </div>
      </section>
    )
  }

  if (!bundle || !stats) {
    return (
      <section id="explore-earthquakes" className={`${styles.root} not-prose`} lang={locale}>
        <div className={styles.loading} aria-live="polite">
          <div className={styles.loadingKicker}>{copy.loadingKicker}</div>
          <div className={styles.loadingTitle}>{copy.loadingTitle}</div>
          <div className={styles.loadingBar} />
          <p className={styles.loadingNote}>{copy.loadingNote}</p>
        </div>
      </section>
    )
  }

  const { meta, daily, depth, top, grid, boundary } = bundle
  const busiestShare = stats.busiest.count / meta.totalEvents

  return (
    <section id="explore-earthquakes" className={`${styles.root} not-prose`} lang={locale}>
      <div className={styles.header}>
        <div className={styles.kicker}>{copy.kicker}</div>
        <h2 className={styles.heading}>{copy.heading}</h2>
        <p className={styles.intro}>{copy.intro}</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatCount(meta.totalEvents)}</span>
          <span className={styles.statLabel}>{copy.statEvents}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatEnergy(meta.headline.totalEnergy)}</span>
          <span className={styles.statLabel}>{copy.statEnergy}</span>
        </div>
        <div className={`${styles.stat} ${styles.statAccent}`}>
          <span className={styles.statValue}>{meta.headline.energyRatio2023.toFixed(1)}×</span>
          <span className={styles.statLabel}>{copy.statRatio}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{Math.round(busiestShare * 100)}%</span>
          <span className={styles.statLabel}>{fmt(copy.statShare, { zone: stats.busiest.short })}</span>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.viewTabs} role="tablist" aria-label={copy.viewTabsAria}>
          <button type="button" role="tab" aria-selected={viewMode === "wall"} aria-controls="eq-wall-panel" onClick={() => setViewMode("wall")} className={viewMode === "wall" ? styles.viewTabActive : ""}>
            {copy.tabWall}
          </button>
          <button type="button" role="tab" aria-selected={viewMode === "map"} aria-controls="eq-map-panel" onClick={() => setViewMode("map")} className={viewMode === "map" ? styles.viewTabActive : ""}>
            {copy.tabMap}
          </button>
        </div>

        {viewMode === "wall" ? (
          <div id="eq-wall-panel" role="tabpanel">
            <PulseWall
              meta={meta}
              daily={daily}
              top={top}
              view={view}
              onViewChange={setView}
              focusProvince={focusProvince}
              onFocusProvince={setFocusProvince}
              theme={theme}
              copy={copy}
              localeTag={localeTag}
            />
          </div>
        ) : (
          <div id="eq-map-panel" role="tabpanel">
            <div className={styles.mapBlock}>
              <div className={styles.wallTop}>
                <div>
                  <h3 className={styles.wallTitle}>{copy.mapTitle}</h3>
                  <p className={styles.wallSubtitle}>
                    {mode === "energy" ? copy.mapSubtitleByEnergy : copy.mapSubtitleByCount}
                  </p>
                </div>
                <div className={styles.segmented} role="group" aria-label={copy.mapMeasureAria}>
                  <button type="button" aria-pressed={mode === "energy"} onClick={() => setMode("energy")}>{copy.measureEnergy}</button>
                  <button type="button" aria-pressed={mode === "count"} onClick={() => setMode("count")}>{copy.measureEvents}</button>
                </div>
              </div>
              <HeatmapMap
                basePath={basePath}
                meta={meta}
                grid={grid}
                boundary={boundary}
                theme={theme}
                mode={mode}
                focusProvince={focusProvince}
                copy={copy}
                localeTag={localeTag}
              />
              <p className={styles.wallNote}>
                {mode === "energy" ? copy.mapNoteEnergy : copy.mapNoteCount}
              </p>
            </div>
          </div>
        )}

        <div className={styles.zoneRow} aria-label={copy.allZones}>
          <button
            type="button"
            className={`${styles.zoneChip} ${focusProvince === null ? styles.zoneChipActive : ""}`}
            onClick={() => setFocusProvince(null)}
            aria-pressed={focusProvince === null}
          >
            {copy.allZones}
          </button>
          {meta.provinces.map((province, index) => (
            <button
              key={province.id}
              type="button"
              className={`${styles.zoneChip} ${focusProvince === index ? styles.zoneChipActive : ""}`}
              onClick={() => setFocusProvince(focusProvince === index ? null : index)}
              aria-pressed={focusProvince === index}
              title={fmt(copy.zoneChipTitle, { zone: province.name, count: formatCount(province.count) })}
            >
              {province.short}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          <DepthColumns
            meta={meta}
            depth={depth}
            focusProvince={focusProvince}
            onFocusProvince={setFocusProvince}
            theme={theme}
            copy={copy}
            localeTag={localeTag}
          />
          <EnergyLedger
            meta={meta}
            mode={mode}
            onModeChange={setMode}
            exclude2023={exclude2023}
            onToggleExclude={setExclude2023}
            onZoomYear={zoomYear}
            copy={copy}
            localeTag={localeTag}
          />
        </div>

        <p className={styles.source}>
          {copy.sourceBefore}
          <a href={meta.source.url} target="_blank" rel="noopener noreferrer">EMSC Seismic Portal</a>
          {fmt(copy.sourceAfter, {
            minMag: meta.scope.minMagnitude,
            events: formatCount(meta.totalEvents),
            rejected: formatCount(meta.rejected),
            built: new Date(meta.generatedAt).toISOString().slice(0, 10),
          })}
        </p>
      </div>
    </section>
  )
}
