/**
 * Build the pre-aggregated data bundle for the Europe earthquake Pulse Wall.
 *
 * Input:  .content-build/europe-earthquakes/raw/{year}.json.gz (EMSC, see fetch script)
 * Output: public/interactive/europe-earthquakes/data/{meta,daily,depth,top}.json
 *
 * The browser never downloads the ~100k raw events. It gets a day x province
 * matrix, a province x depth histogram, and a small list of notable events.
 *
 * Usage: node scripts/build-earthquake-data.mjs
 */
import { mkdir, readFile, rm, writeFile, copyFile } from "node:fs/promises"
import { gunzipSync } from "node:zlib"
import { fileURLToPath } from "node:url"
import { join } from "node:path"

const ROOT = fileURLToPath(new URL("../", import.meta.url))
const RAW_DIR = join(ROOT, ".content-build/europe-earthquakes/raw")
const OUT_DIR = join(ROOT, "public/interactive/europe-earthquakes/data")

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]
const START = `${YEARS[0]}-01-01T00:00:00Z`
const END = `${YEARS.at(-1) + 1}-01-01T00:00:00Z`
const MIN_MAG = 2.5
const DEPTH_BIN_KM = 5
const DEPTH_MAX_KM = 300
const DEPTH_OVERFLOW_LABEL = "300+"

const GRID_CELL_DEG = 0.25
const GRID = {
  latMin: 34,
  latMax: 72,
  lonMin: -26,
  lonMax: 45,
}
const GRID_ROWS = Math.round((GRID.latMax - GRID.latMin) / GRID_CELL_DEG)
const GRID_COLS = Math.round((GRID.lonMax - GRID.lonMin) / GRID_CELL_DEG)
const BOUNDARY_SOURCE = fileURLToPath(
  new URL("../public/interactive/ev-charging-europe/data/europe_boundary.geojson", import.meta.url),
)
const BOUNDARY_TARGET = join(OUT_DIR, "europe_boundary.geojson")

const PROVINCES = [
  { id: "iceland", name: "Iceland & Jan Mayen", short: "Iceland", lat: 64.9, lon: -18.5 },
  { id: "atlantic", name: "Azores & Mid-Atlantic", short: "Azores", lat: 37.7, lon: -25.5 },
  { id: "iberia", name: "Iberia & Maghreb", short: "Iberia", lat: 39.5, lon: -3.5 },
  { id: "france", name: "France & Pyrenees", short: "France", lat: 46.0, lon: 2.0 },
  { id: "alps", name: "Alps & Northern Italy", short: "Alps", lat: 46.5, lon: 9.0 },
  { id: "italy", name: "Central & Southern Italy", short: "Italy", lat: 42.0, lon: 13.5 },
  { id: "balkans", name: "Adriatic & Balkans", short: "Balkans", lat: 43.0, lon: 18.0 },
  { id: "greece", name: "Greece & Aegean", short: "Greece", lat: 39.0, lon: 22.5 },
  { id: "west-turkey", name: "Western Turkey & Aegean coast", short: "W. Turkey", lat: 39.0, lon: 28.0 },
  { id: "anatolia", name: "Anatolia & Caucasus", short: "Anatolia", lat: 39.0, lon: 37.0 },
  { id: "romania", name: "Romania & Carpathians", short: "Romania", lat: 45.6, lon: 26.5 },
  { id: "cyprus", name: "Cyprus & Levant", short: "Cyprus", lat: 35.0, lon: 33.0 },
  { id: "north-europe", name: "Northern & Central Europe", short: "N. Europe", lat: 52.0, lon: 15.0 },
]

const PROVINCE_INDEX = new Map(PROVINCES.map((province, index) => [province.id, index]))

/**
 * The EMSC `flynn_region` field has 128 spellings. Ordered rules collapse them
 * into the 13 provinces above; anything unmatched falls back to the nearest
 * province centroid so no event silently disappears.
 */
