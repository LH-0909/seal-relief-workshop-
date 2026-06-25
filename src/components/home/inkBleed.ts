// ── Ink Bleed Effect ──────────────────────────────────────────
// Simulates ink spreading on xuan paper using radial gradients
// with noise-displaced centers for organic edge irregularity.

// Simple value noise for organic displacement
let noiseTile: Float32Array | null = null
const NOISE_SIZE = 64

function buildNoiseTile(): Float32Array {
  const size = NOISE_SIZE * NOISE_SIZE
  const tile = new Float32Array(size)
  for (let i = 0; i < size; i++) {
    tile[i] = Math.random()
  }
  return tile
}

function smoothNoise(x: number, y: number): number {
  if (!noiseTile) {
    noiseTile = buildNoiseTile()
  }
  // wrap coords into [0, NOISE_SIZE)
  const ix = ((x % NOISE_SIZE) + NOISE_SIZE) % NOISE_SIZE
  const iy = ((y % NOISE_SIZE) + NOISE_SIZE) % NOISE_SIZE
  const fx = ix - Math.floor(ix)
  const fy = iy - Math.floor(iy)

  const x0 = Math.floor(ix)
  const y0 = Math.floor(iy)
  const x1 = (x0 + 1) % NOISE_SIZE
  const y1 = (y0 + 1) % NOISE_SIZE

  const v00 = noiseTile[y0 * NOISE_SIZE + x0]!
  const v10 = noiseTile[y0 * NOISE_SIZE + x1]!
  const v01 = noiseTile[y1 * NOISE_SIZE + x0]!
  const v11 = noiseTile[y1 * NOISE_SIZE + x1]!

  // smoothstep interpolation
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)

  const top = v00 + (v10 - v00) * sx
  const bot = v01 + (v11 - v01) * sx
  return top + (bot - top) * sy
}

export function drawInkBleed(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  elapsedMs: number,
): void {
  const t = elapsedMs / 1000 // seconds
  const cx = w * 0.38
  const cy = h * 0.52

  // Fade curve: peaks around 0.8s, decays to near-zero by 4s
  const fadeProgress = Math.min(t / 0.8, 1)
  const decayStart = 1.5
  const decayEnd = 4.0
  const decay = t < decayStart ? 1 : Math.max(0, 1 - (t - decayStart) / (decayEnd - decayStart))
  const baseAlpha = fadeProgress * decay * 0.55

  if (baseAlpha < 0.01) return

  // Radius expansion
  const innerRMax = Math.min(w, h) * 0.14
  const outerRMax = Math.min(w, h) * 0.48
  const innerR = innerRMax * Math.min(t / 1.5, 1)
  const outerR = outerRMax * Math.min(t / 3.0, 1)

  // Noise displacement for organic edge
  const noiseX = (smoothNoise(t * 2.3, 0) - 0.5) * 18
  const noiseY = (smoothNoise(0, t * 1.9) - 0.5) * 14

  // Main ink gradient
  const grad = ctx.createRadialGradient(
    cx + noiseX * 0.6, cy + noiseY * 0.6, innerR,
    cx + noiseX, cy + noiseY, outerR,
  )
  grad.addColorStop(0, `rgba(23,21,17,${(baseAlpha * 1.1).toFixed(3)})`)
  grad.addColorStop(0.35, `rgba(23,21,17,${(baseAlpha * 0.7).toFixed(3)})`)
  grad.addColorStop(0.65, `rgba(23,21,17,${(baseAlpha * 0.2).toFixed(3)})`)
  grad.addColorStop(1, 'rgba(23,21,17,0)')

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Secondary blobs at edges for uneven absorption
  if (t > 0.4) {
    const blobAlpha = baseAlpha * 0.35
    const blobCount = 3
    for (let i = 0; i < blobCount; i++) {
      const angle = (i / blobCount) * Math.PI * 2 + t * 0.3
      const dist = outerR * (0.7 + smoothNoise(i * 13, t * 1.1) * 0.35)
      const bx = cx + Math.cos(angle) * dist
      const by = cy + Math.sin(angle) * dist * 0.7
      const br = outerR * (0.12 + smoothNoise(i * 7, t * 1.4) * 0.08)

      const blob = ctx.createRadialGradient(bx, by, 0, bx, by, br)
      blob.addColorStop(0, `rgba(23,21,17,${(blobAlpha * 1.2).toFixed(3)})`)
      blob.addColorStop(1, 'rgba(23,21,17,0)')

      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = blob
      ctx.fillRect(0, 0, w, h)
      ctx.restore()
    }
  }
}

