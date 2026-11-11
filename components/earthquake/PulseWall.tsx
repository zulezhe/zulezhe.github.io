"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react"
import { alphaColor, depthColor, paletteFor } from "./palette"
import type { Daily, DailyCell, Meta, TopData } from "./types"
import type { EqCopy } from "./copy"
import { fmt } from "@/lib/i18n"
import styles from "./EarthquakePulse.module.css"

export interface WallView {
  /** Inclusive day index since 2016-01-01. */
  start: number
  /** Exclusive day index. */
  end: number
}

type Hover = {
  day: number
  province: number
  cell: DailyCell
  x: number
  y: number
}

type Geometry = {
  left: number
  right: number
  top: number
  bottom: number
  plotW: number
  plotH: number
  laneH: number
  domain: number
}

const DAY_MS = 86_400_000
const MIN_MAG = 2.5
const MAX_MAG = 7.8
const PLAY_MS = 24_000

const ANNOTATIONS = [
  { t: "2023-02-06T01:17:36.1Z", label: "M7.8", province: "anatolia" },
  { t: "2020-10-30T11:51:25.7Z", label: "M7.0", province: "greece" },
  { t: "2018-11-09T01:49:39.7Z", label: "M6.8", province: "iceland" },
]

type Props = {
  meta: Meta
  daily: Daily
  top: TopData
  view: WallView
  onViewChange: (view: WallView) => void
  focusProvince: number | null
  onFocusProvince: (index: number | null) => void
  theme: "light" | "dark"
  copy: EqCopy
  localeTag: string
}

