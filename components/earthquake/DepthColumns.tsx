"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { alphaColor, depthColor, paletteFor } from "./palette"
import type { DepthData, Meta } from "./types"
import type { EqCopy } from "./copy"
import { fmt } from "@/lib/i18n"
import styles from "./EarthquakePulse.module.css"

type Props = {
  meta: Meta
  depth: DepthData
  focusProvince: number | null
  onFocusProvince: (index: number | null) => void
  theme: "light" | "dark"
  copy: EqCopy
  localeTag: string
}

type Hover = {
  province: number
  bin: number
  count: number
  energy: number
  x: number
  y: number
}

export default function DepthColumns({ meta, depth, focusProvince, onFocusProvince, theme, copy, localeTag }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const geomRef = useRef({ left: 0, top: 0, plotW: 1, plotH: 1, rows: 1, bins: 1 })
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [hover, setHover] = useState<Hover | null>(null)
  const palette = useMemo(() => paletteFor(theme === "dark"), [theme])
  const maxCount = useMemo(() => {
    let max = 0
    for (const province of depth.provinces) {
      for (const value of province.counts) max = Math.max(max, value)
    }
    return Math.max(1, max)
  }, [depth.provinces])

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

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !size.w || !size.h) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const pixelWidth = Math.max(1, Math.round(size.w * dpr))
    const pixelHeight = Math.max(1, Math.round(size.h * dpr))
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size.w, size.h)

    const mobile = size.w < 560
    const left = mobile ? 57 : 88
    const right = 14
    const top = 18
    const bottom = mobile ? 22 : 24
    const plotW = Math.max(1, size.w - left - right)
    const plotH = Math.max(1, size.h - top - bottom)
    const rows = depth.provinces.length
    const rowH = plotH / rows
    const bins = depth.provinces[0]?.counts.length ?? 1
    geomRef.current = { left, top, plotW, plotH, rows, bins }

    const xForBin = (bin: number) => left + (bin / bins) * plotW

    // Depth ticks.
    const tickKm = [0, 50, 100, 150, 200, 250, 300]
    tickKm.forEach(km => {
      const bin = Math.min(bins - 1, Math.floor(km / depth.binKm))
      const x = xForBin(bin)
      ctx.strokeStyle = palette.grid
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(Math.round(x) + 0.5, top)
      ctx.lineTo(Math.round(x) + 0.5, top + plotH)
      ctx.stroke()
      ctx.fillStyle = palette.muted
      ctx.font = `9px ui-monospace, SFMono-Regular, Menlo, monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillText(km === 300 ? depth.overflowLabel : String(km), x, top + plotH + 5)
    })

    // Province labels.
    meta.provinces.forEach((province, index) => {
      const y = top + index * rowH
      const active = focusProvince === null || focusProvince === index
      ctx.fillStyle = active ? palette.text : palette.faint
      ctx.font = `${focusProvince === index ? "600 " : ""}${mobile ? 9 : 11}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`
      ctx.textAlign = "right"
      ctx.textBaseline = "middle"
      ctx.fillText(province.short, left - 8, y + rowH / 2)
      if (index < rows - 1) {
        ctx.strokeStyle = alphaColor(palette.grid, 0.45)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(left, Math.round(y + rowH) + 0.5)
        ctx.lineTo(left + plotW, Math.round(y + rowH) + 0.5)
        ctx.stroke()
      }
    })

    // Cells.
    depth.provinces.forEach((province, row) => {
      const dimmed = focusProvince !== null && focusProvince !== row
      const y = top + row * rowH + 1
      const height = Math.max(1, rowH - 2)
      province.counts.forEach((count, bin) => {
        if (!count) return
        const alpha = (0.12 + 0.78 * (Math.log(count + 1) / Math.log(maxCount + 1))) * (dimmed ? 0.16 : 1)
        const center = bin >= bins - 1 ? Math.max(depth.maxKm, 320) : bin * depth.binKm + depth.binKm / 2
        ctx.fillStyle = alphaColor(depthColor(center, palette), alpha)
        ctx.fillRect(xForBin(bin), y, Math.max(1, plotW / bins), height)
      })
    })

    // Vrancea sits as an isolated deep cluster inside the Romania row.
    const romaniaIndex = meta.provinces.findIndex(province => province.id === "romania")
    if (romaniaIndex >= 0) {
      const binStart = Math.floor(70 / depth.binKm)
      const binEnd = Math.ceil(175 / depth.binKm)
      const y = top + romaniaIndex * rowH
      ctx.strokeStyle = alphaColor(palette.accent, 0.35)
      ctx.setLineDash([3, 3])
      ctx.lineWidth = 1
      ctx.strokeRect(xForBin(binStart) + 0.5, y + 1.5, Math.max(1, xForBin(binEnd) - xForBin(binStart)), Math.max(1, rowH - 3))
      ctx.setLineDash([])
    }

    // Focus row outline.
    if (focusProvince !== null) {
      const y = top + focusProvince * rowH
      ctx.strokeStyle = alphaColor(palette.accent, 0.5)
      ctx.lineWidth = 1
      ctx.strokeRect(left + 0.5, y + 0.5, plotW - 1, rowH - 1)
    }
  }, [depth, focusProvince, maxCount, meta.provinces, palette, size.h, size.w])

  useEffect(() => {
    draw()
  }, [draw])

  function position(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const point = position(event)
    if (!point) return
    const geom = geomRef.current
    if (point.x < geom.left || point.x > geom.left + geom.plotW || point.y < geom.top || point.y > geom.top + geom.plotH) {
      if (hover) setHover(null)
      return
    }
    const row = Math.max(0, Math.min(geom.rows - 1, Math.floor((point.y - geom.top) / (geom.plotH / geom.rows))))
    const bin = Math.max(0, Math.min(geom.bins - 1, Math.floor(((point.x - geom.left) / geom.plotW) * geom.bins)))
    const province = depth.provinces[row]
    const count = province.counts[bin] ?? 0
    if (!count) {
      if (hover) setHover(null)
      return
    }
    setHover({ province: row, bin, count, energy: province.energy[bin] ?? 0, x: point.x, y: point.y })
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const point = position(event)
    if (!point) return
    const geom = geomRef.current
    if (point.y < geom.top || point.y > geom.top + geom.plotH) return
    const row = Math.max(0, Math.min(geom.rows - 1, Math.floor((point.y - geom.top) / (geom.plotH / geom.rows))))
    onFocusProvince(focusProvince === row ? null : row)
  }

  return (
    <div className={styles.depthBlock}>
      <div className={styles.panelHead}>
        <h3 className={styles.panelTitle}>{copy.depthTitle}</h3>
        <p className={styles.panelSubtitle}>{copy.depthSubtitle}</p>
      </div>
      <div
        ref={wrapRef}
        className={styles.depthWrap}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHover(null)}
        onPointerDown={onPointerDown}
      >
        <canvas ref={canvasRef} className={styles.depthCanvas} aria-hidden="true" />
        {hover ? (
          <div
            className={styles.tooltip}
            style={{
              left: Math.min(Math.max(8, hover.x + 14), Math.max(8, size.w - 220)),
              top: Math.max(8, Math.min(hover.y - 10, size.h - 96)),
            }}
            role="tooltip"
          >
            <div className={styles.tooltipDate}>{meta.provinces[hover.province].name}</div>
            <div className={styles.tooltipRow}>
              {hover.bin >= depth.provinces[0].counts.length - 1
                ? `${depth.overflowLabel} km`
                : `${hover.bin * depth.binKm}–${(hover.bin + 1) * depth.binKm} km`}
              {" · "}
              <strong>{hover.count.toLocaleString(localeTag)}</strong> {fmt(copy.hoverEvents, { count: hover.count })}
            </div>
            <div className={styles.tooltipHint}>{copy.depthHint}</div>
          </div>
        ) : null}
      </div>
      <p className={styles.panelNote}>{copy.depthNote}</p>
    </div>
  )
}
