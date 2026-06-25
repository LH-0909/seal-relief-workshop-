import { Link } from 'react-router-dom'

const guideCards = [
  {
    title: '古印源流',
    label: '读印',
    text: '从古玺印面、文字边界和册页线索进入印学导览。',
    to: '/origin',
  },
  {
    title: '流派传承',
    label: '观印',
    text: '在数字印谱馆中完整查看 9 张用户提供的印谱资料。',
    to: '/gallery',
  },
  {
    title: '数字再创作',
    label: '制印',
    text: '进入浮雕创作工坊，用本地 Canvas 生成材质与光影。',
    to: '/workbench',
  },
]

export default function SelectedGallery() {
  return (
    <section className="section-block selected-gallery">
      <div className="section-heading-row">
        <p className="eyebrow">Guide</p>
        <h2>数字印谱精选</h2>
      </div>
      <div className="selected-gallery-grid selected-gallery-grid--text">
        {guideCards.map((item) => (
          <Link className="guide-card" to={item.to} key={item.title}>
            <span>{item.label}</span>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
