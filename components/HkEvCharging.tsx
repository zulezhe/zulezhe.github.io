"use client"

import { useEffect, useMemo, useState } from "react"
import HkMap, { type HkClassMode, type HkStation } from "./hkEv/HkMap"
import { hkEvCopy } from "./hkEv/copy"
import styles from "./hkEv/HkEvCharging.module.css"
import Link from "next/link"
import { localizedPath, type Locale } from "@/lib/i18n"

type Meta = {
  generatedAt: string
  source: { label: string; labelEn: string; url: string }
  districts: { en: string; tc: string }[]
  totals: { locations: number; chargers: number; std: number; med: number; dc: number; dcLocations: number }
  perDistrict: { en: string; tc: string; locations: number; chargers: number; std: number; med: number; dc: number }[]
}

type CompareCountry = {
  cc: string
  en: string
  tc: string
  stations: number
  points: number
  ppsMedian: number
  ppsMean: number
  dcShare: number
}

type CompareData = {
  generatedAt: string
  euSnapshot: string | null
  euStations: number
  euPoints: number
  countries: CompareCountry[]
  hk: { stations: number; points: number; ppsMedian: number; ppsMean: number; dcShare: number }
}

type CompareMetricId = "points" | "pps" | "dc"

type Props = {
  basePath: string
  locale?: Locale
}

const MODES: { id: HkClassMode; copyKey: "classAll" | "classStd" | "classMed" | "classDc" }[] = [
  { id: "all", copyKey: "classAll" },
  { id: "std", copyKey: "classStd" },
  { id: "med", copyKey: "classMed" },
  { id: "dc", copyKey: "classDc" },
]

const COMPACT_ROWS = 8