const RULES = [
  [/ICELAND|JAN MAYEN|NORWEGIAN SEA/, "iceland"],
  [/AZORES|NORTH ATLANTIC|MADEIRA/, "atlantic"],
  [/DODECANESE IS\.-TURKEY BORDER/, "west-turkey"],
  [/AEGEAN SEA GREECE-TURKEY/, "greece"],
  [/GREECE|CRETE|DODECANESE|AEGEAN SEA|IONIAN|KERKIRA/, "greece"],
  [/WESTERN TURKEY|NEAR THE COAST OF WESTERN TURKEY/, "west-turkey"],
  [/TURKEY-SYRIA-IRAQ|TURKEY-IRAN-IRAQ|TURKEY-SYRIA|TURKEY-IRAN|TURKEY-IRAQ|CENTRAL TURKEY|EASTERN TURKEY|NORTHWESTERN IRAN|IRAN-IRAQ/, "anatolia"],
  [/GEORGIA|ARMENIA|CAUCASUS|BLACK SEA, OFFSHORE/, "anatolia"],
  [/CYPRUS|SYRIA|LEBANON|IRAQ|EASTERN MEDITERRANEAN|WESTERN MEDITERRANEAN|CENTRAL MEDITERRANEAN/, "cyprus"],
  [/ROMANIA|MOLDOVA/, "romania"],
  [/SPAIN|PORTUGAL|GIBRALTAR|MOROCCO|ALGERIA|TUNISIA|BALEARIC/, "iberia"],
  [/FRANCE|PYRENEES|CORSICA|BAY OF BISCAY|ENGLISH CHANNEL|CHANNEL ISL/, "france"],
  [/NORTHERN ITALY|SWITZERLAND|AUSTRIA|LIECHTENSTEIN|SLOVENIA|LIGURIAN/, "alps"],
  [/CENTRAL ITALY|SOUTHERN ITALY|SICILY|TYRRHENIAN|SARDINIA|MALTA|SAN MARINO/, "italy"],
  [/CROATIA|BOSNIA|MONTENEGRO|SERBIA|ALBANIA|KOSOVO|MACEDONIA|BULGARIA|ADRIATIC|OTOK/, "balkans"],
  [/POLAND|CZECH|GERMANY|NETHERLANDS|BELGIUM|LUXEMBOURG|UNITED KINGDOM|ENGLAND|SCOTLAND|WALES|IRELAND|SWEDEN|NORWAY|FINLAND|DENMARK|BALTIC|ESTONIA|BELARUS|UKRAINE|RUSSIA|HUNGARY|SLOVAKIA|CRIMEA|BLACK SEA|NORTH SEA/, "north-europe"],
]

function provinceFor(region, lat, lon) {
  for (const [pattern, id] of RULES) {
    if (pattern.test(region)) return PROVINCE_INDEX.get(id)
  }
  let best = 0
  let bestDistance = Infinity
  for (let index = 0; index < PROVINCES.length; index++) {
    const province = PROVINCES[index]
    const dLat = lat - province.lat
    const dLon = (lon - province.lon) * Math.cos((lat * Math.PI) / 180)
    const distance = dLat * dLat + dLon * dLon
    if (distance < bestDistance) {
      bestDistance = distance
      best = index
    }
  }
  return best
}

const DAY_MS = 86_400_000
const startMs = Date.parse(START)
const endMs = Date.parse(END)
const dayCount = Math.round((endMs - startMs) / DAY_MS)
const depthBinCount = Math.floor(DEPTH_MAX_KM / DEPTH_BIN_KM) + 1

const daily = Array.from({ length: dayCount }, () => null)
const dailyCells = Array.from({ length: dayCount }, () => new Map())
const depthCounts = PROVINCES.map(() => new Array(depthBinCount).fill(0))
const depthEnergy = PROVINCES.map(() => new Array(depthBinCount).fill(0))
const provinceStats = PROVINCES.map(() => ({
  count: 0,
  energy: 0,
  maxMag: 0,
  deepest: 0,
  first: null,
  last: null,
}))
const yearStats = new Map(YEARS.map(year => [year, { count: 0, energy: 0, maxMag: 0 }]))
const typeCounts = new Map()
const magTypeCounts = new Map()
const all = []
let fallbackCount = 0
let rejected = 0

