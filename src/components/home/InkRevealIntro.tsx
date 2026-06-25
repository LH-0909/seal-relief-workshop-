import { useCallback, useEffect, useRef, useState } from 'react'
import { INTRO_SEQUENCE_STORAGE_KEY, introSequenceFrames } from '../../data/introSequence'
import { SEAL_OUTER_PATH, SEAL_INNER_PATH, SEAL_TEXT_STROKES, SEAL_VERTICAL_STROKES } from '../../data/svgShapes'
import InkRevealCanvas from './InkRevealCanvas'
import PlumBlossomSVG from './PlumBlossomSVG'
import styles from './InkRevealIntro.module.css'

type IntroStatus = 'idle' | 'loading' | 'playing' | 'finishing'

type InkRevealIntroProps = {
  replaySignal: number
  onStatusChange?: (status: 'idle' | 'active' | 'complete') => void
}

const INTRO_DURATION_MS = 6800
const MOBILE_INTRO_DURATION_MS = 4100
const EXIT_DURATION_MS = 420
const LOAD_TIMEOUT_MS = 6000

function canUseSessionStorage() {
  try {
    window.sessionStorage.getItem(INTRO_SEQUENCE_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

function isReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isMobileViewport() {
  return window.matchMedia('(max-width: 640px)').matches
}

function preloadIntroImages(timeoutMs: number) {
  const imagePromises = introSequenceFrames.map(
    (frame) =>
      new Promise<void>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve()
        image.onerror = () => reject(new Error(frame.src))
        image.src = frame.src
      }),
  )

  const timeout = new Promise<void>((_, reject) => {
    window.setTimeout(() => reject(new Error('intro image preload timeout')), timeoutMs)
  })

  return Promise.race([Promise.all(imagePromises).then(() => undefined), timeout])
}

export default function InkRevealIntro({ replaySignal, onStatusChange }: InkRevealIntroProps) {
  const [status, setStatus] = useState<IntroStatus>('idle')
  const timersRef = useRef<number[]>([])
  const replayRef = useRef(replaySignal)
  const activeRef = useRef(false)
  const introStartTimeRef = useRef(0)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }, [])

  const markPlayed = useCallback(() => {
    if (!canUseSessionStorage()) return
    window.sessionStorage.setItem(INTRO_SEQUENCE_STORAGE_KEY, '1')
  }, [])

  const closeIntro = useCallback(
    (complete: boolean) => {
      clearTimers()
      activeRef.current = false
      setStatus('idle')
      onStatusChange?.(complete ? 'complete' : 'idle')
    },
    [clearTimers, onStatusChange],
  )

  const finishIntro = useCallback(() => {
    setStatus('finishing')
    const exitTimer = window.setTimeout(() => closeIntro(true), EXIT_DURATION_MS)
    timersRef.current.push(exitTimer)
  }, [closeIntro])

  const startIntro = useCallback(
    async (forceReplay = false) => {
      clearTimers()
      if (isReducedMotion()) {
        onStatusChange?.('idle')
        return
      }

      const hasPlayed =
        canUseSessionStorage() && window.sessionStorage.getItem(INTRO_SEQUENCE_STORAGE_KEY) === '1'
      if (hasPlayed && !forceReplay) {
        onStatusChange?.('idle')
        return
      }

      activeRef.current = true
      onStatusChange?.('active')
      setStatus('loading')

      try {
        await preloadIntroImages(LOAD_TIMEOUT_MS)
      } catch {
        markPlayed()
        closeIntro(true)
        return
      }

      if (!activeRef.current) return

      markPlayed()
      introStartTimeRef.current = performance.now()
      setStatus('playing')
      const duration = isMobileViewport() ? MOBILE_INTRO_DURATION_MS : INTRO_DURATION_MS
      const finishTimer = window.setTimeout(finishIntro, duration)
      timersRef.current.push(finishTimer)
    },
    [clearTimers, closeIntro, finishIntro, markPlayed, onStatusChange],
  )

  const skipIntro = useCallback(() => {
    markPlayed()
    closeIntro(true)
  }, [closeIntro, markPlayed])

  useEffect(() => {
    startIntro(false)
    return () => {
      clearTimers()
      activeRef.current = false
    }
  }, [clearTimers, startIntro])

  useEffect(() => {
    if (replaySignal === replayRef.current) return
    replayRef.current = replaySignal
    startIntro(true)
  }, [replaySignal, startIntro])

  if (status === 'idle') {
    return null
  }

  const duration = isMobileViewport() ? MOBILE_INTRO_DURATION_MS : INTRO_DURATION_MS

  return (
    <div className={styles.overlay + (status === 'finishing' ? ' ' + styles.finishing : '')}>
      <button className={styles.skipButton} type="button" onClick={skipIntro}>
        跳过开场
      </button>

      {status === 'loading' ? (
        <div className={styles.loadingState} role="status">
          <span>水墨正在入纸</span>
        </div>
      ) : (
        <div className={styles.stage} aria-hidden="true">
          {introSequenceFrames.map((frame, index) => (
            <div className={styles.frame + ' ' + styles['frame' + (index + 1)]} key={frame.id}>
              <img src={frame.src} alt="" draggable={false} />
            </div>
          ))}

          {/* Canvas layer: ink bleed + particles */}
          <InkRevealCanvas
            startTimeRef={introStartTimeRef}
            isPlaying={status === 'playing'}
            durationMs={duration}
          />

          {/* SVG plum blossoms — replaces old CSS gradient .plumReveal */}
          <PlumBlossomSVG />

          {/* SVG seal stamp — replaces old CSS .sealDrop */}
          <div className={styles.sealStamp}>
            <svg viewBox="0 0 84 84" aria-hidden="true" className={styles.sealSvg}>
              <defs>
                <filter id="seal-rough" x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G" />
                </filter>
                <filter id="seal-bleed-blur" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                </filter>
              </defs>

              {/* Outer border */}
              <path d={SEAL_OUTER_PATH} fill="none" stroke="#9b2d20" strokeWidth="2.8" filter="url(#seal-rough)" opacity="0.88" />

              {/* Inner border */}
              <path d={SEAL_INNER_PATH} fill="none" stroke="#9b2d20" strokeWidth="1.4" opacity="0.72" />

              {/* Horizontal character strokes */}
              {SEAL_TEXT_STROKES.map((d, i) => (
                <path key={`h-${i}`} d={d} fill="none" stroke="#9b2d20" strokeWidth="2.4" strokeLinecap="round" opacity="0.78" />
              ))}

              {/* Vertical character strokes */}
              {SEAL_VERTICAL_STROKES.map((d, i) => (
                <path key={`v-${i}`} d={d} fill="none" stroke="#9b2d20" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
              ))}

              {/* Subtle paper texture fill */}
              <rect x="4" y="4" width="76" height="76" rx="6" fill="rgba(244,235,216,0.06)" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
