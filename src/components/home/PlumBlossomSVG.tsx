import { PLUM_PETAL_PATH, PLUM_PETAL_ROTATIONS, BLOSSOM_LAYOUT } from '../../data/svgShapes'
import styles from './InkRevealIntro.module.css'

/**
 * Renders 7 plum blossoms as inline SVG, each with staggered CSS animations.
 * Blossoms 4-7 are hidden on mobile via CSS class.
 */
export default function PlumBlossomSVG() {
  return (
    <svg
      className={styles.plumSvg}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <filter id="plum-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
        </filter>
        <radialGradient id="petal-grad" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="rgba(180,60,38,0.32)" />
          <stop offset="60%" stopColor="rgba(155,45,32,0.18)" />
          <stop offset="100%" stopColor="rgba(155,45,32,0.04)" />
        </radialGradient>
      </defs>

      {BLOSSOM_LAYOUT.map((blossom) => (
        <g
          key={blossom.id}
          className={
            styles.blossom +
            (blossom.hideOnMobile ? ' ' + styles.blossomMobileHidden : '') +
            ' ' +
            styles['blossom' + blossom.id]
          }
          transform={`translate(${blossom.tx}, ${blossom.ty}) scale(${blossom.scale}) rotate(${blossom.rotate})`}
          style={{ animationDelay: `${blossom.delay}ms` }}
        >
          {/* 5 petals */}
          {PLUM_PETAL_ROTATIONS.map((angle) => (
            <path
              key={angle}
              d={PLUM_PETAL_PATH}
              fill="url(#petal-grad)"
              transform={`rotate(${angle})`}
              filter="url(#plum-blur)"
            />
          ))}
          {/* Stamens — small dots in center */}
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <circle
              key={i}
              cx={0}
              cy={-8}
              r={1.2}
              fill="rgba(233,221,197,0.35)"
              transform={`rotate(${angle})`}
            />
          ))}
          <circle cx={0} cy={0} r={1.8} fill="rgba(233,221,197,0.3)" />
        </g>
      ))}
    </svg>
  )
}
