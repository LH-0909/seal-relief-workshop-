import { Link } from 'react-router-dom'

type HeroSectionProps = {
  onReplayIntro?: () => void
}

export default function HeroSection({ onReplayIntro }: HeroSectionProps) {
  return (
    <section className="home-hero-section">
      <div className="home-hero__copy">
        <p className="eyebrow">Seal Relief Studio</p>
        <h1>
          方寸有印，
          <span>光影生韵。</span>
        </h1>
        <p className="hero-lede">
          以数字技术重现朱砂、石刻与纸墨之间的层次，让一枚平面印文拥有可触摸的浮雕质感。
        </p>
        <div className="hero-actions">
          <Link className="btn-secondary btn-large" to="/origin">探寻古印</Link>
          <Link className="btn-secondary btn-large" to="/gallery">浏览印谱</Link>
          <Link className="btn-primary btn-large" to="/workbench">开始创作</Link>
        </div>
        <div className="hero-proof">
          <span>读印</span>
          <span>赏印</span>
          <span>观印</span>
          <span>制印</span>
        </div>
        {onReplayIntro && (
          <button className="intro-replay-link" type="button" onClick={onReplayIntro}>
            重播开场
          </button>
        )}
      </div>

      <div className="hero-image-wrap">
        <img src="/images/atmosphere/seal-scene-01.png" alt="宣纸、红色印玺、朱砂方印、砚台和毛笔氛围图" />
        <span className="hero-image-tag">朱砂 · 宣纸 · 浮雕工坊</span>
      </div>
    </section>
  )
}
