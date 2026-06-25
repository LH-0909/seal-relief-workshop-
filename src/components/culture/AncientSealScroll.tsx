import { Link } from 'react-router-dom'
import { galleryCases } from '../../data/galleryCases'
import { asset } from '../../utils/assetPath'

const scrollIds = ['you-wen-sima-xi', 'deng-shiru', 'wu-changshuo']

const notes: Record<string, string> = {
  'you-wen-sima-xi': '古印源流',
  'deng-shiru': '文人篆刻',
  'wu-changshuo': '近现代印学',
}

export default function AncientSealScroll() {
  const cases = scrollIds
    .map((id) => galleryCases.find((item) => item.id === id))
    .filter(Boolean)

  return (
    <section className="section-block scroll-showcase">
      <div className="section-heading-row">
        <p className="eyebrow">Archive Scroll</p>
        <h2>互动印学长卷</h2>
      </div>

      <Link className="home-scroll-link" to="/gallery" aria-label="前往数字印谱馆">
        <div className="ancient-scroll open">
          <div className="scroll-rod scroll-rod--left" aria-hidden="true" />
          <div className="scroll-paper">
            <div className="scroll-content">
              <div className="scroll-route">
                <span>古印源流</span>
                <i />
                <span>文人篆刻</span>
                <i />
                <span>近现代印学</span>
                <i />
                <span>数字浮雕创作</span>
              </div>
              <div className="scroll-timeline scroll-timeline--home">
                {cases.map((item) => item && (
                  <article className="scroll-case-node" key={item.id}>
                    <span className="scroll-thumb">
                      <img src={item.image} alt={item.alt} loading="lazy" />
                    </span>
                    <strong>{item.title}</strong>
                    <small>{notes[item.id]}</small>
                  </article>
                ))}
                <article className="scroll-case-node scroll-case-node--digital">
                  <span className="scroll-thumb">
                    <img src={asset('images/demo-results/workbench-preview.png')} alt="数字浮雕创作工作台预览" loading="lazy" />
                  </span>
                  <strong>数字浮雕创作</strong>
                  <small>进入工作台，以高度图和光照重现质感。</small>
                </article>
              </div>
            </div>
          </div>
          <div className="scroll-rod scroll-rod--right" aria-hidden="true" />
        </div>
      </Link>
    </section>
  )
}
