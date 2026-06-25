import { useEffect, useState } from 'react'
import { exportImage } from '../../engine/export'
import { process2_5D, type TwoHalfDParams } from '../../engine/layerCompositor'
import { processReliefFull, type ReliefParams } from '../../engine/reliefEngine'
import { useEditor } from '../../store/editorStore'

type ExportButtonProps = {
  className?: string
  label?: string
}

function buildReliefParams(sp: Record<string, number>): ReliefParams {
  const fm = (sp['fidelityMode'] ?? 1) === 1
  return {
    mode: (sp['reliefMode'] ?? 0) === 1 ? 'sink' : 'raise',
    depth: sp['depth'] ?? 50, soften: sp['soften'] ?? 30,
    lightDir: sp['lightDir'] ?? 0, lightHeight: sp['lightHeight'] ?? 45,
    shadow: sp['shadow'] ?? 35, specular: sp['specular'] ?? 25,
    grain: sp['grain'] ?? 15, wear: fm ? 0 : (sp['wear'] ?? 10),
    fidelityMode: fm, fidelity: sp['fidelity'] ?? 100, reliefBlend: sp['reliefBlend'] ?? 60,
  }
}

function build2_5DParams(sp: Record<string, number>): TwoHalfDParams {
  return {
    mode: (sp['reliefMode'] ?? 0) === 1 ? 'sink' : 'raise',
    depth: sp['depth'] ?? 55, soften: sp['soften'] ?? 16,
    lightDir: sp['lightDir'] ?? 0, lightHeight: sp['lightHeight'] ?? 48,
    shadow: sp['shadow'] ?? 15, specular: sp['specular'] ?? 18,
    stereoLevel: sp['stereoLevel'] ?? 1,
    sidewallDepth: sp['sidewallDepth'] ?? 10, sidewallDark: sp['sidewallDark'] ?? 60,
    contactShadow: sp['contactShadow'] ?? 40, dropShadow: sp['dropShadow'] ?? 30,
    dropBlur: sp['dropBlur'] ?? 8, topLightIntensity: sp['topLightIntensity'] ?? 45,
    contourProtect: (sp['contourProtect'] ?? 1) === 1,
    grain: sp['grain'] ?? 8, wear: 0,
    fidelityMode: true, reliefBlend: sp['reliefBlend'] ?? 65,
  }
}

export default function ExportButton({ className = '', label = '导出作品' }: ExportButtonProps) {
  const { state } = useEditor()
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!done) return
    const timer = window.setTimeout(() => setDone(false), 1800)
    return () => window.clearTimeout(timer)
  }, [done])

  const handleExport = async () => {
    const srcImage = state.originalImageData
    if (!srcImage) {
      alert('请先上传印章图片。')
      return
    }

    try {
      const bgType = state.params['bgType'] ?? 0
      const textureStr = state.params['texture'] ?? 0
      const renderMode = state.params['renderMode'] ?? 0

      let fullRes: ImageData
      if (renderMode === 1) {
        const p25 = build2_5DParams(state.params)
        fullRes = process2_5D(srcImage, p25, bgType, textureStr)
      } else {
        const params = buildReliefParams(state.params)
        fullRes = processReliefFull(srcImage, params, 4096, bgType, textureStr)
      }

      await exportImage(fullRes, state.exportFormat, state.exportScale)
      setDone(true)
    } catch {
      alert('导出失败，请重试。')
    }
  }

  return (
    <span className="export-button-wrap">
      <button
        className={'btn-primary ' + className}
        onClick={handleExport}
        disabled={!state.originalImageData}
        type="button"
      >
        {label}
      </button>
      {done && <span className="export-stamp" role="status">已导出</span>}
    </span>
  )
}
