export interface Province {
  id: string
  name: string
  short: string
  lat: number
  lon: number
  count: number
  energy: number
  maxMag: number
  deepest: number
  first: string | null
  last: string | null
}

export interface YearStat {
  year: number
  count: number
  energy: number
  maxMag: number
}

export interface Headline {
  totalEvents: number
  totalEnergy: number
  energy2023: number
  energyOthers: number
  energyRatio2023: number
  biggest: { t: string; mag: number; depth: number; region: string }
  deepest: { t: string; mag: number; depth: number; region: string }
}

export interface Meta {
  generatedAt: string
  source: { name: string; url: string; license: string }
  scope: {
    start: string
    end: string
    minMagnitude: number
    bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }
    note: string
  }
  totalEvents: number
  rejected: number
  fallbackAssignments: number
  provinces: Province[]
  years: YearStat[]
  headline: Headline
  eventTypes: Record<string, number>
  magnitudeTypes: Record<string, number>
  depth: { binKm: number; maxKm: number; overflowLabel: string }
}

/** [provinceIndex, count, maxMagnitude, log10Energy, meanDepthKm, maxDepthKm] */
export type DailyCell = [number, number, number, number, number, number]

export interface Daily {
  start: string
  days: number
  daily: (DailyCell[] | null)[]
}

export interface DepthData {
  binKm: number
  maxKm: number
  overflowLabel: string
  provinces: { id: string; counts: number[]; energy: number[] }[]
}

export interface TopEvent {
  t: string
  lat: number
  lon: number
  depth: number
  mag: number
  magtype: string
  region: string
  province: string
  auth: string
}

export interface TopData {
  top: TopEvent[]
  deepest: { t: string; depth: number; mag: number; region: string; province: string }[]
}

/** Sparse energy-density grid produced from ~99k events. Cell: [row, col, count, log10Energy, dominantProvinceIndex] */
export interface Grid {
  rows: number
  cols: number
  latMin: number
  latMax: number
  lonMin: number
  lonMax: number
  maxCount: number
  maxLogEnergy: number
  cells: [number, number, number, number, number][]
}

export type BoundaryPolygon = { type?: string; coordinates: unknown }
export type BoundaryFeature = { properties: Record<string, unknown>; geometry: BoundaryPolygon | null }
export type Boundary = { type: string; features: BoundaryFeature[] }

export interface Bundle {
  meta: Meta
  daily: Daily
  depth: DepthData
  top: TopData
  grid: Grid
  boundary: Boundary
}
