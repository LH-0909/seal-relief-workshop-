import { Link } from 'react-router-dom'
import { asset } from '../../utils/assetPath'

const scenes = [
  {
    title: '朱砂落纸',
    text: '从纸面压痕、墨色留白与印泥颗粒进入方寸世界。',
    image: asset('images/atmosphere/seal-scene-02.png'),
    to: '/gallery',
  },
  {
    title: '印玺雕琢',
    text: '以器物与刻痕想象印章由平面走向浮雕的厚度。',
    image: asset('images/atmosphere/seal-scene-03.png'),
    to: '/workbench',
  },
  {
    title: '山水文房',
    text: '把印谱、砚台和纸墨放回克制的文房语境。',
    image: asset('images/atmosphere/seal-scene-04.png'),
    to: '/origin',
  },
]

export default function InspirationSection() {
  return (
    <section className="section-block inspiration-section">
      <div className="section-heading-row">
        <p className="eyebrow">Inspiration</p>
        <h2>朱砂、宣纸与数字工艺</h2>
      </div>
      <div className="inspiration-grid">
        {scenes.map((scene) => (
          <Link className="inspiration-card" key={scene.title} to={scene.to}>
            <img src={scene.image} alt={scene.title + '氛围图'} loading="lazy" />
            <div>
              <h3>{scene.title}</h3>
              <p>{scene.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
