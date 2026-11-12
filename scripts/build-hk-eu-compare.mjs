/**
 * Build the Europe-vs-Hong-Kong comparison bundle for the HK charging post.
 *
 * Reads the lossless European station registry (stations.csv.gz, the same
 * snapshot the Europe charging post publishes) plus the already-built HK
 * stations.geojson, and emits one compact file:
 *
 *   public/interactive/hk-ev-charging/data/eu_compare.json
 *     {
 *       generatedAt, euStations, euPoints,
 *       countries: [{ cc, en, tc, stations, points, ppsMedian, ppsMean, dcShare }],
 *       hk: { stations, points, ppsMedian, ppsMean, dcShare }
 *     }
 *
 * Every metric is a registry-count metric: totals, points per station and
 * the >=50 kW (power class 3) share of points. Land-area density is
 * deliberately NOT computed — the European sources cover countries very
 * unevenly, so per-km² figures would compare registry coverage, not
 * infrastructure.
 *
 * Usage: node scripts/build-hk-eu-compare.mjs
 */
import { readFile, writeFile } from "node:fs/promises"
import { gunzipSync } from "node:zlib"
import { fileURLToPath } from "node:url"

const HK_STATIONS = fileURLToPath(new URL("../public/interactive/hk-ev-charging/data/stations.geojson", import.meta.url))
const HK_META = fileURLToPath(new URL("../public/interactive/hk-ev-charging/data/meta.json", import.meta.url))
const EU_CSV = fileURLToPath(new URL("../public/interactive/ev-charging-europe/data/stations.csv.gz", import.meta.url))
const EU_SUMMARY = fileURLToPath(new URL("../public/interactive/ev-charging-europe/data/summary.json", import.meta.url))
const OUT = fileURLToPath(new URL("../public/interactive/hk-ev-charging/data/eu_compare.json", import.meta.url))

const NAMES = {
  AD: ["Andorra", "安道爾"],
  AL: ["Albania", "阿爾巴尼亞"],
  AT: ["Austria", "奧地利"],
  BA: ["Bosnia and Herzegovina", "波士尼亞與赫塞哥維納"],
  BE: ["Belgium", "比利時"],
  BG: ["Bulgaria", "保加利亞"],
  BY: ["Belarus", "白俄羅斯"],
  CH: ["Switzerland", "瑞士"],
  CY: ["Cyprus", "賽普勒斯"],
  CZ: ["Czechia", "捷克"],
  DE: ["Germany", "德國"],
  DK: ["Denmark", "丹麥"],
  EE: ["Estonia", "愛沙尼亞"],
  ES: ["Spain", "西班牙"],
  FI: ["Finland", "芬蘭"],
  FO: ["Faroe Islands", "法羅群島"],
  FR: ["France", "法國"],
  GB: ["United Kingdom", "英國"],
  GG: ["Guernsey", "根息"],
  GR: ["Greece", "希臘"],
  HR: ["Croatia", "克羅埃西亞"],
  HU: ["Hungary", "匈牙利"],
  IE: ["Ireland", "愛爾蘭"],
  IM: ["Isle of Man", "曼島"],
  IS: ["Iceland", "冰島"],
  IT: ["Italy", "義大利"],
  JE: ["Jersey", "澤西"],
  LI: ["Liechtenstein", "列支敦斯登"],
  LT: ["Lithuania", "立陶宛"],
  LU: ["Luxembourg", "盧森堡"],
  LV: ["Latvia", "拉脫維亞"],
  MC: ["Monaco", "摩納哥"],
  MD: ["Moldova", "摩爾多瓦"],
  ME: ["Montenegro", "蒙特內哥羅"],
  MK: ["North Macedonia", "北馬其頓"],
  MT: ["Malta", "馬爾他"],
  NL: ["Netherlands", "荷蘭"],
  NO: ["Norway", "挪威"],
  PL: ["Poland", "波蘭"],
  PT: ["Portugal", "葡萄牙"],
  RO: ["Romania", "羅馬尼亞"],
  RS: ["Serbia", "塞爾維亞"],
  SE: ["Sweden", "瑞典"],
  SI: ["Slovenia", "斯洛維尼亞"],
  SK: ["Slovakia", "斯洛伐克"],
  SM: ["San Marino", "聖馬利諾"],
  UA: ["Ukraine", "烏克蘭"],
  XK: ["Kosovo", "科索沃"],
}

