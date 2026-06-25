import { useEffect, useRef } from 'react'
import { useEditor } from '../store/editorStore'
import { processReliefFull, type ReliefParams } from '../engine/reliefEngine'
import { process2_5D, type TwoHalfDParams } from '../engine/layerCompositor'

function buildReliefParams(sp: Record<string, number>): ReliefParams {
  const fm = (sp['fidelityMode'] ?? 1) === 1
  return {
    mode: (sp['reliefMode'] ?? 0) === 1 ? 'sink' : 'raise',
    depth: sp['depth'] ?? 50,
    soften: sp['soften'] ?? 30,
    lightDir: sp['lightDir'] ?? 0,
    lightHeight: sp['lightHeight'] ?? 45,
    shadow: sp['shadow'] ?? 35,
    specular: sp['specular'] ?? 25,
    grain: sp['grain'] ?? 15,
    wear: fm ? 0 : (sp['wear'] ?? 10),
    fidelityMode: fm,
    fidelity: sp['fidelity'] ?? 100,
    reliefBlend: sp['reliefBlend'] ?? 60,
  }
}

function build2_5DParams(sp: Record<string, number>): TwoHalfDParams {
  return {
    mode: (sp['reliefMode'] ?? 0) === 1 ? 'sink' : 'raise',
    depth: sp['depth'] ?? 55,
    soften: sp['soften'] ?? 16,
    lightDir: sp['lightDir'] ?? 0,
    lightHeight: sp['lightHeight'] ?? 48,
    shadow: sp['shadow'] ?? 15,
    specular: sp['specular'] ?? 18,
    stereoLevel: sp['stereoLevel'] ?? 1,
    sidewallDepth: sp['sidewallDepth'] ?? 10,
    sidewallDark: sp['sidewallDark'] ?? 60,
    contactShadow: sp['contactShadow'] ?? 40,
    dropShadow: sp['dropShadow'] ?? 30,
    dropBlur: sp['dropBlur'] ?? 8,
    topLightIntensity: sp['topLightIntensity'] ?? 45,
    contourProtect: (sp['contourProtect'] ?? 1) === 1,
    grain: sp['grain'] ?? 8,
    wear: 0,
    fidelityMode: true,
    reliefBlend: sp['reliefBlend'] ?? 65,
  }
}

export function useReliefProcessor() {
  const { state, dispatch } = useEditor()
  const timerRef = useRef<ReturnType<typeof setTimeout>>(0)
  const abortRef = useRef(false)

  useEffect(() => {
    if (!state.originalImageData) return
    abortRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      abortRef.current = false
      dispatch({ type: 'SET_EFFECT_IMAGE', payload: state.originalImageData! })

      setTimeout(() => {
        if (abortRef.current) return
        try {
          const renderMode = state.params['renderMode'] ?? 0
          const bgType = state.params['bgType'] ?? 0
          const textureStr = state.params['texture'] ?? 0

          let result: ImageData
          if (renderMode === 1) {
            // ── 2.5D 强立体模式 ──
            const p25 = build2_5DParams(state.params)
            result = process2_5D(state.originalImageData!, p25, bgType, textureStr)
          } else {
            // ── 保真浮雕模式 ──
            const params = buildReliefParams(state.params)
            result = processReliefFull(state.originalImageData!, params, 512, bgType, textureStr)
          }

          if (!abortRef.current) {
            dispatch({ type: 'SET_EFFECT_IMAGE', payload: result })
          }
        } catch (err) {
          console.error('浮雕处理失败:', err)
          if (!abortRef.current) {
            dispatch({ type: 'SET_EFFECT_IMAGE', payload: state.originalImageData! })
          }
        }
      }, 0)
    }, 80)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [state.originalImageData, state.params, dispatch])
}
