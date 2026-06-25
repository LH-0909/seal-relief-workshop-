import { Link } from 'react-router-dom'

export default function WorkshopEntry() {
  return (
    <section className="section-block workshop-entry">
      <div className="workshop-entry__panel">
        <p className="eyebrow">Create</p>
        <h2>从赏印，到制印。</h2>
        <p>
          上传自己的 2D 印章图片，在不改变文字、边框和比例的前提下，调节高度、光照、颗粒、纸面和材质。
        </p>
        <Link className="btn-primary" to="/workbench">进入浮雕创作工坊</Link>
      </div>
    </section>
  )
}
