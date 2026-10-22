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
  zh: {
    heading: "在地图上探索欧洲充电网络",
    description: "地图与报告保留各自的筛选状态，切换视图后可以接着探索。",
    group: "充电网络视图", fullscreen: "全屏查看", open: "独立打开 ↗",
    unavailable: "暂时无法进入全屏，可使用「独立打开」查看。",
    note: "站点与报告使用项目固定快照。在线底图需要网络；不可用时地图支持国界底图回退。地图最高功率档已按原始数据边界更正为 >50 kW。",
    views: [
      { id: "map", label: "交互地图", hint: "按国家、功率和运营商筛选，点击地图聚类或站点查看详情。统计与图表会随筛选更新。", title: "欧洲充电站交互地图与筛选统计" },
      { id: "report", label: "空间分析与报告", hint: "切换六边形地图指标、拖动德国年份时间轴，或展开报告末尾的 23 张详细证据图表。", title: "欧洲充电网络空间分析与交互报告" },
    ],
  },
} as const

export default function ChargingEurope({ basePath, language = "en" }: { basePath: string; language?: "en" | "zh" }) {
  const dataRoot = `${basePath}/interactive/ev-charging-europe`
  const root = `${dataRoot}${language === "en" ? "/en" : ""}`
  const copy = COPY[language]
  const views = copy.views
  const [view, setView] = useState<"map" | "report">("map")
  const [visited, setVisited] = useState<string[]>(["map"])
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
    setVisited(previous => previous.includes(id) ? previous : [...previous, id])
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

  return <section id="explore-network" aria-labelledby="charging-explorer-heading" className="charging-explorer not-prose" lang={language === "zh" ? "zh-CN" : "en"}>
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
        {visited.includes(item.id) && <iframe title={item.title} src={`${root}${item.id === "report" ? "/analysis-report/dist/reader.html" : PATHS[item.id]}`} onLoad={event => connect(event.currentTarget)} allow="fullscreen" loading="lazy" className="charging-frame" />}
      </div>)}
    </div>
    <p className="mt-3 text-xs leading-6 text-zinc-500 dark:text-zinc-400">{copy.note}</p>
  </section>
}
