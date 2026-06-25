import { Link } from 'react-router-dom'

export default function CultureIntro() {
  return (
    <section className="section-block culture-intro">
      <div className="intro-panel">
        <p className="eyebrow">Read The Seal</p>
        <h2>读印，不只是看一枚红印。</h2>
        <p>
          一方印中同时包含文字结构、章法节奏、边栏处理、刀法趣味与纸墨痕迹。
          本项目以现代数字展馆的方式组织这些线索，让用户先理解印，再进入创作。
        </p>
        <Link className="text-link" to="/origin">进入古印源流</Link>
      </div>
    </section>
  )
}