export default function HkEvCharging({ basePath, locale = "en" }: Props) {
  const copy = hkEvCopy[locale]
  const localeTag = locale === "zh-TW" ? "zh-TW" : "en-US"
  const formatCount = (value: number) => value.toLocaleString(localeTag)
  const dataRoot = `${basePath}/interactive/hk-ev-charging/data`

  const [meta, setMeta] = useState<Meta | null>(null)
  const [compare, setCompare] = useState<CompareData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [mode, setMode] = useState<HkClassMode>("all")
  const [district, setDistrict] = useState<number | null>(null)
  const [station, setStation] = useState<HkStation | null>(null)
  const [compareMetric, setCompareMetric] = useState<CompareMetricId>("pps")
  const [compareExpanded, setCompareExpanded] = useState(false)

  useEffect(() => {
    const readTheme = () => setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light")
    readTheme()
    const observer = new MutationObserver(readTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let active = true
    fetch(`${dataRoot}/meta.json`)
      .then(response => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
        return response.json() as Promise<Meta>
      })
      .then(data => { if (active) setMeta(data) })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "data unavailable")
      })
    fetch(`${dataRoot}/eu_compare.json`)
      .then(response => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
        return response.json() as Promise<CompareData>
      })
      .then(data => { if (active) setCompare(data) })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "data unavailable")
      })
    return () => { active = false }
  }, [dataRoot])

  // Recompute district ranking for the selected class, largest first.
  const ranking = useMemo(() => {
    if (!meta) return []
    const key = mode === "std" ? "std" : mode === "med" ? "med" : mode === "dc" ? "dc" : "chargers"
    return meta.perDistrict
      .map(row => ({ ...row, value: row[key as keyof typeof row] as number }))
      .sort((a, b) => b.value - a.value)
  }, [meta, mode])

  const maxBar = useMemo(() => Math.max(1, ...ranking.map(row => row.value)), [ranking])

  const compareRows = useMemo(() => {
    if (!compare) return []
    const metrics = {
      points: (row: CompareCountry) => row.points,
      pps: (row: CompareCountry) => row.ppsMedian,
      dc: (row: CompareCountry) => row.dcShare,
    } as const
    const value = metrics[compareMetric]
    const hkRow: CompareCountry = { cc: "HK", en: "Hong Kong", tc: "香港", ...compare.hk }
    return [...compare.countries, hkRow]
      .map(row => ({ ...row, value: value(row), isHk: row.cc === "HK" }))
      .sort((a, b) => b.value - a.value)
  }, [compare, compareMetric])

  const compareHkRank = useMemo(() => compareRows.findIndex(row => row.isHk) + 1, [compareRows])

  const compareVisible = useMemo(() => {
    const hkIndex = compareHkRank - 1
    if (compareExpanded) return compareRows
    if (hkIndex < COMPACT_ROWS) return compareRows.slice(0, COMPACT_ROWS)
    return [
      ...compareRows.slice(0, COMPACT_ROWS),
      { gap: true },
      ...compareRows.slice(hkIndex - 1, hkIndex + 2),
    ]
  }, [compareRows, compareExpanded, compareHkRank])

  const compareFormat = useMemo(() => {
    if (compareMetric === "points") return (value: number) => formatCount(value)
    if (compareMetric === "pps") {
      return (value: number) => value.toLocaleString(localeTag, { maximumFractionDigits: 1 })
    }
    return (value: number) => `${value.toLocaleString(localeTag, { maximumFractionDigits: 1 })}%`
  }, [compareMetric, formatCount, localeTag])

  if (error) {
    return (
      <section id="explore-hk-charging" className={`${styles.root} not-prose`} lang={locale}>
        <div className={styles.error}>
          <p>{copy.errorTitle}</p>
          <p className={styles.errorHint}>{error} — {copy.errorHint}</p>
        </div>
      </section>
    )
  }

  if (!meta) {
    return (
      <section id="explore-hk-charging" className={`${styles.root} not-prose`} lang={locale}>
        <div className={styles.loading} aria-live="polite">
          <div className={styles.kicker}>{copy.kicker}</div>
          <div className={styles.loadingTitle}>{copy.loading}</div>
          <p className={styles.loadingNote}>{copy.loadingNote}</p>
        </div>
      </section>
    )
  }

  const { totals } = meta
  const snapshotDate = meta.generatedAt.slice(0, 10)

  return (
    <section id="explore-hk-charging" className={`${styles.root} not-prose`} lang={locale}>
      <div className={styles.header}>
        <div className={styles.kicker}>{copy.kicker}</div>
        <h2 className={styles.heading}>{copy.heading}</h2>
        <p className={styles.intro}>{copy.intro}</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatCount(totals.locations)}</span>
          <span className={styles.statLabel}>{copy.statLocations}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatCount(totals.chargers)}</span>
          <span className={styles.statLabel}>{copy.statChargers}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatCount(totals.dc)}</span>
          <span className={styles.statLabel}>{copy.statDc}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{Math.round((totals.dcLocations / totals.locations) * 100)}%</span>
          <span className={styles.statLabel}>{copy.statDcShare}</span>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <div className={styles.segmented} role="group" aria-label={copy.classFilterAria}>
            {MODES.map(item => (
              <button
                key={item.id}
                type="button"
                aria-pressed={mode === item.id}
                onClick={() => { setMode(item.id); setStation(null) }}
              >
                {copy[item.copyKey]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.mapWrap}>
          <HkMap
            dataUrl={`${dataRoot}/stations.geojson`}
            theme={theme}
            districtIndex={district}
            mode={mode}
            onSelect={setStation}
            localeTag={localeTag}
          />
        </div>
        <p className={styles.mapNote}>{copy.mapHint}</p>

        <div className={styles.districtRow} aria-label={copy.districtFilterAria}>
          <button
            type="button"
            className={`${styles.districtChip} ${district === null ? styles.districtChipActive : ""}`}
            onClick={() => setDistrict(null)}
            aria-pressed={district === null}
          >
            {copy.allDistricts}
          </button>
          {meta.districts.map((item, index) => (
            <button
              key={item.tc}
              type="button"
              className={`${styles.districtChip} ${district === index ? styles.districtChipActive : ""}`}
              onClick={() => { setDistrict(district === index ? null : index); setStation(null) }}
              aria-pressed={district === index}
            >
              {locale === "zh-TW" ? item.tc : item.en}
            </button>
          ))}
        </div>

        {station ? (
          <div className={styles.detail}>
            <div className={styles.detailName}>{station.name}</div>
            <div className={styles.detailAddress}>{station.address}</div>
            <div className={styles.detailCounts}>
              <span>{copy.detailStd} <strong>{formatCount(station.std)}</strong></span>
              <span>{copy.detailMed} <strong>{formatCount(station.med)}</strong></span>
              <span>{copy.detailDc} <strong>{formatCount(station.dc)}</strong></span>
              <span>{copy.detailTotal} <strong>{formatCount(station.std + station.med + station.dc)}</strong></span>
            </div>
          </div>
        ) : (
          <div className={styles.detail}>
            <div className={styles.detailAddress}>{copy.detailEmpty}</div>
          </div>
        )}

        <div className={styles.chartBlock}>
          <h3 className={styles.chartTitle}>{copy.districtTitle}</h3>
          <p className={styles.chartSubtitle}>{mode === "all" ? copy.districtSubtitleAll : copy.districtSubtitleClass}</p>
          <div className={styles.bars}>
            {ranking.map(row => (
              <button
                key={row.tc}
                type="button"
                className={styles.barRow}
                aria-pressed={district !== null && meta.districts[district].tc === row.tc}
                onClick={() => {
                  const index = meta.districts.findIndex(item => item.tc === row.tc)
                  setDistrict(district !== null && meta.districts[district].tc === row.tc ? null : index)
                }}
              >
                <span className={styles.barName}>{locale === "zh-TW" ? row.tc : row.en}</span>
                <span className={styles.barTrack}>
                  <span
                    className={styles.barFill}
                    style={{ width: `${(row.value / maxBar) * 100}%` }}
                  />
                </span>
                <span className={styles.barValue}>{formatCount(row.value)}</span>
              </button>
            ))}
          </div>
        </div>

        <p className={styles.mapNote}>{copy.mapClickHint}</p>

        <div className={styles.compare}>
          <div className={styles.compareTitle}>{copy.compareTitle}</div>
          <p className={styles.compareIntro}>{copy.compareIntro}</p>

          <div className={styles.segmented} role="group" aria-label={copy.compareMetricAria}>
            {(
              [
                { id: "pps", copyKey: "compareMetricPps" },
                { id: "points", copyKey: "compareMetricPoints" },
                { id: "dc", copyKey: "compareMetricDc" },
              ] as const
            ).map(item => (
              <button
                key={item.id}
                type="button"
                aria-pressed={compareMetric === item.id}
                onClick={() => setCompareMetric(item.id)}
              >
                {copy[item.copyKey]}
              </button>
            ))}
          </div>

          {compareRows.length > 0 && (
            <p className={styles.compareRank}>
              {copy.compareRankTemplate.replace("{rank}", formatCount(compareHkRank)).replace("{total}", formatCount(compareRows.length))}
            </p>
          )}

          <div className={styles.compareRows}>
            {compareVisible.map((row, index) =>
              "gap" in row ? (
                <div key={`gap-${index}`} className={styles.compareGap} aria-hidden="true">⋯</div>
              ) : (
                <div
                  key={row.cc}
                  className={`${styles.compareRow} ${row.isHk ? styles.compareRowHk : ""}`}
                >
                  <span className={styles.compareRankCell}>{formatCount(compareRows.indexOf(row) + 1)}</span>
                  <span className={styles.compareName}>{locale === "zh-TW" ? row.tc : row.en}</span>
                  <span className={styles.barTrack}>
                    <span
                      className={`${styles.barFill} ${row.isHk ? styles.barFillHk : ""}`}
                      style={{ width: `${(row.value / Math.max(1, compareRows[0].value)) * 100}%` }}
                    />
                  </span>
                  <span className={styles.barValue}>{compareFormat(row.value)}</span>
                </div>
              ),
            )}
          </div>

          <p className={styles.compareNote}>
            {compareMetric === "points" ? copy.compareNotePoints : compareMetric === "pps" ? copy.compareNotePps : copy.compareNoteDc}
          </p>

          {compareRows.length > COMPACT_ROWS && (
            <button type="button" className={styles.compareToggle} onClick={() => setCompareExpanded(value => !value)}>
              {compareExpanded ? copy.compareShowLess : copy.compareShowAll.replace("{total}", formatCount(compareRows.length))}
            </button>
          )}

          <Link className={styles.compareLink} href={localizedPath(locale, "/blog/ev-charging-europe/")}>
            {copy.compareLink}
          </Link>
        </div>

        <p className={styles.source}>
          {copy.sourceBefore}{" "}
          <a href={meta.source.url} target="_blank" rel="noopener noreferrer">
            {locale === "zh-TW" ? meta.source.label : meta.source.labelEn}
          </a>
          {`. ${copy.snapshotBefore} ${snapshotDate}${copy.snapshotAfter} ${copy.sourceNote}`}
        </p>
      </div>
    </section>
  )
}
