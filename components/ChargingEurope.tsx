"use client"

import { useEffect, useRef, useState } from "react"

const PATHS = { map: "/index.html", report: "/analysis-report/index.html" } as const
const COPY = {
  en: {
    heading: "Explore Europe’s charging network",
    description: "Map and report keep their filters when you switch views, so you can continue exploring.",
    group: "Charging network views", fullscreen: "Full screen", open: "Open separately ↗",
    unavailable: "Full screen is unavailable. Use Open separately instead.",
    note: "Stations and analysis use fixed project snapshots. Online basemaps need a connection; the map can fall back to an offline country outline. The highest power-class label is corrected to >50 kW.",
    views: [
      { id: "map", label: "Interactive map", hint: "Filter by country, power, and operator. Click clusters or stations for details; summary figures and charts update with your filters.", title: "European charging stations: interactive map and filters" },
      { id: "report", label: "Spatial analysis & report", hint: "Switch hexagon metrics, drag Germany’s year slider, or expand the report’s detailed evidence gallery of 23 charts.", title: "European charging network: spatial analysis and interactive report" },
    ],
  },
  "zh-TW": {
    heading: "探索歐洲充電網路",
    description: "地圖與報告各自保留篩選狀態，切換檢視後可以繼續探索。",
    group: "充電網路檢視", fullscreen: "全螢幕檢視", open: "獨立開啟 ↗",
    unavailable: "暫時無法進入全螢幕，可使用「獨立開啟」。",
    note: "站點與報告使用專案固定快照。線上底圖需要網路；無法連線時地圖可退回離線國界底圖。最高功率等級標籤已依原始資料界線更正為 >50 kW。",
    views: [
      { id: "map", label: "互動地圖", hint: "按國家、功率與營運商篩選。點擊聚類或站點查看詳情；統計與圖表會隨篩選更新。", title: "歐洲充電站互動地圖與篩選統計" },
      { id: "report", label: "空間分析與報告", hint: "切換六邊形指標、拖動德國年份軸，或展開報告末尾的 23 張詳細證據圖表。", title: "歐洲充電網路空間分析與互動報告" },
    ],
  },
} as const

type ChargingLanguage = "en" | "zh-TW"

export default function ChargingEurope({ basePath, language = "en" }: { basePath: string; language?: ChargingLanguage }) {
  const dataRoot = `${basePath}/interactive/ev-charging-europe`
  const root = `${dataRoot}${language === "en" ? "/en" : ""}`
  const copy = COPY[language]
  const views = copy.views
  const [view, setView] = useState<"map" | "report">("map")
  const container = useRef<HTMLDivElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const [notice, setNotice] = useState("")
  const current = views.find(item => item.id === view)!

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      container.current?.querySelector<HTMLIFrameElement>(`#charging-panel-${view} iframe`)
        ?.contentWindow?.dispatchEvent(new Event("resize"))
    })
    return () => cancelAnimationFrame(frame)
  }, [view])

  function select(id: "map" | "report") {
    setView(id)
  }

  function connect(frame: HTMLIFrameElement) {
    // Keep the supplied applications intact; adapt their original site-root links
    // at the embedding boundary so downloads and cross-navigation stay in this post.
    const doc = frame.contentDocument
    if (!doc) return
    doc.addEventListener("click", event => {
      const target = event.target
      if (!(target instanceof (frame.contentWindow as Window & typeof globalThis).Element)) return
      const anchor = (target as Element).closest("a")
      if (!anchor) return
      const href = anchor.getAttribute("href")
      if (href === "/") {
        event.preventDefault()
        select("map")
      } else if (href?.startsWith("/data/")) {
        event.preventDefault()
        const link = doc.createElement("a")
        link.href = `${dataRoot}${href === "/data/stations.csv" ? "/data/stations.csv.gz" : href}`
        link.download = href.endsWith(".csv") ? "stations.csv.gz" : href.split("/").pop()!
        link.click()
      } else if (href?.includes("analysis-report/")) {
        event.preventDefault()
        select("report")
      } else if (href && /^https?:\/\//.test(href)) {
        anchor.setAttribute("target", "_blank")
        anchor.setAttribute("rel", "noopener noreferrer")
      }
    })
  }

  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (container.current?.requestFullscreen) await container.current.requestFullscreen()
      else setNotice(copy.unavailable)
    } catch { setNotice(copy.unavailable) }
  }

  return <section id="explore-network" aria-labelledby="charging-explorer-heading" className="charging-explorer not-prose" lang={language === "zh-TW" ? "zh-TW" : "en"}>
    <div className="mb-5">
      <h2 id="charging-explorer-heading" className="text-2xl font-semibold tracking-tight">{copy.heading}</h2>
      <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">{copy.description}</p>
    </div>
    <div ref={container} className="charging-workspace">
      <div className="charging-toolbar">
        <div role="tablist" aria-label={copy.group} className="charging-tabs">
          {views.map((item, index) => <button ref={element => { tabs.current[index] = element }} key={item.id} id={`charging-tab-${item.id}`} type="button" role="tab" aria-selected={view === item.id} aria-controls={`charging-panel-${item.id}`} tabIndex={view === item.id ? 0 : -1} onClick={() => select(item.id)} onKeyDown={event => {
            const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : event.key === "ArrowRight" || event.key === "ArrowLeft" ? 1 - index : null
            if (next === null) return
            event.preventDefault(); select(views[next].id); tabs.current[next]?.focus()
          }}>{item.label}</button>)}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button type="button" className="hover:text-accent" onClick={fullscreen}>{copy.fullscreen}</button>
          <a href={`${root}${PATHS[current.id]}`} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{copy.open}</a>
        </div>
      </div>
      <p className="charging-hint">{current.hint}</p>
      {notice && <p role="status" className="px-4 py-2 text-sm">{notice}</p>}
      {views.map(item => <div key={item.id} id={`charging-panel-${item.id}`} role="tabpanel" aria-labelledby={`charging-tab-${item.id}`} hidden={view !== item.id} className="charging-panel">
        {/* Both views stay mounted so their content and links are present for crawlers; tabs switch focus. */}
        <iframe title={item.title} src={`${root}${item.id === "report" ? "/analysis-report/dist/reader.html" : PATHS[item.id]}`} onLoad={event => connect(event.currentTarget)} allow="fullscreen" loading="lazy" className="charging-frame" />
      </div>)}
    </div>
    <p className="mt-3 text-xs leading-6 text-zinc-500 dark:text-zinc-400">{copy.note}</p>
  </section>
}
