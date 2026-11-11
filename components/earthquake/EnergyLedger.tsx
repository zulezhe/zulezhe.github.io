"use client"

import type { Meta } from "./types"
import type { EqCopy } from "./copy"
import { fmt } from "@/lib/i18n"
import styles from "./EarthquakePulse.module.css"

type Mode = "energy" | "count"

type Props = {
  meta: Meta
  mode: Mode
  onModeChange: (mode: Mode) => void
  exclude2023: boolean
  onToggleExclude: (value: boolean) => void
  onZoomYear: (year: number) => void
  copy: EqCopy
  localeTag: string
}

const formatEnergy = (joules: number) => `${(joules / 1e15).toFixed(1)} PJ`

export default function EnergyLedger({ meta, mode, onModeChange, exclude2023, onToggleExclude, onZoomYear, copy, localeTag }: Props) {
  const years = meta.years
  const valueOf = (year: Meta["years"][number]) => (mode === "energy" ? year.energy : year.count)
  const visible = exclude2023 ? years.filter(year => year.year !== 2023) : years
  const max = Math.max(...visible.map(valueOf), 1)
  const maxYear = years.find(year => year.year === 2023)
  const ratio = meta.headline.energyRatio2023
  const formatCount = (count: number) => count.toLocaleString(localeTag)

  return (
    <div className={styles.ledgerBlock}>
      <div className={styles.panelHead}>
        <div>
          <h3 className={styles.panelTitle}>{copy.ledgerTitle2023}</h3>
          <p className={styles.panelSubtitle}>
            {mode === "energy"
              ? fmt(copy.ledgerSubtitleEnergy, {
                  energy: formatEnergy(meta.headline.totalEnergy),
                  energy2023: formatEnergy(meta.headline.energy2023),
                  ratio: ratio.toFixed(1),
                })
              : fmt(copy.ledgerSubtitleCount, { count: formatCount(meta.headline.totalEvents) })}
          </p>
        </div>
      </div>

      <div className={styles.ledgerControls}>
        <div className={styles.segmented} role="group" aria-label={copy.ledgerMeasureAria}>
          <button type="button" aria-pressed={mode === "energy"} onClick={() => onModeChange("energy")}>{copy.measureEnergy}</button>
          <button type="button" aria-pressed={mode === "count"} onClick={() => onModeChange("count")}>{copy.measureEvents}</button>
        </div>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={exclude2023} onChange={event => onToggleExclude(event.target.checked)} />
          {copy.exclude2023}
        </label>
      </div>

      <div className={styles.bars} role="list" aria-label={copy.ledgerBarsAria}>
        {years.map(year => {
          const is2023 = year.year === 2023
          const excluded = is2023 && exclude2023
          const value = valueOf(year)
          const height = is2023 && exclude2023 ? 100 : Math.max(2, (value / max) * 100)
          return (
            <button
              key={year.year}
              type="button"
              className={`${styles.bar} ${is2023 ? styles.bar2023 : ""} ${excluded ? styles.barExcluded : ""}`}
              onClick={() => onZoomYear(year.year)}
              aria-label={fmt(copy.ledgerBarAria, { year: year.year, count: formatCount(year.count), energy: formatEnergy(year.energy) })}
              title={`${year.year}: ${formatCount(year.count)} · ${formatEnergy(year.energy)}`}
            >
              <span className={styles.barValue}>{mode === "energy" ? formatEnergy(value) : formatCount(value)}</span>
              <span className={styles.barTrack}>
                <span className={styles.barFill} style={{ height: `${height}%` }} />
                {excluded ? <span className={styles.barGhost} /> : null}
              </span>
              <span className={styles.barYear}>{year.year}</span>
            </button>
          )
        })}
      </div>

      <p className={styles.panelNote}>
        {exclude2023 && maxYear
          ? fmt(copy.ledgerNoteExcluded, {
              value: mode === "energy" ? formatEnergy(maxYear.energy) : fmt(copy.hoverEvents, { count: formatCount(maxYear.count) }),
            })
          : mode === "energy"
            ? copy.ledgerNoteEnergy
            : copy.ledgerNoteCount}
      </p>
    </div>
  )
}