export default function PulseWall({
  meta,
  daily,
  top,
  view,
  onViewChange,
  focusProvince,
  onFocusProvince,
  theme,
  copy,
  localeTag,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const wallRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const geomRef = useRef<Geometry>({ left: 0, right: 0, top: 0, bottom: 0, plotW: 0, plotH: 0, laneH: 0, domain: 1 })
  const dragRef = useRef<{ startDay: number; currentDay: number; startX: number; active: boolean } | null>(null)
  const hoverRef = useRef<Hover | null>(null)
  const selectedRef = useRef<number | null>(null)
  const playingRef = useRef(false)
  const playDayRef = useRef(view.start)
  const frameRef = useRef(0)
  const lastFrameRef = useRef(0)
  const paintRef = useRef<() => void>(() => {})
  const lastHoverKey = useRef("")

  const [size, setSize] = useState({ w: 0, h: 0 })
  const [hover, setHover] = useState<Hover | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [playDay, setPlayDay] = useState<number | null>(null)

  const startMs = useMemo(() => Date.parse(daily.start), [daily.start])
  const palette = useMemo(() => paletteFor(theme === "dark"), [theme])
  const provinceIndexByEventProvince = useMemo(() => {
    const map = new Map<string, number>()
    meta.provinces.forEach((province, index) => {
      map.set(province.id, index)
      map.set(province.name, index)
    })
    return map
  }, [meta.provinces])

  const dayIndex = useCallback((iso: string) => Math.floor((Date.parse(iso) - startMs) / DAY_MS), [startMs])
  const dateForDay = useCallback((day: number) => new Date(startMs + day * DAY_MS), [startMs])

  useEffect(() => {
    const element = wrapRef.current
    if (!element) return
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect
      if (rect) setSize({ w: Math.max(0, rect.width), h: Math.max(0, rect.height) })
    })
    observer.observe(element)
    const rect = element.getBoundingClientRect()
    setSize({ w: rect.width, h: rect.height })
    return () => observer.disconnect()
  }, [])

  const prepareCanvas = useCallback((canvas: HTMLCanvasElement, width: number, height: number) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const pixelWidth = Math.max(1, Math.round(width * dpr))
    const pixelHeight = Math.max(1, Math.round(height * dpr))
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return ctx
  }, [])

  const formatDay = useCallback((day: number, long = false) => {
    const date = dateForDay(day)
    return new Intl.DateTimeFormat(localeTag, {
      timeZone: "UTC",
      year: "numeric",
      month: long ? "long" : "short",
      day: "numeric",
    }).format(date)
  }, [dateForDay, localeTag])

  const drawWall = useCallback(() => {
    const canvas = wallRef.current
    if (!canvas || !size.w || !size.h) return
    const ctx = prepareCanvas(canvas, size.w, size.h)
    if (!ctx) return

    const mobile = size.w < 560
    const left = mobile ? 57 : 88
    const right = 14
    const top = mobile ? 24 : 28
    const bottom = 20
    const plotW = Math.max(1, size.w - left - right)
    const plotH = Math.max(1, size.h - top - bottom)
    const laneH = plotH / meta.provinces.length
    const domain = Math.max(1, view.end - view.start)
    geomRef.current = { left, right, top, bottom, plotW, plotH, laneH, domain }

    ctx.clearRect(0, 0, size.w, size.h)

    // Lane beds and baselines.
    meta.provinces.forEach((province, index) => {
      const y = top + index * laneH
      const dimmed = focusProvince !== null && focusProvince !== index
      if (focusProvince === index) {
        ctx.fillStyle = palette.laneFocus
        ctx.fillRect(left, y, plotW, laneH)
      } else if (index % 2 === 0) {
        ctx.fillStyle = palette.lane
        ctx.fillRect(left, y, plotW, laneH)
      }
      ctx.strokeStyle = palette.grid
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(left, Math.round(y + laneH) + 0.5)
      ctx.lineTo(left + plotW, Math.round(y + laneH) + 0.5)
      ctx.stroke()

      // Labels.
      const active = focusProvince === null || focusProvince === index
      ctx.textAlign = "right"
      ctx.textBaseline = "middle"
      ctx.fillStyle = active ? palette.text : palette.faint
      ctx.font = `${focusProvince === index ? "600 " : ""}${mobile ? 9 : 11}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`
      const labelY = mobile || laneH < 21 ? y + laneH / 2 : y + laneH / 2 - 4
      ctx.fillText(province.short, left - 8, labelY)
      if (!mobile && laneH >= 21) {
        ctx.fillStyle = active ? palette.muted : palette.faint
        ctx.font = `9px ui-monospace, SFMono-Regular, Menlo, monospace`
        ctx.fillText(province.count.toLocaleString(localeTag), left - 8, y + laneH / 2 + 9)
      }
    })

    // Time grid and labels.
    const ticks = buildTicks(view, domain, dateForDay, startMs, localeTag)
    ticks.forEach(tick => {
      const x = left + ((tick.day - view.start) / domain) * plotW
      if (x < left - 1 || x > left + plotW + 1) return
      ctx.strokeStyle = tick.major ? palette.grid : alphaColor(palette.grid, 0.55)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(Math.round(x) + 0.5, top)
      ctx.lineTo(Math.round(x) + 0.5, top + plotH)
      ctx.stroke()
      if (tick.label) {
        const showLabel = !mobile || domain <= 900 || !tick.major || Number(tick.label) % 2 === 0
        if (showLabel) {
          ctx.fillStyle = tick.major ? palette.muted : palette.faint
          ctx.font = `${tick.major ? 10 : 9}px ui-monospace, SFMono-Regular, Menlo, monospace`
          ctx.textAlign = tick.align ?? "center"
          ctx.textBaseline = "bottom"
          ctx.fillText(tick.label, x, top - 7)
        }
      }
    })

    // Glyphs: aggregate to pixel columns when the full decade would be sub-pixel.
    const dayWidth = plotW / domain
    const glyphAlpha = (count: number) => 0.24 + 0.66 * Math.min(1, Math.log10(count + 1) / 2)
    const heightFor = (maxMag: number) => {
      const norm = Math.max(0, Math.min(1, (maxMag - MIN_MAG) / (MAX_MAG - MIN_MAG)))
      return Math.max(1.5, Math.pow(norm, 1.35) * (laneH - 7))
    }

    if (dayWidth < 1.15) {
      const columns = Math.ceil(plotW)
      const bins: (Map<number, { count: number; maxMag: number; depthSum: number; maxDepth: number }> | null)[] =
        Array.from({ length: columns }, () => null)
      for (let day = view.start; day < view.end; day++) {
        const cells = daily.daily[day]
        if (!cells) continue
        const column = Math.min(columns - 1, Math.floor(((day - view.start) / domain) * columns))
        let bin = bins[column]
        if (!bin) {
          bin = new Map()
          bins[column] = bin
        }
        for (const [province, count, maxMag, , meanDepth, maxDepth] of cells) {
          const existing = bin.get(province)
          if (existing) {
            existing.count += count
            existing.maxMag = Math.max(existing.maxMag, maxMag)
            existing.depthSum += meanDepth * count
            existing.maxDepth = Math.max(existing.maxDepth, maxDepth)
          } else {
            bin.set(province, { count, maxMag, depthSum: meanDepth * count, maxDepth })
          }
        }
      }
      for (let column = 0; column < columns; column++) {
        const bin = bins[column]
        if (!bin) continue
        const x = left + column
        for (const [province, cell] of bin) {
          if (focusProvince !== null && focusProvince !== province) continue
          const meanDepth = cell.depthSum / Math.max(1, cell.count)
          const h = heightFor(cell.maxMag)
          const y = top + province * laneH + laneH - 3
          ctx.fillStyle = alphaColor(depthColor(meanDepth, palette), glyphAlpha(cell.count))
          ctx.fillRect(x, y - h, 1.1, h)
        }
      }
    } else {
      const width = Math.max(1, dayWidth * 0.82)
      for (let day = view.start; day < view.end; day++) {
        const cells = daily.daily[day]
        if (!cells) continue
        const x = left + ((day - view.start) / domain) * plotW + (dayWidth - width) / 2
        for (const [province, count, maxMag, , meanDepth] of cells) {
          if (focusProvince !== null && focusProvince !== province) continue
          const h = heightFor(maxMag)
          const y = top + province * laneH + laneH - 3
          ctx.fillStyle = alphaColor(depthColor(meanDepth, palette), glyphAlpha(count))
          ctx.fillRect(x, y - h, width, h)
        }
      }
    }

    // A handful of named ruptures, drawn only when they are inside the view.
    ANNOTATIONS.forEach(annotation => {
      const index = provinceIndexByEventProvince.get(annotation.province)
      if (index === undefined) return
      if (focusProvince !== null && focusProvince !== index) return
      const day = dayIndex(annotation.t)
      if (day < view.start || day >= view.end) return
      const x = left + ((day - view.start) / domain) * plotW
      const y = top + index * laneH + 2
      ctx.fillStyle = palette.accent
      ctx.beginPath()
      ctx.arc(x, y + 4, 2.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = palette.accent
      ctx.font = `9px ui-monospace, SFMono-Regular, Menlo, monospace`
      ctx.textAlign = x > left + plotW - 44 ? "right" : "left"
      ctx.textBaseline = "top"
      ctx.fillText(annotation.label, x + (x > left + plotW - 44 ? -5 : 5), y + 1)
    })
  }, [daily.daily, dateForDay, dayIndex, focusProvince, meta.provinces, palette, prepareCanvas, provinceIndexByEventProvince, size.h, size.w, view])

  const paintOverlay = useCallback(() => {
    const canvas = overlayRef.current
    if (!canvas || !size.w || !size.h) return
    const ctx = prepareCanvas(canvas, size.w, size.h)
    if (!ctx) return
    const geom = geomRef.current
    ctx.clearRect(0, 0, size.w, size.h)

    const xForDay = (day: number) => geom.left + ((day - view.start) / geom.domain) * geom.plotW

    const drag = dragRef.current
    if (drag?.active) {
      const from = xForDay(Math.min(drag.startDay, drag.currentDay))
      const to = xForDay(Math.max(drag.startDay, drag.currentDay) + 1)
      ctx.fillStyle = palette.selection
      ctx.fillRect(from, geom.top, Math.max(1, to - from), geom.plotH)
      ctx.strokeStyle = alphaColor(palette.accent, 0.5)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(from + 0.5, geom.top)
      ctx.lineTo(from + 0.5, geom.top + geom.plotH)
      ctx.moveTo(to - 0.5, geom.top)
      ctx.lineTo(to - 0.5, geom.top + geom.plotH)
      ctx.stroke()
    }

    const hoverValue = hoverRef.current
    if (hoverValue && !drag?.active) {
      const y = geom.top + hoverValue.province * geom.laneH
      ctx.fillStyle = palette.laneFocus
      ctx.fillRect(geom.left, y, geom.plotW, geom.laneH)
      const x = xForDay(hoverValue.day + 0.5)
      ctx.strokeStyle = alphaColor(palette.accent, 0.35)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(Math.round(x) + 0.5, geom.top)
      ctx.lineTo(Math.round(x) + 0.5, geom.top + geom.plotH)
      ctx.stroke()
    }

    const selectedValue = selectedRef.current
    if (selectedValue !== null) {
      const x = xForDay(selectedValue + 0.5)
      ctx.strokeStyle = alphaColor(palette.accent, 0.65)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(Math.round(x) + 0.5, geom.top)
      ctx.lineTo(Math.round(x) + 0.5, geom.top + geom.plotH)
      ctx.stroke()
    }

    if (playingRef.current) {
      const day = playDayRef.current
      const x = xForDay(day + 0.5)
      ctx.save()
      ctx.shadowColor = palette.accent
      ctx.shadowBlur = 8
      ctx.strokeStyle = palette.accent
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(Math.round(x) + 0.5, geom.top - 4)
      ctx.lineTo(Math.round(x) + 0.5, geom.top + geom.plotH)
      ctx.stroke()
      ctx.restore()
      ctx.fillStyle = palette.accent
      ctx.beginPath()
      ctx.moveTo(x - 4, geom.top - 10)
      ctx.lineTo(x + 4, geom.top - 10)
      ctx.lineTo(x, geom.top - 4)
      ctx.closePath()
      ctx.fill()
    }
  }, [palette, prepareCanvas, size.h, size.w, view])

  paintRef.current = paintOverlay

  useEffect(() => {
    drawWall()
  }, [drawWall])

  useEffect(() => {
    paintOverlay()
  }, [paintOverlay, hover, selected, playing, playDay])

  useEffect(() => {
    if (!playing) return
    lastFrameRef.current = performance.now()
    const domain = view.end - view.start
    let lastReadout = 0
    const step = (now: number) => {
      const delta = Math.min(120, now - lastFrameRef.current)
      lastFrameRef.current = now
      const next = Math.min(view.end - 1, playDayRef.current + (domain / PLAY_MS) * delta)
      playDayRef.current = next
      paintRef.current()
      if (now - lastReadout > 90) {
        lastReadout = now
        setPlayDay(Math.floor(next))
      }
      if (next >= view.end - 1) {
        playingRef.current = false
        setPlaying(false)
        setSelected(view.end - 1)
        selectedRef.current = view.end - 1
        setPlayDay(view.end - 1)
        paintRef.current()
        return
      }
      frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [playing, view.end, view.start])

  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  useEffect(() => {
    hoverRef.current = hover
  }, [hover])

  const pointerPosition = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const dayAtX = useCallback((x: number) => {
    const geom = geomRef.current
    if (x < geom.left || x > geom.left + geom.plotW) return null
    const ratio = (x - geom.left) / geom.plotW
    const day = view.start + Math.floor(ratio * geom.domain)
    return Math.max(view.start, Math.min(view.end - 1, day))
  }, [view.end, view.start])

  const provinceAtY = useCallback((y: number) => {
    const geom = geomRef.current
    if (y < geom.top || y > geom.top + geom.plotH) return null
    const index = Math.floor((y - geom.top) / geom.laneH)
    return Math.max(0, Math.min(meta.provinces.length - 1, index))
  }, [meta.provinces.length])

  const cellAt = useCallback((day: number, province: number) => {
    const cells = daily.daily[day]
    if (!cells) return null
    return cells.find(cell => cell[0] === province) ?? null
  }, [daily.daily])

  const togglePlay = useCallback(() => {
    if (playing) {
      playingRef.current = false
      setPlaying(false)
      return
    }
    const start = selected ?? view.start
    playDayRef.current = start >= view.end - 1 ? view.start : start
    playingRef.current = true
    setPlaying(true)
    setPlayDay(Math.floor(playDayRef.current))
  }, [playing, selected, view.end, view.start])

  const stopPlay = useCallback(() => {
    if (!playingRef.current) return
    playingRef.current = false
    setPlaying(false)
  }, [])

  const setView = useCallback((start: number, end: number) => {
    const clampStart = Math.max(0, Math.min(daily.days - 1, start))
    const clampEnd = Math.max(clampStart + 1, Math.min(daily.days, end))
    if (clampEnd - clampStart < 2) return
    stopPlay()
    onViewChange({ start: clampStart, end: clampEnd })
    setSelected(null)
    setPlayDay(null)
  }, [daily.days, onViewChange, stopPlay])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const position = pointerPosition(event)
    if (!position) return
    const geom = geomRef.current
    if (position.x < geom.left) {
      const province = provinceAtY(position.y)
      if (province !== null) {
        onFocusProvince(focusProvince === province ? null : province)
      }
      return
    }
    const day = dayAtX(position.x)
    if (day === null) return
    stopPlay()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { startDay: day, currentDay: day, startX: position.x, active: true }
    setSelected(day)
    setPlayDay(null)
    paintRef.current()
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const position = pointerPosition(event)
    if (!position) return
    const drag = dragRef.current
    if (drag?.active) {
      const day = dayAtX(position.x)
      if (day !== null) {
        drag.currentDay = day
        paintRef.current()
      }
      return
    }
    const geom = geomRef.current
    if (position.x < geom.left) {
      if (hover) setHover(null)
      return
    }
    const day = dayAtX(position.x)
    const province = provinceAtY(position.y)
    if (day === null || province === null) {
      if (hover) setHover(null)
      return
    }
    const cell = cellAt(day, province)
    const key = cell ? `${day}:${province}` : ""
    if (key === lastHoverKey.current) return
    lastHoverKey.current = key
    if (!cell) {
      setHover(null)
      return
    }
    setHover({ day, province, cell, x: position.x, y: position.y })
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag?.active) return
    dragRef.current = null
    const position = pointerPosition(event)
    if (position && Math.abs(position.x - drag.startX) > 6) {
      const start = Math.min(drag.startDay, drag.currentDay)
      const end = Math.max(drag.startDay, drag.currentDay) + 1
      setView(start, end)
    } else {
      setSelected(drag.startDay)
    }
    paintRef.current()
  }

  const onPointerLeave = () => {
    lastHoverKey.current = ""
    setHover(null)
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const base = selected ?? Math.floor((view.start + view.end) / 2)
    const step = event.shiftKey ? 7 : event.altKey ? 30 : 1
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault()
      stopPlay()
      const next = Math.max(view.start, Math.min(view.end - 1, base + (event.key === "ArrowLeft" ? -step : step)))
      setSelected(next)
      setHover(null)
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault()
      stopPlay()
      setSelected(event.key === "Home" ? view.start : view.end - 1)
      setHover(null)
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      togglePlay()
    } else if (event.key === "Escape") {
      setSelected(null)
      setHover(null)
    }
  }

  const selectedCells = selected !== null ? daily.daily[selected] ?? [] : []
  const selectedTotal = selectedCells.reduce((sum, cell) => sum + cell[1], 0)
  const selectedMax = selectedCells.reduce((max, cell) => Math.max(max, cell[2]), 0)
  const selectedDeepest = selectedCells.reduce((max, cell) => Math.max(max, cell[5]), 0)
  const selectedTop = [...selectedCells].sort((a, b) => b[1] - a[1]).slice(0, 2)
  const readingDay = playing ? (playDay ?? view.start) : selected
  const readingCells = readingDay !== null ? daily.daily[readingDay] ?? [] : []
  const readingTotal = readingCells.reduce((sum, cell) => sum + cell[1], 0)
  const readingMax = readingCells.reduce((max, cell) => Math.max(max, cell[2]), 0)

  return (
    <div className={styles.wallBlock}>
      <div className={styles.wallTop}>
        <div>
          <h3 className={styles.wallTitle}>Ten years, thirteen seismic zones</h3>
          <p className={styles.wallSubtitle}>
            Each mark is one day in one zone. Height is the day&rsquo;s largest magnitude; colour is mean depth.
          </p>
        </div>
        <div className={styles.legend} aria-hidden="true">
          <span className={styles.legendLabel}>depth</span>
          <span className={styles.legendBar} />
          <span className={styles.legendRange}>shallow</span>
          <span className={styles.legendRange}>deep</span>
        </div>
      </div>

      <div
        ref={wrapRef}
        className={styles.wallWrap}
        role="application"
        aria-label={copy.wallAria}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
        onDoubleClick={() => setView(0, daily.days)}
        onKeyDown={onKeyDown}
      >
        <canvas ref={wallRef} className={styles.wallCanvas} aria-hidden="true" />
        <canvas ref={overlayRef} className={styles.overlayCanvas} aria-hidden="true" />
        {hover && !playing ? (
          <div
            className={styles.tooltip}
            style={{
              left: Math.min(Math.max(8, hover.x + 14), Math.max(8, size.w - 230)),
              top: Math.max(8, Math.min(hover.y - 12, size.h - 132)),
            }}
            role="tooltip"
          >
            <div className={styles.tooltipDate}>{formatDay(hover.day, true)}</div>
            <div className={styles.tooltipZone}>{meta.provinces[hover.province].name}</div>
            <div className={styles.tooltipRow}>
              <strong>{hover.cell[1].toLocaleString(localeTag)}</strong> {fmt(copy.hoverEvents, { count: hover.cell[1] })}
            </div>
            <div className={styles.tooltipRow}>largest M{hover.cell[2].toFixed(1)} · mean depth {Math.round(hover.cell[4])} km</div>
            <div className={styles.tooltipHint}>{copy.depthHint}</div>
          </div>
        ) : null}
      </div>

      <div className={styles.wallControls}>
        <div className={styles.controlGroup}>
          <button type="button" className={styles.playButton} onClick={togglePlay} aria-pressed={playing}>
            {playing ? copy.pause : copy.play}
          </button>
          <button type="button" className={styles.preset} onClick={() => setView(0, daily.days)}>10 years</button>
          <button type="button" className={styles.preset} onClick={() => {
            const year = dateForDay(selected ?? Math.floor((view.start + view.end) / 2)).getUTCFullYear()
            setView(dayIndex(`${year}-01-01T00:00:00Z`), dayIndex(`${year + 1}-01-01T00:00:00Z`))
          }}>Year</button>
          <button type="button" className={styles.preset} onClick={() => {
            const date = dateForDay(selected ?? Math.floor((view.start + view.end) / 2))
            const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
            const end = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
            setView(dayIndex(new Date(start).toISOString()), dayIndex(new Date(end).toISOString()))
          }}>Month</button>
        </div>
        <div className={styles.readout} aria-live="polite">
          {readingDay !== null ? (
            <>
              <span className={styles.readoutDate}>{formatDay(readingDay, true)}</span>
              <span className={styles.readoutMeta}>
                {fmt(copy.readingSummary, { count: readingTotal.toLocaleString(localeTag), mag: readingMax.toFixed(1), events: "" })}
              </span>
            </>
          ) : (
            <span className={styles.readoutMeta}>Hover a day, click to pin it, or drag across the wall to zoom.</span>
          )}
        </div>
      </div>

      {selected !== null && !playing ? (
        <div className={styles.pinned}>
          <div>
            <span className={styles.pinnedDate}>{formatDay(selected, true)}</span>
            <span className={styles.pinnedMeta}>
              {fmt(copy.selectedSummary, {
                count: selectedTotal.toLocaleString(localeTag),
                mag: selectedMax.toFixed(1),
                depth: Math.round(selectedDeepest),
              })}
            </span>
          </div>
          <div className={styles.pinnedZones}>
            {selectedTop.map(([province, count]) => (
              <button
                key={province}
                type="button"
                className={styles.pinnedZone}
                onClick={() => onFocusProvince(focusProvince === province ? null : province)}
              >
                {meta.provinces[province].short} · {count}
              </button>
            ))}
            <button type="button" className={styles.pinnedClose} onClick={() => setSelected(null)} aria-label="Clear pinned day">×</button>
          </div>
        </div>
      ) : null}

      <p className={styles.wallNote}>
        {fmt(copy.wallHint, {
          largest: top.top[0]
            ? fmt(copy.wallLargest, {
                mag: top.top[0].mag.toFixed(1),
                date: formatDay(dayIndex(top.top[0].t), true),
              })
            : "",
        })}
      </p>
    </div>
  )
}

