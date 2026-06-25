const features = [
  { title: '原图保真', text: '不改变印文、边框、比例和透明边界。', icon: '印' },
  { title: '高度图浮雕', text: '以高度图建立平面到浮雕的层级。', icon: '高' },
  { title: '朱砂颗粒', text: '模拟印泥中的细小粗粝与斑驳。', icon: '朱' },
  { title: '宣纸压印', text: '表现纸面凹陷和柔和接触阴影。', icon: '纸' },
  { title: '石雕与玉石质感', text: '通过参数探索器物与材质想象。', icon: '石' },
  { title: 'PNG / WebP 导出', text: '在本地生成并保存高清结果。', icon: '出' },
]

export default function FeatureGrid() {
  return (
    <section className="section-block">
      <div className="section-heading-row">
        <p className="eyebrow">Capabilities</p>
        <h2>数字浮雕能力</h2>
      </div>
      <div className="feature-grid">
        {features.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <span className="feature-icon" aria-hidden="true">{feature.icon}</span>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
