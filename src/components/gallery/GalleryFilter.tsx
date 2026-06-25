import type { GalleryCategory } from '../../data/galleryCases'

type GalleryFilterProps = {
  filters: Array<'全部' | GalleryCategory>
  active: '全部' | GalleryCategory
  onChange: (value: '全部' | GalleryCategory) => void
}

export default function GalleryFilter({ filters, active, onChange }: GalleryFilterProps) {
  return (
    <div className="gallery-filters" aria-label="印谱筛选">
      {filters.map((filter) => (
        <button
          key={filter}
          className={active === filter ? 'active' : ''}
          onClick={() => onChange(filter)}
          type="button"
        >
          {filter}
        </button>
      ))}
    </div>
  )
}
