import type { Bundle } from "./types"

const cache = new Map<string, Promise<Bundle>>()

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`)
  return response.json() as Promise<T>
}

export function loadEarthquakeBundle(basePath: string): Promise<Bundle> {
  const root = `${basePath}/interactive/europe-earthquakes/data`
  const cached = cache.get(root)
  if (cached) return cached

  const promise = Promise.all([
    fetchJson<Bundle["meta"]>(`${root}/meta.json`),
    fetchJson<Bundle["daily"]>(`${root}/daily.json`),
    fetchJson<Bundle["depth"]>(`${root}/depth.json`),
    fetchJson<Bundle["top"]>(`${root}/top.json`),
    fetchJson<Bundle["grid"]>(`${root}/grid.json`),
    fetchJson<Bundle["boundary"]>(`${root}/europe_boundary.geojson`),
  ]).then(([meta, daily, depth, top, grid, boundary]) => ({ meta, daily, depth, top, grid, boundary }))

  cache.set(root, promise)
  return promise
}
