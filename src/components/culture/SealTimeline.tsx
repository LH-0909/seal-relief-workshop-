import type { GalleryCase } from '../../data/galleryCases'
import { caseById, timelineNodes } from '../../data/sealCulture'

type SealTimelineProps = {
  onOpen: (item: GalleryCase) => void
}

export default function SealTimeline({ onOpen }: SealTimelineProps) {
  return (
    <section className="section-block origin-section">
      <div className="section-heading-row">
        <p className="eyebrow">Origin</p>
        <h2>古印源流</h2>
      </div>
      <div className="timeline-grid">
        {timelineNodes.map((node, index) => {
          const caseItem = node.caseId ? caseById(node.caseId) : null
          return (
            <article className="timeline-node" key={node.title}>
              <span className="timeline-count">{String(index + 1).padStart(2, '0')}</span>
              <div className="timeline-visual">
                {caseItem ? (
                  <button type="button" onClick={() => onOpen(caseItem)}>
                    <img src={caseItem.image} alt={caseItem.alt} loading="lazy" />
                  </button>
                ) : node.image ? (
                  <img src={node.image} alt={node.title} loading="lazy" />
                ) : (
                  <div className="abstract-seal" aria-hidden="true">
                    <span />
                    <i />
                  </div>
                )}
              </div>
              <p className="case-label">{node.period}</p>
              <h3>{node.title}</h3>
              <p>{node.text}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