const gridAcc = new Array(GRID_ROWS * GRID_COLS).fill(0).map(() => ({
  count: 0,
  energy: 0,
  maxMag: 0,
  maxDepth: 0,
  byProvince: new Array(PROVINCES.length).fill(0),
  // Per-calendar-year counts / energies for the heat-map playback.
  byYearCount: new Array(YEARS.length).fill(0),
  byYearEnergy: new Array(YEARS.length).fill(0),
}))

const energyOf = mag => 10 ** (4.8 + 1.5 * mag)

for (const year of YEARS) {
  const yearIndex = YEARS.indexOf(year)
  const path = join(RAW_DIR, `${year}.json.gz`)
  const json = JSON.parse(gunzipSync(await readFile(path)).toString("utf8"))
  for (const feature of json.features) {
    const p = feature.properties
    const time = Date.parse(p.time)
    const lat = Number(p.lat)
    const lon = Number(p.lon)
    const depth = Number(p.depth)
    const mag = Number(p.mag)
    if (!Number.isFinite(time) || time < startMs || time >= endMs) { rejected++; continue }
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(mag) || mag < MIN_MAG) { rejected++; continue }

    const region = String(p.flynn_region ?? "").trim() || "UNKNOWN"
    let province = provinceFor(region, lat, lon)
    if (!RULES.some(([pattern]) => pattern.test(region))) fallbackCount++

    const day = Math.floor((time - startMs) / DAY_MS)
    const energy = energyOf(mag)
    const safeDepth = Number.isFinite(depth) ? depth : 10
    const bin = Math.max(0, Math.min(depthBinCount - 1, Math.floor(safeDepth / DEPTH_BIN_KM)))

    typeCounts.set(p.evtype ?? "none", (typeCounts.get(p.evtype ?? "none") ?? 0) + 1)
    magTypeCounts.set(p.magtype ?? "none", (magTypeCounts.get(p.magtype ?? "none") ?? 0) + 1)
    yearStats.get(year).count++
    yearStats.get(year).energy += energy
    yearStats.get(year).maxMag = Math.max(yearStats.get(year).maxMag, mag)

    const provinceStat = provinceStats[province]
    provinceStat.count++
    provinceStat.energy += energy
    provinceStat.maxMag = Math.max(provinceStat.maxMag, mag)
    provinceStat.deepest = Math.max(provinceStat.deepest, safeDepth)
    if (!provinceStat.first || time < provinceStat.first) provinceStat.first = time
    if (!provinceStat.last || time > provinceStat.last) provinceStat.last = time

    depthCounts[province][bin]++
    depthEnergy[province][bin] += energy

    const col = Math.floor((lon - GRID.lonMin) / GRID_CELL_DEG)
    const row = Math.floor((lat - GRID.latMin) / GRID_CELL_DEG)
    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      const cellIndex = row * GRID_COLS + col
      const cell = gridAcc[cellIndex]
      cell.count++
      cell.energy += energy
      cell.maxMag = Math.max(cell.maxMag, mag)
      cell.maxDepth = Math.max(cell.maxDepth, safeDepth)
      cell.byProvince[province]++
      cell.byYearCount[yearIndex]++
      cell.byYearEnergy[yearIndex] += energy
    }

    const cellKey = province
    let cell = dailyCells[day].get(cellKey)
    if (!cell) {
      cell = { count: 0, maxMag: 0, energy: 0, depthSum: 0, maxDepth: 0 }
      dailyCells[day].set(cellKey, cell)
    }
    cell.count++
    cell.energy += energy
    cell.depthSum += safeDepth
    cell.maxMag = Math.max(cell.maxMag, mag)
    cell.maxDepth = Math.max(cell.maxDepth, safeDepth)

    all.push({
      t: p.time,
      lat,
      lon,
      depth: safeDepth,
      mag,
      magtype: p.magtype ?? "",
      region,
      province,
      evtype: p.evtype ?? "",
      auth: p.auth ?? "",
      unid: p.unid ?? feature.id,
    })
  }
}

