import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppHeader from '../components/layout/AppHeader'
import WorkbenchActions from '../components/workbench/WorkbenchActions'
import LeftPanel from '../components/LeftPanel'
import MainCanvas from '../components/MainCanvas'
import RightPanel from '../components/RightPanel'
import Footer from '../components/Footer'
import { useReliefProcessor } from '../hooks/useReliefProcessor'
import { EditorProvider } from '../store/editorStore'

const styleHints: Record<string, string> = {
  '保真朱砂浮雕': '推荐预设：保真朱砂浮雕',
  '宣纸压印': '推荐预设：宣纸压印',
  '古籍印鉴': '推荐预设：古籍印鉴',
  '石雕浮雕': '推荐预设：石雕浮雕',
  '青玉印玺': '推荐预设：青玉印玺',
  '青铜古印': '推荐预设：青铜古印',
  paper: '推荐尝试：宣纸压印',
  stone: '推荐尝试：石雕浮雕',
  classic: '推荐尝试：古籍印鉴',
  jade: '推荐尝试：青玉印玺',
  bronze: '推荐尝试：青铜古印',
}

function ReliefProcessorMount() {
  useReliefProcessor()
  return null
}

export default function WorkbenchPage() {
  const [searchParams] = useSearchParams()
  const styleHint = useMemo(() => {
    const style = searchParams.get('style') ?? ''
    return styleHints[style] ?? ''
  }, [searchParams])

  return (
    <EditorProvider>
      <ReliefProcessorMount />
      <div className="app-shell workbench-app">
        <div className="app-ambient" aria-hidden="true" />
        <AppHeader variant="workbench" rightSlot={<WorkbenchActions />} />
        <section className="workbench-title-strip">
          <div>
            <p className="eyebrow">Workshop</p>
            <h1>浮雕创作工坊</h1>
          </div>
          <p>上传印文，保留结构，重现光影。</p>
        </section>
        {styleHint && <div className="style-toast" role="status">{styleHint}</div>}
        <div className="workbench-frame">
          <div className="workbench-edge-art" aria-hidden="true" />
          <LeftPanel />
          <MainCanvas />
          <RightPanel />
        </div>
        <Footer />
      </div>
    </EditorProvider>
  )
}
