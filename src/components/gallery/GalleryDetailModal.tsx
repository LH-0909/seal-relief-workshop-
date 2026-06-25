import { Link } from 'react-router-dom'
import type { GalleryCase } from '../../data/galleryCases'

type GalleryDetailModalProps = {
  item: GalleryCase
  onClose: () => void
}

export default function GalleryDetailModal({ item, onClose }: GalleryDetailModalProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={item.title}>
      <div className="gallery-modal gallery-modal--folio">
        <button className="modal-close" type="button" onClick={onClose}>关闭</button>
        <div className="folio-viewer">
          <img src={item.image} alt={item.alt} />
        </div>
        <div className="modal-copy">
          <p className="case-label">{item.category}</p>
          <h2>{item.title}</h2>
          <p>{item.shortDescription}</p>
          <div className="tag-row">
            {item.styleTags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <dl className="case-meta">
            <div>
              <dt>来源</dt>
              <dd>{item.source}</dd>
            </div>
            <div>
              <dt>使用说明</dt>
              <dd>{item.rightsNote}</dd>
            </div>
          </dl>
          <Link className="btn-primary" to={'/workbench?style=' + encodeURIComponent(item.recommendedPreset)}>
            以此风格创作
          </Link>
        </div>
      </div>
    </div>
  )
}
