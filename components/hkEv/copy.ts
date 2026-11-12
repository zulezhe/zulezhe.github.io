export type HkEvCopy = {
  kicker: string
  heading: string
  intro: string
  statLocations: string
  statChargers: string
  statDc: string
  statDcShare: string
  viewMap: string
  viewDistricts: string
  classAll: string
  classStd: string
  classMed: string
  classDc: string
  classFilterAria: string
  allDistricts: string
  districtFilterAria: string
  mapHint: string
  mapAttribution: string
  mapClickHint: string
  detailEmpty: string
  detailName: string
  detailAddress: string
  detailStd: string
  detailMed: string
  detailDc: string
  detailTotal: string
  districtTitle: string
  districtSubtitleAll: string
  districtSubtitleClass: string
  districtLocations: string
  districtNoData: string
  compareTitle: string
  compareIntro: string
  compareMetricPoints: string
  compareMetricPps: string
  compareMetricDc: string
  compareMetricAria: string
  compareNotePoints: string
  compareNotePps: string
  compareNoteDc: string
  compareRankTemplate: string
  compareShowAll: string
  compareShowLess: string
  compareLink: string
  snapshotBefore: string
  snapshotAfter: string
  sourceBefore: string
  sourceNote: string
  loading: string
  loadingNote: string
  errorTitle: string
  errorHint: string
}

