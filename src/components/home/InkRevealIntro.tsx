import { useCallback, useEffect, useRef, useState } from 'react'
import { INTRO_SEQUENCE_STORAGE_KEY, introSequenceFrames } from '../../data/introSequence'
import styles from './InkRevealIntro.module.css'

type IntroStatus = 'idle' | 'loading' | 'playing' | 'finishing'

type InkRevealIntroProps = {
  replaySignal: number
  onStatusChange?: (status: 'idle' | 'active' | 'complete') => void
}

const INTRO_DURATION_MS = 5450
const MOBILE_INTRO_DURATION_MS = 3300
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
          <div className={styles.inkWash} />
          <div className={styles.plumReveal} />
          <div className={styles.sealDrop} />
        </div>
      )}
    </div>
  )
}
