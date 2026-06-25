/**
 * SVG path constants for intro animation visual elements.
 * All paths are designed for a viewBox="0 0 84 84" coordinate system
 * unless otherwise noted.
 */

// ── Plum Blossom ──────────────────────────────────────────────

/** Single petal: teardrop shape pointing upward from origin. Designed for viewBox ~ -40 -40 80 80 scale. */
export const PLUM_PETAL_PATH =
  'M0,0 C-6,-12 -8,-24 0,-30 C8,-24 6,-12 0,0 Z'

/** Five petals rotated around center */
export const PLUM_PETAL_ROTATIONS = [0, 72, 144, 216, 288] as const

// ── Seal Stamp ────────────────────────────────────────────────

/** Outer border: slightly irregular rectangle for stone-carved organic feel */
export const SEAL_OUTER_PATH =
  'M10,4 L72,4 Q78,4 80,10 L80,74 Q80,80 74,80 L10,80 Q4,80 4,74 L4,10 Q4,4 10,4 Z'

/** Inner border: tighter rectangle */
export const SEAL_INNER_PATH =
  'M20,16 L64,16 Q68,16 68,20 L68,64 Q68,68 64,68 L20,68 Q16,68 16,64 L16,20 Q16,16 20,16 Z'

/** Character-like strokes for seal interior — 3 rows of varied horizontal lines */
export const SEAL_TEXT_STROKES: readonly string[] = [
  'M26,35 L58,35', // top row
  'M28,42 L44,42', // middle left
  'M48,42 L56,42', // middle right
  'M36,50 L48,50', // bottom center
]

/** Optional vertical strokes for more seal-script feel */
export const SEAL_VERTICAL_STROKES: readonly string[] = [
  'M42,30 L42,54', // center vertical
  'M34,38 L34,46', // left short vertical
]

// ── Plum blossom layout ───────────────────────────────────────

export interface BlossomDef {
  id: number
  /** translateX as percentage of SVG viewport width */
  tx: number
  /** translateY as percentage of SVG viewport height */
  ty: number
  scale: number
  rotate: number
  /** animation-delay in ms */
  delay: number
  /** hide on mobile (viewport < 640px) */
  hideOnMobile: boolean
}

/** 7 blossoms arranged loosely near the right side of the intro overlay */
export const BLOSSOM_LAYOUT: readonly BlossomDef[] = [
  { id: 1, tx: 72, ty: 18, scale: 0.9, rotate: -15, delay: 0, hideOnMobile: false },
  { id: 2, tx: 82, ty: 34, scale: 1.1, rotate: 8, delay: 140, hideOnMobile: false },
  { id: 3, tx: 65, ty: 52, scale: 0.8, rotate: -6, delay: 280, hideOnMobile: false },
  { id: 4, tx: 88, ty: 56, scale: 1.0, rotate: 22, delay: 420, hideOnMobile: true },
  { id: 5, tx: 76, ty: 72, scale: 0.7, rotate: -20, delay: 560, hideOnMobile: true },
  { id: 6, tx: 92, ty: 12, scale: 0.85, rotate: 10, delay: 640, hideOnMobile: true },
  { id: 7, tx: 58, ty: 38, scale: 0.75, rotate: -12, delay: 720, hideOnMobile: true },
]