function buildTicks(view: WallView, domain: number, dateForDay: (day: number) => Date, startMs: number, localeTag: string) {
  const ticks: { day: number; label: string; major: boolean; align?: CanvasTextAlign }[] = []
  if (domain > 900) {
    const startYear = dateForDay(view.start).getUTCFullYear()
    const endYear = dateForDay(view.end - 1).getUTCFullYear()
    for (let year = startYear; year <= endYear; year++) {
      const day = Math.floor((Date.UTC(year, 0, 1) - startMs) / DAY_MS)
      if (day < view.start || day >= view.end) continue
      ticks.push({ day, label: String(year), major: true })
    }
  } else if (domain > 100) {
    const start = dateForDay(view.start)
    const end = dateForDay(view.end - 1)
    let cursor = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)
    const last = Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 1)
    let index = 0
    while (cursor <= last && index < 80) {
      const date = new Date(cursor)
      const day = Math.floor((cursor - startMs) / DAY_MS)
      if (day >= view.start && day < view.end) {
        const isJanuary = date.getUTCMonth() === 0
        ticks.push({
          day,
          label: isJanuary ? `${date.getUTCFullYear()}` : new Intl.DateTimeFormat(localeTag, { month: "short", timeZone: "UTC" }).format(date),
          major: isJanuary,
        })
      }
      cursor = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
      index++
    }
  } else {
    const step = domain > 45 ? 7 : 1
    for (let day = view.start; day < view.end; day += step) {
      ticks.push({
        day,
        label: new Intl.DateTimeFormat(localeTag, { month: "short", day: "numeric", timeZone: "UTC" }).format(dateForDay(day)),
        major: false,
      })
    }
  }
  return ticks
}