function parseCsvLine(line) {
  const out = []
  let cur = ""
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ }
        else quoted = false
      } else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === ",") { out.push(cur); cur = "" }
    else cur += ch
  }
  out.push(cur)
  return out
}

const median = values => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// --- Hong Kong side -------------------------------------------------------
const hk = JSON.parse(await readFile(HK_STATIONS, "utf8"))
const hkMeta = JSON.parse(await readFile(HK_META, "utf8"))
const hkPoints = hk.features.map(feature => {
  const p = feature.properties
  return p.s + p.m + p.dc
})
const hkStations = hkPoints.length
const hkTotal = hkPoints.reduce((a, b) => a + b, 0)
if (hkTotal !== hkMeta.totals.chargers) {
  throw new Error(`HK totals mismatch: stations.geojson ${hkTotal} vs meta.json ${hkMeta.totals.chargers}`)
}
const hkHk = {
  stations: hkStations,
  points: hkTotal,
  ppsMedian: median(hkPoints),
  ppsMean: Math.round((hkTotal / hkStations) * 10) / 10,
  dcShare: Math.round((hkMeta.totals.dc / hkTotal) * 1000) / 10,
}

// --- European side --------------------------------------------------------
const euSummary = JSON.parse(await readFile(EU_SUMMARY, "utf8"))
const csv = gunzipSync(await readFile(EU_CSV)).toString()
const lines = csv.split("\n")
const header = parseCsvLine(lines[0].replace(/^\uFEFF/, ""))
const col = Object.fromEntries(header.map((key, i) => [key, i]))
const countries = new Map()
let skipped = 0
for (let i = 1; i < lines.length; i++) {
  const line = lines[i]
  if (!line) continue
  const fields = parseCsvLine(line)
  if (fields.length !== header.length) { skipped++; continue }
  const cc = fields[col.country]
  if (!cc || !NAMES[cc]) { skipped++; continue }
  const rawPoints = Number(fields[col.num_points])
  const points = Number.isFinite(rawPoints) && rawPoints >= 0 ? rawPoints : 1
  const powerClass = fields[col.power_class]
  let entry = countries.get(cc)
  if (!entry) { entry = { pps: [], points: 0, dcPoints: 0 }; countries.set(cc, entry) }
  entry.pps.push(points)
  entry.points += points
  if (powerClass === "3") entry.dcPoints += points
}

const euCountries = [...countries.entries()].map(([cc, entry]) => ({
  cc,
  en: NAMES[cc][0],
  tc: NAMES[cc][1],
  stations: entry.pps.length,
  points: entry.points,
  ppsMedian: median(entry.pps),
  ppsMean: Math.round((entry.points / entry.pps.length) * 10) / 10,
  dcShare: Math.round((entry.dcPoints / entry.points) * 1000) / 10,
})).sort((a, b) => b.points - a.points)

const euStations = euCountries.reduce((sum, c) => sum + c.stations, 0)
const euPoints = euCountries.reduce((sum, c) => sum + c.points, 0)

const bundle = {
  generatedAt: new Date().toISOString().slice(0, 10),
  euSnapshot: euSummary.generated_at?.slice(0, 10) ?? null,
  euStations,
  euPoints,
  countries: euCountries,
  hk: hkHk,
}

await writeFile(OUT, JSON.stringify(bundle))
console.log(
  `EU compare built: ${euCountries.length} countries, ${euStations} stations, ${euPoints} points ` +
  `(csv skipped rows: ${skipped}); HK ${hkHk.stations} stations / ${hkHk.points} points ` +
  `(median ${hkHk.ppsMedian}, mean ${hkHk.ppsMean}, DC ${hkHk.dcShare}%)`
)
