export type Palette = {
  dark: boolean
  text: string
  muted: string
  faint: string
  grid: string
  lane: string
  laneFocus: string
  surface: string
  shallow: string
  mid: string
  deep: string
  accent: string
  selection: string
  tooltipBg: string
  tooltipBorder: string
}

export function paletteFor(dark: boolean): Palette {
  return dark
    ? {
        dark: true,
        text: "#e4e4e7",
        muted: "#a1a1aa",
        faint: "#52525b",
        grid: "rgba(228, 228, 231, 0.10)",
        lane: "rgba(228, 228, 231, 0.07)",
        laneFocus: "rgba(228, 228, 231, 0.12)",
        surface: "#0b0b0d",
        shallow: "#fbbf24",
        mid: "#fb7185",
        deep: "#818cf8",
        accent: "#fafafa",
        selection: "rgba(129, 140, 248, 0.16)",
        tooltipBg: "#18181b",
        tooltipBorder: "#3f3f46",
      }
    : {
        dark: false,
        text: "#27272a",
        muted: "#71717a",
        faint: "#a1a1aa",
        grid: "rgba(39, 39, 42, 0.12)",
        lane: "rgba(39, 39, 42, 0.07)",
        laneFocus: "rgba(39, 39, 42, 0.12)",
        surface: "#fbfaf7",
        shallow: "#d97706",
        mid: "#be123c",
        deep: "#4f46e5",
        accent: "#18181b",
        selection: "rgba(79, 70, 229, 0.12)",
        tooltipBg: "#ffffff",
        tooltipBorder: "#d4d4d8",
      }
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "")
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const clamp = Math.max(0, Math.min(1, t))
  return `rgb(${Math.round(ar + (br - ar) * clamp)}, ${Math.round(ag + (bg - ag) * clamp)}, ${Math.round(ab + (bb - ab) * clamp)})`
}

/** Shallow amber -> mid rose -> deep indigo. Depth is clamped at 180 km. */
export function depthColor(depth: number, palette: Palette): string {
  const value = Number.isFinite(depth) ? Math.max(0, depth) : 10
  if (value <= 15) return palette.shallow
  if (value <= 70) return mix(palette.shallow, palette.mid, (value - 15) / 55)
  return mix(palette.mid, palette.deep, Math.min(1, (value - 70) / 110))
}

export function alphaColor(color: string, alpha: number): string {
  if (color.startsWith("#")) {
    const [r, g, b] = hexToRgb(color)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const match = color.match(/^rgba?\(([^)]+)\)$/)
  if (!match) return color
  const parts = match[1].split(",").map(part => part.trim())
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`
}