// ── Ink Curtain Sweeps ────────────────────────────────────────
// During each frame transition, a dark ink gradient sweeps from
// right to left across the screen, masking the image cut like an
// unrolling handscroll.

interface CurtainWindow {
  startMs: number
  endMs: number
}

function curtainWindows(durationMs: number): CurtainWindow[] {
  // Frame transition zones as percentages of total duration
  // At 6800ms: F1→F2 at 21-34%, F2→F3 at 38-52%, etc.
  const zones = [
    [0.21, 0.34], // F1→F2
    [0.38, 0.52], // F2→F3
    [0.55, 0.70], // F3→F4
    [0.72, 0.85], // F4→F5
    [0.88, 1.00], // F5→F6
  ] as const
  return zones.map(([s, e]) => ({
    startMs: s * durationMs,
    endMs: e * durationMs,
  }))
}

export function drawInkCurtains(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  elapsedMs: number,
  durationMs: number,
): void {
  const curtains = curtainWindows(durationMs)
  const sweepDuration = 850 // ms for each sweep (longer for 6800ms timeline)

  for (const c of curtains) {
    // Only draw if we're within the curtain window (with padding)
    if (elapsedMs < c.startMs - 100 || elapsedMs > c.endMs + 100) continue

    // Progress through the sweep: 0 = right edge, 1 = left edge
    let progress: number
    if (elapsedMs < c.startMs) {
      progress = 0 // hasn't started yet
    } else if (elapsedMs > c.startMs + sweepDuration) {
      progress = 1 // sweep complete
    } else {
      const raw = (elapsedMs - c.startMs) / sweepDuration
      // Ease-in-out for smooth motion
      progress = raw < 0.5
        ? 2 * raw * raw
        : 1 - Math.pow(-2 * raw + 2, 2) / 2
    }

    // Curtain alpha: fades in quickly, holds, fades out
    let alpha: number
    if (elapsedMs < c.startMs) {
      alpha = 0
    } else if (elapsedMs < c.startMs + 200) {
      alpha = (elapsedMs - c.startMs) / 200 * 0.32
    } else if (elapsedMs < c.endMs - 200) {
      alpha = 0.32
    } else if (elapsedMs < c.endMs) {
      alpha = Math.max(0, (c.endMs - elapsedMs) / 200 * 0.32)
    } else {
      alpha = 0
    }

    if (alpha < 0.02) continue

    // Curtain position: sweeps from right to left
    // At progress=0: curtain covers right 60%
    // At progress=1: curtain is off left edge
    const curtainLeft = w * (1 - progress) - w * 0.6 * (1 - progress)
    const curtainWidth = w * 0.55

    const grad = ctx.createLinearGradient(curtainLeft, 0, curtainLeft + curtainWidth, 0)
    grad.addColorStop(0, `rgba(17,23,21,${alpha.toFixed(3)})`)
    grad.addColorStop(0.3, `rgba(17,23,21,${(alpha * 0.85).toFixed(3)})`)
    grad.addColorStop(0.7, `rgba(17,23,21,${(alpha * 0.2).toFixed(3)})`)
    grad.addColorStop(1, 'rgba(17,23,21,0)')

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }
}

/** Reset noise tile so each replay gets a fresh pattern */
export function resetInkBleedNoise(): void {
  noiseTile = null
}
