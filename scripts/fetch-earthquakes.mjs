/**
 * Fetch the EMSC Euro-Mediterranean earthquake catalogue for the Pulse Wall post.
 *
 * Data source: https://www.seismicportal.eu/fdsnws/event/1/
 * Scope: 2016-01-01 .. 2026-01-01, M>=2.5, 34..72N / -25..45E.
 *
 * Raw gzip JSON is cached under .content-build/ (gitignored) so the build is
 * reproducible without re-downloading. Existing valid files are skipped.
 *
 * Usage: node scripts/fetch-earthquakes.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { gunzipSync } from "node:zlib"
import { fileURLToPath } from "node:url"
import { join } from "node:path"

const OUT_DIR = fileURLToPath(new URL("../.content-build/europe-earthquakes/raw/", import.meta.url))

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]
const BOUNDS = { minlatitude: 34, maxlatitude: 72, minlongitude: -25, maxlongitude: 45 }
const MIN_MAGNITUDE = 2.5
const CONCURRENCY = 3
const MAX_ATTEMPTS = 4

await mkdir(OUT_DIR, { recursive: true })

function urlFor(year) {
  const params = new URLSearchParams({
    format: "json-gz",
    starttime: `${year}-01-01`,
    endtime: `${year + 1}-01-01`,
    minmagnitude: String(MIN_MAGNITUDE),
    ...Object.fromEntries(Object.entries(BOUNDS).map(([key, value]) => [key, String(value)])),
  })
  return `https://www.seismicportal.eu/fdsnws/event/1/query?${params}`
}

async function isValid(path, year) {
  try {
    const buffer = await readFile(path)
    const json = JSON.parse(gunzipSync(buffer).toString("utf8"))
    const count = json.features?.length ?? 0
    if (!count) return false
    if (json.metadata?.count !== undefined && json.metadata.count !== count) return false
    const first = json.features[0].properties.time
    const last = json.features.at(-1).properties.time
    console.log(`  ${year}: cached ${count.toLocaleString("en-US")} events (${first.slice(0, 10)} .. ${last.slice(0, 10)})`)
    return true
  } catch {
    return false
  }
}

async function fetchYear(year) {
  const path = join(OUT_DIR, `${year}.json.gz`)
  if (await isValid(path, year)) return

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`  ${year}: download attempt ${attempt}/${MAX_ATTEMPTS}`)
      const response = await fetch(urlFor(year), { signal: AbortSignal.timeout(240_000) })
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
      const buffer = Buffer.from(await response.arrayBuffer())
      const json = JSON.parse(gunzipSync(buffer).toString("utf8"))
      if (!json.features?.length) throw new Error("empty catalogue")
      if (json.metadata?.count !== undefined && json.metadata.count !== json.features.length) {
        throw new Error(`count mismatch: metadata ${json.metadata.count} vs ${json.features.length}`)
      }
      await writeFile(path, buffer)
      console.log(`  ${year}: saved ${json.features.length.toLocaleString("en-US")} events (${(buffer.length / 1024).toFixed(0)} KB gzip)`)
      return
    } catch (error) {
      console.warn(`  ${year}: ${error.message}`)
      if (attempt === MAX_ATTEMPTS) throw error
      await new Promise(resolve => setTimeout(resolve, 2_000 * attempt))
    }
  }
}

console.log(`Fetching EMSC catalogue ${YEARS[0]}–${YEARS.at(-1)}, M>=${MIN_MAGNITUDE}`)
console.log(`Bounds ${BOUNDS.minlatitude}..${BOUNDS.maxlatitude}N, ${BOUNDS.minlongitude}..${BOUNDS.maxlongitude}E`)

const queue = [...YEARS]
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const year = queue.shift()
      await fetchYear(year)
    }
  }),
)

console.log("Done.")