export const hkEvCopy: Record<"en" | "zh-TW", HkEvCopy> = {
  en: {
    kicker: "Hong Kong public charging",
    heading: "990 places to plug in, one compact city",
    intro:
      "Every public EV charger registered in Hong Kong by the Environmental Protection Department, mapped and broken down by charging class. 990 locations hold 18,202 chargers — and 542 of them offer DC fast charging.",
    statLocations: "charging locations",
    statChargers: "chargers in total",
    statDc: "DC fast chargers",
    statDcShare: "locations with fast charging",
    viewMap: "Map",
    viewDistricts: "Districts",
    classAll: "All chargers",
    classStd: "Standard (13A)",
    classMed: "Medium AC",
    classDc: "Fast (DC)",
    classFilterAria: "Filter by charging class",
    allDistricts: "All 18 districts",
    districtFilterAria: "Filter by district",
    mapHint: "Circle size follows the chargers of the selected class at each location. Click a circle for details.",
    mapAttribution: "Basemap © OpenStreetMap contributors © CARTO",
    mapClickHint: "Click any circle to inspect that location.",
    detailEmpty: "No location selected yet. Click a circle on the map.",
    detailName: "Location",
    detailAddress: "Address",
    detailStd: "Standard",
    detailMed: "Medium AC",
    detailDc: "Fast DC",
    detailTotal: "Total",
    districtTitle: "Where the chargers concentrate",
    districtSubtitleAll: "All classes combined, by district council district.",
    districtSubtitleClass: "Showing the selected class only.",
    districtLocations: "locations",
    districtNoData: "No chargers of this class in this district.",
    compareTitle: "Rank Hong Kong against the 48 countries",
    compareIntro:
      "The companion post registers 275,402 stations and 753,603 charge points across 48 European countries. Insert Hong Kong as the 49th registry — same three questions, one city answering them.",
    compareMetricPoints: "Registered charge points",
    compareMetricPps: "Points per station (median)",
    compareMetricDc: "Fast-charger share",
    compareMetricAria: "Switch comparison metric",
    compareNotePoints:
      "Registry coverage differs wildly between countries — Germany and France register far more completely than the Netherlands. Read this as orders of magnitude, not a league table.",
    compareNotePps:
      "Each registry defines a “station” differently: Germany logs one record per post, France groups several posts into a station, Hong Kong registers by car park. The median shows that shape better than totals.",
    compareNoteDc:
      "Europe counts charge points rated ≥50 kW (power class 3); Hong Kong counts EPD quick + fast. Ukraine's 97% is a registration artefact, not real infrastructure.",
    compareRankTemplate: "Hong Kong ranks {rank} of {total}",
    compareShowAll: "Show all {total} registries",
    compareShowLess: "Collapse",
    compareLink: "Read the European charging network analysis →",
    snapshotBefore: "Snapshot generated",
    snapshotAfter: "; from EPD's public-access charger dataset; the portal refreshes quarterly.",
    sourceBefore: "Source:",
    sourceNote:
      "Districts follow the 18 District Council districts. Charger classes follow EPD's standard / medium / quick / fast breakdown; quick and fast DC chargers are combined here as one fast-charging class.",
    loading: "Loading the charging map",
    loadingNote: "990 locations load as a single small bundle — no progressive fetching needed.",
    errorTitle: "The charging data could not be loaded.",
    errorHint: "Check that the data files are published and reload the page.",
  },
  "zh-TW": {
    kicker: "香港公共充電網路",
    heading: "990 個可以插電的地方,塞在同一座城裡",
    intro:
      "環保署登記的全港公共電動車充電器,每一個場站畫在地圖上,並按充電等級拆開看:990 個地點合共 18,202 個充電器,其中 542 個地點提供直流快充。",
    statLocations: "充電場站",
    statChargers: "充電器總數",
    statDc: "直流快充充電器",
    statDcShare: "提供快充的場站",
    viewMap: "地圖",
    viewDistricts: "分區排行",
    classAll: "全部充電器",
    classStd: "標準 (13A)",
    classMed: "中速 AC",
    classDc: "快充 (DC)",
    classFilterAria: "按充電等級篩選",
    allDistricts: "全部 18 區",
    districtFilterAria: "按地區篩選",
    mapHint: "圓圈大小對應所選等級的充電器數量。點擊圓圈查看詳情。",
    mapAttribution: "底圖 © OpenStreetMap 貢獻者 © CARTO",
    mapClickHint: "點擊任何圓圈即可查看該場站。",
    detailEmpty: "尚未選取場站。點擊地圖上的圓圈。",
    detailName: "場站",
    detailAddress: "地址",
    detailStd: "標準",
    detailMed: "中速",
    detailDc: "快充 DC",
    detailTotal: "合計",
    districtTitle: "充電器集中在哪裡",
    districtSubtitleAll: "三個等級合計,按 18 區排列。",
    districtSubtitleClass: "目前只計入所選等級。",
    districtLocations: "個場站",
    districtNoData: "這區沒有此等級的充電器。",
    compareTitle: "把香港塞進 48 國的排行",
    compareIntro:
      "歐洲那篇登記了 48 個國家與地區、275,402 筆站點、753,603 個充電點。把香港當成第 49 個登記庫塞進去,同一個問題,一座城市來回答。",
    compareMetricPoints: "登記充電點總數",
    compareMetricPps: "每站充電點數(中位數)",
    compareMetricDc: "快充充電點佔比",
    compareMetricAria: "切換對比指標",
    compareNotePoints:
      "只比登記總量。各國登記庫覆蓋差異極大——德國和法國的登記遠比荷蘭完整,這裡看的是量級,不是名次表。",
    compareNotePps:
      "每個國家的「站點」由不同登記規則定義:德國一桿一筆紀錄,法國多樁併一站,香港按停車場登記。中位數比總量更能看出這種形狀差。",
    compareNoteDc:
      "歐洲取額定 ≥50 kW(功率第 3 級)的充電點佔比;香港取環保署 quick+fast 兩級。烏克蘭的 97% 是登記偏差,不是真實基建。",
    compareRankTemplate: "香港在 {total} 個登記庫裡排第 {rank}",
    compareShowAll: "展開全部 {total} 列",
    compareShowLess: "收合",
    compareLink: "閱讀歐洲充電網路分析 →",
    snapshotBefore: "快照生成於",
    snapshotAfter: ",來自環保署公共充電器資料集;該資料集每季更新。",
    sourceBefore: "資料來源:",
    sourceNote:
      "分區採用 18 區區議會分區;等級沿用環保署標準/中速/快速/快速的劃分,此處把 quick 與 fast 兩級直流快充合併為同一個快充等級。",
    loading: "正在載入充電地圖",
    loadingNote: "990 個場站一次載入,一個小檔案就夠,無需漸進式抓取。",
    errorTitle: "無法載入充電資料。",
    errorHint: "請確認資料檔案已發布,然後重新整理頁面。",
  },
}