for (let day = 0; day < dayCount; day++) {
  const cells = dailyCells[day]
  if (!cells.size) continue
  daily[day] = [...cells.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([province, cell]) => [
      province,
      cell.count,
      Math.round(cell.maxMag * 100) / 100,
      Math.round(Math.log10(cell.energy) * 100) / 100,
      Math.round((cell.depthSum / cell.count) * 10) / 10,
      Math.round(cell.maxDepth),
    ])
}

const sortedByMag = [...all].sort((a, b) => b.mag - a.mag || a.t.localeCompare(b.t))
const top = sortedByMag.slice(0, 80).map(event => ({
  t: event.t,
  lat: event.lat,
  lon: event.lon,
  depth: event.depth,
  mag: event.mag,
  magtype: event.magtype,
  region: event.region,
  province: PROVINCES[event.province].id,
  auth: event.auth,
}))
const deepest = [...all].sort((a, b) => b.depth - a.depth).slice(0, 20).map(event => ({
  t: event.t,
  depth: event.depth,
  mag: event.mag,
  region: event.region,
  province: PROVINCES[event.province].id,
}))

const gridMaxCount = Math.max(...gridAcc.map(cell => cell.count))
const gridMaxEnergy = Math.max(...gridAcc.map(cell => cell.energy))
// Per-year maxima, used so playback normalises each year to its own busiest
// cell. That keeps every year's active belt visible while the brightest kernel
// (e.g. Anatolia in 2023, Samos in 2020, Jan Mayen in 2018) walks across the
// map from year to year instead of everything sitting near saturation.
const yearMaxCount = YEARS.map((_, k) => Math.max(...gridAcc.map(cell => cell.byYearCount[k])))
const yearMaxEnergy = YEARS.map((_, k) => Math.max(...gridAcc.map(cell => cell.byYearEnergy[k])))
const grid = { rows: GRID_ROWS, cols: GRID_COLS, ...GRID, cells: [] }
for (let row = 0; row < GRID_ROWS; row++) {
  for (let col = 0; col < GRID_COLS; col++) {
    const cell = gridAcc[row * GRID_COLS + col]
    if (!cell.count) continue
    let dominant = 0
    for (let p = 1; p < cell.byProvince.length; p++) {
      if (cell.byProvince[p] > cell.byProvince[dominant]) dominant = p
    }
    grid.cells.push([row, col, cell.count, Math.round(Math.log10(cell.energy) * 100) / 100, dominant])
  }
}

const densityFeatures = []
for (const [row, col, count, logEnergy, dominant] of grid.cells) {
  const cell = gridAcc[row * GRID_COLS + col]
  const lon0 = GRID.lonMin + col * GRID_CELL_DEG
  const lat0 = GRID.latMin + row * GRID_CELL_DEG
  const lon1 = lon0 + GRID_CELL_DEG
  const lat1 = lat0 + GRID_CELL_DEG
  densityFeatures.push({
    type: "Feature",
    properties: {
      count,
      logEnergy,
      energy: Math.round(10 ** logEnergy),
      province: PROVINCES[dominant].id,
      provIdx: dominant,
      fCount: Math.round((count / gridMaxCount) * 1000) / 1000,
      fEnergy: Math.round((Math.log10(cell.energy) / Math.log10(gridMaxEnergy)) * 1000) / 1000,
    },
    geometry: {
      type: "Polygon",
      coordinates: [[[lon0, lat1], [lon1, lat1], [lon1, lat0], [lon0, lat0], [lon0, lat1]]],
    },
  })
}
const densityGeoJSON = { type: "FeatureCollection", features: densityFeatures }

