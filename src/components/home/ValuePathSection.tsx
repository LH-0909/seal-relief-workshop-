const groups = [
  {
    title: '文化价值',
    text: '以读印、赏印、观印、制印串联浏览路径，让印谱资料与数字创作发生自然衔接。',
  },
  {
    title: '技术路径',
    text: '使用本地 Canvas 图像处理，将蒙版、高度图、光照和材质融合为可导出的浮雕效果。',
  },
  {
    title: '应用场景',
    text: '适合文创展示、数字印谱、课程演示、作品集呈现和个人印章视觉再设计。',
  },
]

export default function ValuePathSection() {
  return (
    <section className="section-block value-section">
      <div className="value-grid">
        {groups.map((group) => (
          <article className="value-card" key={group.title}>
            <h3>{group.title}</h3>
            <p>{group.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
