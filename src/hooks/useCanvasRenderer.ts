import { useRef, useEffect, useCallback } from 'react'
import { useEditor } from '../store/editorStore'
import {
  drawCheckerboard,
  drawImageDataCentered,
  drawCompareView,
  setupHiDPI,
} from '../engine/canvas-utils'

/**
 * Canvas 渲染 Hook
 * 负责将 editorStore 中的图片数据绘制到 canvas 上。
 */
export function useCanvasRenderer(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const { state } = useEditor()
  const rafIdRef = useRef<number>(0)

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const cssW = parent.clientWidth
    const cssH = parent.clientHeight
    if (cssW <= 0 || cssH <= 0) return

    const ctx = canvas.getContext('2d')!
    setupHiDPI(canvas, ctx, cssW, cssH)

    // 清屏
    ctx.clearRect(0, 0, cssW, cssH)

    // 棋盘格背景
    if (state.showCheckerboard) {
      drawCheckerboard(ctx, cssW, cssH)
    } else {
      ctx.fillStyle = '#14142b'
      ctx.fillRect(0, 0, cssW, cssH)
    }

    // 无图片 → 空画布
    if (!state.originalImageData) return

    // 对比模式
    if (state.viewMode === 'compare' && state.effectImageData) {
      drawCompareView(
        ctx,
        state.originalImageData,
        state.effectImageData,
        cssW, cssH,
        state.comparePosition,
        state.zoom,
        state.offsetX,
        state.offsetY,
      )
      return
    }

    // 普通模式：原图或效果图
    const imgData = state.viewMode === 'original'
      ? state.originalImageData
      : state.effectImageData

    if (!imgData) return

    drawImageDataCentered(
      ctx, imgData, cssW, cssH,
      state.zoom, state.offsetX, state.offsetY,
    )
  }, [canvasRef, state])

  // 状态变化时重绘
  useEffect(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = requestAnimationFrame(render)
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [render])

  // 窗口大小变化时重绘
  useEffect(() => {
    const handleResize = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = requestAnimationFrame(render)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [render])

  return { render }
}