// A point source for MapLibre `heatmap` layers (a kernel-smoothed surface).
// One point per populated grid cell, placed at its centroid; heatmap-weight
// reads fCount / fEnergy so hotspots blur into a smooth, cartographic glow
// rather than blocky polygons.
//
// Playback arrays (normalised to the decade maximum so years are comparable):
//   wy[k]  count weight of calendar year k
//   we[k]  energy weight of calendar year k
//   wyc[k] cumulative count weight through year k
//   wec[k] cumulative energy weight through year k
const r3 = value => Math.round(value * 1000) / 1000
const clamp01 = value => Math.max(0, Math.min(1, value))
const heatPointFeatures = []
for (const [row, col, count, logEnergy, dominant] of grid.cells) {
  const cell = gridAcc[row * GRID_COLS + col]
  const lon = GRID.lonMin + (col + 0.5) * GRID_CELL_DEG
  const lat = GRID.latMin + (row + 0.5) * GRID_CELL_DEG

  const wy = {}
  const we = {}
  const wyc = {}
  const wec = {}
  let cumCount = 0
  let cumEnergy = 0
  for (let k = 0; k < YEARS.length; k++) {
    cumCount += cell.byYearCount[k]
    cumEnergy += cell.byYearEnergy[k]
    wy[`${k}`] = r3(clamp01(cell.byYearCount[k] / yearMaxCount[k]))
    we[`${k}`] = r3(clamp01(cell.byYearEnergy[k] / yearMaxEnergy[k]))
    wyc[`${k}`] = r3(clamp01(cumCount / gridMaxCount))
    wec[`${k}`] = r3(clamp01(Math.log10(Math.max(cumEnergy, 1)) / Math.log10(gridMaxEnergy)))
  }

  heatPointFeatures.push({
    type: "Feature",
    properties: {
      count,
      logEnergy,
      energy: Math.round(10 ** logEnergy),
      province: PROVINCES[dominant].id,
      provIdx: dominant,
      fCount: Math.round((cell.count / gridMaxCount) * 1000) / 1000,
      fEnergy: Math.round((Math.log10(cell.energy) / Math.log10(gridMaxEnergy)) * 1000) / 1000,
      ...Object.fromEntries(YEARS.map((_, k) => [`wy${k}`, wy[`${k}`]])),
      ...Object.fromEntries(YEARS.map((_, k) => [`we${k}`, we[`${k}`]])),
      ...Object.fromEntries(YEARS.map((_, k) => [`wyc${k}`, wyc[`${k}`]])),
      ...Object.fromEntries(YEARS.map((_, k) => [`wec${k}`, wec[`${k}`]])),
    },
    geometry: { type: "Point", coordinates: [lon, lat] },
  })
}
const heatGeoJSON = { type: "FeatureCollection", features: heatPointFeatures }

const totalEnergy = [...yearStats.values()].reduce((sum, year) => sum + year.energy, 0)
const energy2023 = yearStats.get(2023).energy
const energyOthers = totalEnergy - energy2023
const deepestEvent = [...all].reduce((best, event) => (event.depth > best.depth ? event : best), all[0])

