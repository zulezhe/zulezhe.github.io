/**
 * Build the data bundle for the Hong Kong public EV charging explorer.
 *
 * Source: EPD "Electric Vehicle Chargers for Public Access" (CSDI geoportal,
 * quarterly refresh): https://portal.csdi.gov.hk/geoportal/?datasetId=epd_rcd_1631080339740_69941
 *
 * The published site needs only two files:
 *   data/stations.geojson   one point per charging location (990 at snapshot)
 *   data/meta.json          district table, totals and source attribution
 *
 * The raw CSDI download is cached under .content-build/ (gitignored) so the
 * build is reproducible without re-downloading.
 *
 * Usage: node scripts/build-hk-ev-data.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { join } from "node:path"

const RAW_PATH = fileURLToPath(new URL("../.content-build/hk-ev-charging/raw/chargers.geojson", import.meta.url))
const OUT_ROOT = fileURLToPath(new URL("../public/interactive/hk-ev-charging/data/", import.meta.url))

const SOURCE_URL =
  "https://portal.csdi.gov.hk/csdi-webpage/file-api?dataset_id=epd_rcd_1631080339740_69941&format=geojson&layer_name=geotagging"
const SOURCE_PAGE = "https://data.gov.hk/tc-data/dataset/hk-epd-evcpateam-evc-1"

const STD_FIELDS = ["STANDARD_BS1363_no"]
const MED_FIELDS = [
  "MEDIUM_CCS_DC_COMBO_no",
  "MEDIUM_IEC62196_no",
  "MEDIUM_SAEJ1772_no",
  "MEDIUM_GB_T20234_2_AC__no",
  "MEDIUM_OTHERS_no",
]
const DC_FIELDS = [
  "QUICK_CHAdeMO_no",
  "QUICK_CCS_DC_COMBO_no",
  "QUICK_IEC62196_no",
  "QUICK_GB_T20234_3_DC__no",
  "QUICK_OTHERS_no",
  "FAST_CHAdeMO_no",
  "FAST_CCS_DC_COMBO_no",
  "FAST_GB_T20234_3_DC__no",
  "FAST_OTHERS_no",
]

const num = (properties, key) => {
  const value = Number.parseInt(properties[key], 10)
  return Number.isFinite(value) && value > 0 ? value : 0
}

async function loadRaw() {
  try {
    return JSON.parse(await readFile(RAW_PATH, "utf8"))
  } catch {
    console.log("Downloading CSDI snapshot ...")
    const response = await fetch(SOURCE_URL)
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${SOURCE_URL}`)
    const text = await response.text()
    await mkdir(RAW_PATH.substring(0, RAW_PATH.lastIndexOf("/")), { recursive: true })
    await writeFile(RAW_PATH, text)
    return JSON.parse(text)
  }
}

const raw = await loadRaw()
const features = raw.features
if (!Array.isArray(features) || features.length === 0) throw new Error("CSDI snapshot has no features")

// District table in first-appearance order; `di` indexes into it.
const districts = []
const indexByTc = new Map()
const stations = []
for (const feature of features) {
  const properties = feature.properties
  const [lon, lat] = feature.geometry?.coordinates ?? []
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
  // Keep only plausible Hong Kong coordinates; the portal occasionally echoes stray points.
  if (lon < 113.8 || lon > 114.5 || lat < 22.1 || lat > 22.65) continue

  const std = STD_FIELDS.reduce((sum, key) => sum + num(properties, key), 0)
  const med = MED_FIELDS.reduce((sum, key) => sum + num(properties, key), 0)
  const dc = DC_FIELDS.reduce((sum, key) => sum + num(properties, key), 0)
  if (std + med + dc === 0) continue

  const tc = properties.NAME_OF_DISTRICT_COUNCIL_DISTRICT_TC
  if (!indexByTc.has(tc)) {
    indexByTc.set(tc, districts.length)
    districts.push({ en: properties.NAME_OF_DISTRICT_COUNCIL_DISTRICT_EN, tc, locations: 0, chargers: 0, std: 0, med: 0, dc: 0 })
  }
  const district = districts[indexByTc.get(tc)]

  district.locations += 1
  district.chargers += std + med + dc
  district.std += std
  district.med += med
  district.dc += dc

  stations.push({
    type: "Feature",
    geometry: { type: "Point", coordinates: [Number(lon.toFixed(6)), Number(lat.toFixed(6))] },
    properties: {
      di: indexByTc.get(tc),
      n: properties.LOCATION_TC,
      ne: properties.LOCATION_EN,
      a: properties.ADDRESS_TC,
      ae: properties.ADDRESS_EN,
      s: std,
      m: med,
      dc,
    },
  })
}

if (stations.length === 0) throw new Error("No usable stations after filtering")

const total = key => districts.reduce((sum, district) => sum + district[key], 0)
const meta = {
  generatedAt: new Date().toISOString(),
  source: {
    label: "環境保護署《供公眾使用的電動車充電器》(資料一線通 / CSDI)",
    labelEn: "EPD Electric Vehicle Chargers for Public Access (DATA.GOV.HK / CSDI)",
    url: SOURCE_PAGE,
    api: SOURCE_URL,
  },
  districts: districts.map(({ en, tc }) => ({ en, tc })),
  totals: {
    locations: stations.length,
    chargers: total("chargers"),
    std: total("std"),
    med: total("med"),
    dc: total("dc"),
    dcLocations: stations.filter(station => station.properties.dc > 0).length,
  },
  perDistrict: [...districts]
    .sort((a, b) => b.chargers - a.chargers)
    .map(({ en, tc, locations, chargers, std, med, dc }) => ({ en, tc, locations, chargers, std, med, dc })),
}

await mkdir(OUT_ROOT, { recursive: true })
await writeFile(join(OUT_ROOT, "stations.geojson"), JSON.stringify({ type: "FeatureCollection", features: stations }))
await writeFile(join(OUT_ROOT, "meta.json"), JSON.stringify(meta, null, 2))

const t = meta.totals
console.log(
  `HK EV bundle built: ${t.locations} locations, ${t.chargers} chargers ` +
    `(std ${t.std}, med ${t.med}, DC ${t.dc}); ${t.dcLocations} locations have DC. ` +
    `${districts.length} districts.`,
)
