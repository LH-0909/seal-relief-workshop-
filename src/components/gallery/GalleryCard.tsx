import type { GalleryCase } from '../../data/galleryCases'

type GalleryCardProps = {
  item: GalleryCase
  onOpen: (item: GalleryCase) => void
}

export default function GalleryCard({ item, onOpen }: GalleryCardProps) {
  return (
    <article className="gallery-card gallery-card--catalogue">
      <button type="button" onClick={() => onOpen(item)} className="gallery-card__image">
        <img src={item.image} alt={item.alt} loading="lazy" />
        <span>查看册页</span>
      </button>
      <div className="gallery-card__body">
        <p className="case-label">{item.category}</p>
        <h2>{item.title}</h2>
        <p>{item.shortDescription}</p>
        <div className="tag-row">
          {item.styleTags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <button className="text-link" type="button" onClick={() => onOpen(item)}>
          查看册页
        </button>
      </div>
    </article>
  )
}