const meta = {
  generatedAt: new Date().toISOString(),
  source: {
    name: "EMSC Seismic Portal (Euro-Mediterranean regional catalogue)",
    url: "https://www.seismicportal.eu/fdsnws/event/1/",
    license: "Open access; credit EMSC (European Mediterranean Seismological Centre)",
  },
  scope: {
    start: START,
    end: END,
    minMagnitude: MIN_MAG,
    bounds: { minLat: 34, maxLat: 72, minLon: -25, maxLon: 45 },
    note: "Europe and the Mediterranean, including Turkey and the Caucasus; M>=2.5; 10 complete calendar years.",
  },
  totalEvents: all.length,
  rejected,
  fallbackAssignments: fallbackCount,
  provinces: PROVINCES.map((province, index) => ({
    ...province,
    count: provinceStats[index].count,
    energy: Math.round(provinceStats[index].energy),
    maxMag: provinceStats[index].maxMag,
    deepest: Math.round(provinceStats[index].deepest),
    first: provinceStats[index].first ? new Date(provinceStats[index].first).toISOString() : null,
    last: provinceStats[index].last ? new Date(provinceStats[index].last).toISOString() : null,
  })),
  years: YEARS.map(year => ({
    year,
    count: yearStats.get(year).count,
    energy: Math.round(yearStats.get(year).energy),
    maxMag: yearStats.get(year).maxMag,
  })),
  headline: {
    totalEvents: all.length,
    totalEnergy: Math.round(totalEnergy),
    energy2023: Math.round(energy2023),
    energyOthers: Math.round(energyOthers),
    energyRatio2023: Math.round((energy2023 / energyOthers) * 100) / 100,
    biggest: {
      t: sortedByMag[0].t,
      mag: sortedByMag[0].mag,
      depth: sortedByMag[0].depth,
      region: sortedByMag[0].region,
    },
    deepest: {
      t: deepestEvent.t,
      mag: deepestEvent.mag,
      depth: deepestEvent.depth,
      region: deepestEvent.region,
    },
  },
  eventTypes: Object.fromEntries([...typeCounts].sort((a, b) => b[1] - a[1])),
  magnitudeTypes: Object.fromEntries([...magTypeCounts].sort((a, b) => b[1] - a[1])),
  depth: { binKm: DEPTH_BIN_KM, maxKm: DEPTH_MAX_KM, overflowLabel: DEPTH_OVERFLOW_LABEL },
}

await rm(OUT_DIR, { recursive: true, force: true })
await mkdir(OUT_DIR, { recursive: true })

await writeFile(join(OUT_DIR, "meta.json"), JSON.stringify(meta))
await writeFile(join(OUT_DIR, "daily.json"), JSON.stringify({ start: START, days: dayCount, daily }))
await writeFile(join(OUT_DIR, "depth.json"), JSON.stringify({
  binKm: DEPTH_BIN_KM,
  maxKm: DEPTH_MAX_KM,
  overflowLabel: DEPTH_OVERFLOW_LABEL,
  provinces: PROVINCES.map((province, index) => ({
    id: province.id,
    counts: depthCounts[index],
    energy: depthEnergy[index].map(Math.round),
  })),
}))
await writeFile(join(OUT_DIR, "top.json"), JSON.stringify({ top, deepest }))
await writeFile(join(OUT_DIR, "density.geojson"), JSON.stringify(densityGeoJSON))
await writeFile(join(OUT_DIR, "heatpoints.geojson"), JSON.stringify(heatGeoJSON))
await writeFile(join(OUT_DIR, "grid.json"), JSON.stringify({
  rows: grid.rows,
  cols: grid.cols,
  latMin: grid.latMin,
  latMax: grid.latMax,
  lonMin: grid.lonMin,
  lonMax: grid.lonMax,
  maxCount: gridMaxCount,
  maxLogEnergy: Math.round(Math.log10(gridMaxEnergy) * 100) / 100,
  cells: grid.cells,
}))
await copyFile(BOUNDARY_SOURCE, BOUNDARY_TARGET)

console.log(`Events: ${all.length.toLocaleString("en-US")} (${rejected} rejected)`)
console.log(`Province fallback assignments: ${fallbackCount}`)
console.log(`Days: ${dayCount}; depths: ${depthBinCount} bins x ${DEPTH_BIN_KM} km`)
console.log(`Total energy: ${(totalEnergy / 1e15).toFixed(2)}e15 J; 2023: ${(energy2023 / 1e15).toFixed(2)}e15 J; ratio ${(energy2023 / energyOthers).toFixed(2)}x`)
console.log(`Biggest: M${sortedByMag[0].mag} ${sortedByMag[0].t} ${sortedByMag[0].region}`)
console.log(`Deepest: ${deepestEvent.depth} km M${deepestEvent.mag} ${deepestEvent.t} ${deepestEvent.region}`)
console.log(`Province counts: ${meta.provinces.map(p => `${p.short} ${p.count}`).join(" | ")}`)
console.log(`Grid: ${grid.rows}x${grid.cols} cells (${GRID_CELL_DEG}°), ${grid.cells.length} populated`)
console.log(`Wrote ${OUT_DIR}`)
