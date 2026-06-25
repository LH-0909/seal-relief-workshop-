import { useMemo, useState } from 'react'
import SourceDisclosure from '../components/common/SourceDisclosure'
import DemoEmptyState from '../components/gallery/DemoEmptyState'
import GalleryCard from '../components/gallery/GalleryCard'
import GalleryDetailModal from '../components/gallery/GalleryDetailModal'
import GalleryFilter from '../components/gallery/GalleryFilter'
import AppFooter from '../components/layout/AppFooter'
import AppHeader from '../components/layout/AppHeader'
import { demoResultCases, galleryCases, galleryFilters, type GalleryCase, type GalleryCategory } from '../data/galleryCases'

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState<'全部' | GalleryCategory>('全部')
  const [selectedCase, setSelectedCase] = useState<GalleryCase | null>(null)

  const visibleItems = useMemo(() => {
    if (activeFilter === '全部') return galleryCases
    if (activeFilter === '系统演示案例') return demoResultCases
    return galleryCases.filter((item) => item.category === activeFilter)
  }, [activeFilter])

  return (
    <div className="site-page gallery-page">
      <div className="page-ambient" aria-hidden="true" />
      <AppHeader />
      <main className="gallery-main">
        <section className="gallery-hero">
          <p className="eyebrow">Seal Catalogue</p>
          <h1>数字印谱馆</h1>
          <p>方寸之间，见文字、章法、刀痕与时代气息。</p>
        </section>

        <GalleryFilter filters={galleryFilters} active={activeFilter} onChange={setActiveFilter} />

        {activeFilter === '系统演示案例' ? (
          <DemoEmptyState />
        ) : (
          <section className="gallery-grid">
            {visibleItems.map((item) => (
              <GalleryCard key={item.id} item={item} onOpen={setSelectedCase} />
            ))}
          </section>
        )}

        <DemoEmptyState />
        <SourceDisclosure />
      </main>
      <AppFooter />
      {selectedCase && <GalleryDetailModal item={selectedCase} onClose={() => setSelectedCase(null)} />}
    </div>
  )
}
