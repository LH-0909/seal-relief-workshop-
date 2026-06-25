import type { CultureCard } from '../../data/sealCulture'
import { caseById } from '../../data/sealCulture'
import type { GalleryCase } from '../../data/galleryCases'

type SealSchoolCardProps = {
  card: CultureCard
  onOpen: (item: GalleryCase) => void
}

export default function SealSchoolCard({ card, onOpen }: SealSchoolCardProps) {
  const item = caseById(card.caseId)

  return (
    <article className="culture-card">
      <button className="culture-card__image" type="button" onClick={() => onOpen(item)}>
        <img src={item.image} alt={item.alt} loading="lazy" />
      </button>
      <div className="culture-card__body">
        <h3>{card.title}</h3>
        <p>{card.text}</p>
        <div className="tag-row">
          {card.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <button className="text-link" type="button" onClick={() => onOpen(item)}>查看册页</button>
      </div>
    </article>
  )
}
