/**
 * Build the progressive data bundle for the EV charging explorer.
 *
 * The published site only needs three layers:
 *   data/overview.geojson       coarse cells for the first paint
 *   data/stats/{CC}.json        compact aggregate rows for filters and charts
 *   data/detail/{lat}_{lon}.json individual stations, loaded per viewport
 *
 * The lossless source remains data/stations.csv.gz. The old per-country
 * GeoJSON files are no longer used by the app.
 */
import { mkdir, readFile, writeFile, rm } from "node:fs/promises"
import { gunzipSync } from "node:zlib"
import { fileURLToPath } from "node:url"
import { join } from "node:path"

const root = fileURLToPath(new URL("../public/interactive/ev-charging-europe/", import.meta.url))
const dataRoot = join(root, "data")
const STATS_DIR = join(dataRoot, "stats")
const DETAIL_DIR = join(dataRoot, "detail")

const STAT_RES = 0.01   // ~1.1 km aggregate cells
const DETAIL_RES = 1    // 1° viewport tiles
const OVERVIEW_RES = 1

const STATUS_INDEX = new Map([
  ["运营中", 0],
  ["维护中", 1],
  ["规划中", 2],
  ["停止运营", 3],
  ["状态未知", 4]
])
const TYPE_INDEX = new Map([["AC", 0], ["DC", 1]])

function* parseCsv(text) {
  let field = ""
  let row = []
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ",") { row.push(field); field = "" }
    else if (ch === "\n") {
      row.push(field.replace(/\r$/, ""))
      field = ""
      if (row.length > 1 || row[0] !== "") yield row
      row = []
    } else field += ch
  }
  if (field || row.length) { row.push(field); yield row }
}

const operators = JSON.parse(await readFile(join(dataRoot, "operators.json"), "utf8"))
const opIndex = new Map(operators.map((o, i) => [o.name, i]))

await rm(STATS_DIR, { recursive: true, force: true })
await rm(DETAIL_DIR, { recursive: true, force: true })
await rm(join(dataRoot, "geojson"), { recursive: true, force: true })
await mkdir(STATS_DIR, { recursive: true })
await mkdir(DETAIL_DIR, { recursive: true })

const stats = new Map()      // cc -> Map<key, row>
const tiles = new Map()      // "a_b" -> rows
const overview = new Map()   // "cc|a|b" -> {cc,a,b,n,pts,powers}
const countryTotals = new Map()

let lineNumber = 0
let header = null
let skipped = 0

const csv = gunzipSync(await readFile(join(dataRoot, "stations.csv.gz"))).toString("utf8")
for (const values of parseCsv(csv)) {
  if (!header) {
    header = values.map(value => value.replace(/^\uFEFF/, ""))
    continue
  }
  lineNumber++
  if (values.length !== header.length) { skipped++; continue }
  const row = Object.fromEntries(header.map((key, i) => [key, values[i]]))

  const cc = row.country
  const lat = Number(row.lat)
  const lon = Number(row.lon)
  if (!cc || !Number.isFinite(lat) || !Number.isFinite(lon)) { skipped++; continue }

  const n = Number(row.num_points) || 1
  const power = row.power_kw === "" ? -1 : Number(row.power_kw)
  const known = power >= 0
  const c = row.power_class === "" ? -1 : Number(row.power_class)
  const t = TYPE_INDEX.get(row.charge_type) ?? 2
  const s = STATUS_INDEX.get(row.status) ?? 4
  const pb = row.public === "public" ? 1 : row.public === "restricted" ? 0 : 2
  const o = row.operator ? (opIndex.get(row.operator) ?? -1) : -1
  const cn = row.connectors ? row.connectors.split(";").map(x => x.trim()).filter(Boolean) : []
  const yr = row.commissioned_year ? Number(row.commissioned_year) : 0
  const ct = row.city || ""
  const nm = row.name || ""

  // Stats only needs dimensions that filters and charts actually read.
  const latIdx = Math.floor(lat / STAT_RES)
  const lonIdx = Math.floor(lon / STAT_RES)
  let byCC = stats.get(cc)
  if (!byCC) { byCC = new Map(); stats.set(cc, byCC) }
  const statKey = `${latIdx},${lonIdx},${ct},${o},${c},${t},${s},${pb},${cn.join("|")},${yr}`
  let stat = byCC.get(statKey)
  if (!stat) {
    stat = [latIdx, lonIdx, ct, o, c, t, s, pb, cn, yr, 0, 0, 0, 0]
    byCC.set(statKey, stat)
  }
  stat[10] += 1
  stat[11] += n
  if (known) { stat[12] += power * n; stat[13] += n }

  // Detail rows keep individual coordinates and display fields.
  const tileKey = `${Math.floor(lat / DETAIL_RES)}_${Math.floor(lon / DETAIL_RES)}`
  let tile = tiles.get(tileKey)
  if (!tile) { tile = []; tiles.set(tileKey, tile) }
  tile.push([
    cc, Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5,
    o, power, c, t, n, s, nm, ct, cn, yr, pb
  ])

  // Overview cells only need counts; stats takes over as countries arrive.
  const oa = Math.floor(lat / OVERVIEW_RES)
  const ob = Math.floor(lon / OVERVIEW_RES)
  const okey = `${cc}|${oa}|${ob}`
  let cell = overview.get(okey)
  if (!cell) { cell = { cc, a: oa, b: ob, n: 0, pts: 0, pw: [0, 0, 0, 0, 0] }; overview.set(okey, cell) }
  cell.n += 1
  cell.pts += n
  cell.pw[c < 0 ? 4 : c] += 1

  const totals = countryTotals.get(cc) || { stations: 0, points: 0 }
  totals.stations++
  totals.points += n
  countryTotals.set(cc, totals)
}

if (skipped) console.warn(`skipped ${skipped} rows (header lines: ${lineNumber})`)

for (const [cc, rows] of [...stats.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const list = [...rows.values()]
  await writeFile(join(STATS_DIR, `${cc}.json`), JSON.stringify({ resolution: STAT_RES, rows: list }))
  const totals = countryTotals.get(cc)
  console.log(`${cc}: ${list.length} aggregate rows / ${totals?.stations ?? 0} stations`)
}

for (const [key, rows] of tiles) {
  await writeFile(join(DETAIL_DIR, `${key}.json`), JSON.stringify({ rows }))
}

await writeFile(join(DETAIL_DIR, "index.json"), JSON.stringify({ resolution: DETAIL_RES, tiles: [...tiles.keys()].sort() }))

const features = []
for (const cell of overview.values()) {
  let dominant = 4
  let best = -1
  cell.pw.forEach((value, index) => { if (value > best) { best = value; dominant = index } })
  features.push({
    type: "Feature",
    geometry: { type: "Point", coordinates: [(cell.b + 0.5) * OVERVIEW_RES, (cell.a + 0.5) * OVERVIEW_RES] },
    properties: { cc: cell.cc, n: cell.n, pts: cell.pts, c: dominant }
  })
}
await writeFile(join(dataRoot, "overview.geojson"), JSON.stringify({ type: "FeatureCollection", features }))

console.log(`overview: ${features.length} cells; detail: ${tiles.size} tiles`)
