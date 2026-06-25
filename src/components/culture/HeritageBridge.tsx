import { Link } from 'react-router-dom'
import { bridgeSteps } from '../../data/sealCulture'

export default function HeritageBridge() {
  return (
    <section className="section-block bridge-section">
      <div className="bridge-panel">
        <p className="eyebrow">Digital Method</p>
        <h2>从金石之学，到数字之印。</h2>
        <p>
          本系统不重绘、不替换用户印文，而是在保留原始图案结构的基础上，通过蒙版提取、高度图、
          局部光照与材质融合，为平面印章赋予新的视觉层次。
        </p>
        <div className="bridge-steps">
          {bridgeSteps.map((step) => <span key={step}>{step}</span>)}
        </div>
        <Link className="btn-primary" to="/workbench">进入创作工坊</Link>
      </div>
    </section>
  )
}
