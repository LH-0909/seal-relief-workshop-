import { useEffect, useRef } from 'react'
import { drawInkBleed, drawInkCurtains, resetInkBleedNoise } from './inkBleed'
import {
  createParticlePool,
  drawParticlePool,
  updateParticlePool,
  GOLD_DUST_CONFIG,
  VERMILLION_CONFIG,
  GOLD_DUST_COUNT,
  VERMILLION_COUNT,
  GOLD_DUST_COUNT_MOBILE,
  VERMILLION_COUNT_MOBILE,
  type Particle,
} from './particleSystem'

type InkRevealCanvasProps = {
  startTimeRef: React.MutableRefObject<number>
  isPlaying: boolean
  durationMs: number
}

function isMobileViewport(): boolean {
  return window.matchMedia('(max-width: 640px)').matches
}

function setupHiDPI(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  const dpr = window.devicePixelRatio || 1
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

export default function InkRevealCanvas({
  startTimeRef,
  isPlaying,
  durationMs,
}: InkRevealCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef(0)
  const particlesRef = useRef<Particle[][] | null>(null)
  const prevTimeRef = useRef(0)

  useEffect(() => {
    if (!isPlaying) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = window.innerWidth
    const h = window.innerHeight
    setupHiDPI(canvas, ctx, w, h)

    // Reset noise for fresh ink bleed each replay
    resetInkBleedNoise()

    // Create particle pools
    const mobile = isMobileViewport()
    const goldCount = mobile ? GOLD_DUST_COUNT_MOBILE : GOLD_DUST_COUNT
    const vermCount = mobile ? VERMILLION_COUNT_MOBILE : VERMILLION_COUNT

    const goldPool = createParticlePool(goldCount, w, h, GOLD_DUST_CONFIG)
    const vermPool = createParticlePool(vermCount, w, h, VERMILLION_CONFIG)
    particlesRef.current = [goldPool, vermPool]

    prevTimeRef.current = performance.now()

    const loop = () => {
      const now = performance.now()
      const elapsed = now - startTimeRef.current

      if (elapsed > durationMs + 500) {
        // past the exit transition — stop
        ctx.clearRect(0, 0, w, h)
        return
      }

      const dt = Math.min((now - prevTimeRef.current) / 1000, 0.05) // cap at 50ms
      prevTimeRef.current = now

      ctx.clearRect(0, 0, w, h)

      // Draw ink bleed (background atmosphere)
      drawInkBleed(ctx, w, h, elapsed)

      // Draw ink curtain sweeps at frame transitions
      drawInkCurtains(ctx, w, h, elapsed, durationMs)

      // Update & draw particles
      updateParticlePool(goldPool, dt, w, h, GOLD_DUST_CONFIG)
      updateParticlePool(vermPool, dt, w, h, VERMILLION_CONFIG)
      drawParticlePool(ctx, goldPool)
      drawParticlePool(ctx, vermPool)

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      particlesRef.current = null
    }
  }, [isPlaying, startTimeRef, durationMs])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
      }}
      aria-hidden="true"
    />
  )
}
