import { useState } from 'react'
import AppFooter from '../components/layout/AppFooter'
import AppHeader from '../components/layout/AppHeader'
import GalleryDetailModal from '../components/gallery/GalleryDetailModal'
import HeritageBridge from '../components/culture/HeritageBridge'
import SealSchoolCard from '../components/culture/SealSchoolCard'
import SealTimeline from '../components/culture/SealTimeline'
import SourceDisclosure from '../components/common/SourceDisclosure'
import type { GalleryCase } from '../data/galleryCases'
import { modernCards, schoolCards } from '../data/sealCulture'

export default function OriginPage() {
  const [selectedCase, setSelectedCase] = useState<GalleryCase | null>(null)

  return (
    <div className="site-page origin-page">
      <div className="page-ambient" aria-hidden="true" />
      <AppHeader />
      <main>
        <section className="origin-hero origin-hero--abstract">
          <div>
            <p className="eyebrow">Seal Culture</p>
            <h1>一方印，见千年文脉。</h1>
            <p>
              这不是一篇百科长文，而是一条现代数字导览：从古印源流、印学风貌到数字浮雕，
              以短标题、册页视觉和谨慎说明组织阅读。
            </p>
          </div>
          <div className="origin-hero__seal" aria-hidden="true">
            <span />
            <i />
          </div>
        </section>

        <SealTimeline onOpen={setSelectedCase} />

        <section className="section-block">
          <div className="section-heading-row">
            <p className="eyebrow">Schools</p>
            <h2>流派与传承</h2>
          </div>
          <div className="culture-card-grid">
            {schoolCards.map((card) => (
              <SealSchoolCard key={card.title} card={card} onOpen={setSelectedCase} />
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading-row">
            <p className="eyebrow">Modern Heritage</p>
            <h2>近现代印学传承</h2>
          </div>
          <div className="modern-exhibit-grid">
            {modernCards.map((card) => (
              <SealSchoolCard key={card.title} card={card} onOpen={setSelectedCase} />
            ))}
          </div>
        </section>

        <HeritageBridge />
        <SourceDisclosure />
      </main>
      <AppFooter />
      {selectedCase && <GalleryDetailModal item={selectedCase} onClose={() => setSelectedCase(null)} />}
    </div>
  )
}
