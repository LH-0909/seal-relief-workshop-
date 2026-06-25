// ── Particle System for Intro Canvas ──────────────────────────
// Two pools: gold dust (金粉) and vermillion (朱砂).
// All updates happen via direct mutation — no React state.

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  baseAlpha: number
}

export interface ParticlePoolConfig {
  colorPalette: readonly string[]
  sizeRange: readonly [number, number]
  speedRange: readonly [number, number]
  lifeRange: readonly [number, number]
  alphaRange: readonly [number, number]
  /** normalized 0-1 spawn zone */
  spawnZone: { x: readonly [number, number]; y: readonly [number, number] }
  /** drift bias added to vy each frame — negative = upward */
  buoyancy: number
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function spawnParticle(
  p: Particle,
  w: number,
  h: number,
  config: ParticlePoolConfig,
): void {
  p.x = rand(config.spawnZone.x[0] * w, config.spawnZone.x[1] * w)
  p.y = rand(config.spawnZone.y[0] * h, config.spawnZone.y[1] * h)
  const speed = rand(config.speedRange[0], config.speedRange[1])
  const angle = rand(0, Math.PI * 2)
  p.vx = Math.cos(angle) * speed
  p.vy = Math.sin(angle) * speed + config.buoyancy
  p.maxLife = rand(config.lifeRange[0], config.lifeRange[1])
  p.life = p.maxLife
  p.size = rand(config.sizeRange[0], config.sizeRange[1])
  p.color = pick(config.colorPalette)!
  p.baseAlpha = rand(config.alphaRange[0], config.alphaRange[1])
}

export function createParticlePool(
  count: number,
  w: number,
  h: number,
  config: ParticlePoolConfig,
): Particle[] {
  const pool: Particle[] = []
  for (let i = 0; i < count; i++) {
    const p: Particle = {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 1, size: 2, color: '#fff', baseAlpha: 0.3,
    }
    spawnParticle(p, w, h, config)
    // stagger initial life so they don't all spawn/respawn at once
    p.life = rand(0, p.maxLife)
    pool.push(p)
  }
  return pool
}

export function updateParticlePool(
  pool: Particle[],
  dt: number,
  w: number,
  h: number,
  config: ParticlePoolConfig,
): void {
  for (const p of pool) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.life -= dt
    if (p.life <= 0) {
      spawnParticle(p, w, h, config)
    }
    // wrap around viewport edges
    if (p.x < -10) p.x = w + 10
    if (p.x > w + 10) p.x = -10
    if (p.y < -10) p.y = h + 10
    if (p.y > h + 10) p.y = -10
  }
}

export function drawParticlePool(
  ctx: CanvasRenderingContext2D,
  pool: Particle[],
): void {
  for (const p of pool) {
    const lifeRatio = Math.max(0, p.life / p.maxLife)
    const alpha = p.baseAlpha * lifeRatio
    if (alpha < 0.01) continue
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

// ── Pre-built configs ─────────────────────────────────────────

export const GOLD_DUST_CONFIG: ParticlePoolConfig = {
  colorPalette: ['#d4a745', '#e8c860', '#f0d080', '#c9a030', '#dfc070'],
  sizeRange: [0.8, 2.4],
  speedRange: [3, 10],
  lifeRange: [2.5, 5.5],
  alphaRange: [0.15, 0.4],
  spawnZone: { x: [0.05, 0.95], y: [0.05, 0.65] },
  buoyancy: -2,
}

export const VERMILLION_CONFIG: ParticlePoolConfig = {
  colorPalette: ['#9b2d20', '#b83a2a', '#c04030', '#8a2018', '#a03028'],
  sizeRange: [0.6, 1.8],
  speedRange: [2, 7],
  lifeRange: [3, 6],
  alphaRange: [0.12, 0.3],
  spawnZone: { x: [0.55, 0.98], y: [0.55, 0.95] },
  buoyancy: -1,
}

/** Desktop particle counts */
export const GOLD_DUST_COUNT = 40
export const VERMILLION_COUNT = 20

/** Mobile particle counts */
export const GOLD_DUST_COUNT_MOBILE = 20
export const VERMILLION_COUNT_MOBILE = 10
