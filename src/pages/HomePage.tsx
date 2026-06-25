import { useState } from 'react'
import AncientSealScroll from '../components/culture/AncientSealScroll'
import AppFooter from '../components/layout/AppFooter'
import AppHeader from '../components/layout/AppHeader'
import CultureIntro from '../components/home/CultureIntro'
import FeatureGrid from '../components/home/FeatureGrid'
import HeroSection from '../components/home/HeroSection'
import InkRevealIntro from '../components/home/InkRevealIntro'
import InspirationSection from '../components/home/InspirationSection'
import SelectedGallery from '../components/home/SelectedGallery'
import ValuePathSection from '../components/home/ValuePathSection'
import WorkshopEntry from '../components/home/WorkshopEntry'

type IntroPageStatus = 'idle' | 'active' | 'complete'

export default function HomePage() {
  const [introStatus, setIntroStatus] = useState<IntroPageStatus>('idle')
  const [replaySignal, setReplaySignal] = useState(0)

  const pageClassName =
    'site-page' +
    (introStatus === 'active' ? ' intro-active' : '') +
    (introStatus === 'complete' ? ' intro-complete' : '')

  return (
    <div className={pageClassName}>
      <div className="page-ambient" aria-hidden="true" />
      <InkRevealIntro replaySignal={replaySignal} onStatusChange={setIntroStatus} />
      <AppHeader />
      <main>
        <HeroSection onReplayIntro={() => setReplaySignal((value) => value + 1)} />
        <FeatureGrid />
        <CultureIntro />
        <AncientSealScroll />
        <InspirationSection />
        <SelectedGallery />
        <WorkshopEntry />
        <ValuePathSection />
      </main>
      <AppFooter />
    </div>
  )
}
