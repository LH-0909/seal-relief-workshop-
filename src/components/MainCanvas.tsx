import { useCallback, useEffect, useRef, useState } from 'react'
import placeholderSeal from '../assets/placeholder-seal.svg'
import { useCanvasRenderer } from '../hooks/useCanvasRenderer'
import { useImageUpload } from '../hooks/useImageUpload'
import { useEditor, type ViewMode } from '../store/editorStore'

export default function MainCanvas() {
  const { state, dispatch } = useEditor()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { inputRef, openFileDialog, handleFileChange, handleDragOver, handleDrop } = useImageUpload()

  useCanvasRenderer(canvasRef)

  const hasImage = state.originalImageData !== null
  const [isDragging, setIsDragging] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  const handleCompareMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      dispatch({ type: 'SET_COMPARE_POSITION', payload: x / rect.width })
    }
    const handleUp = () => setIsDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging, dispatch])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -1 : 1
    if (delta > 0) dispatch({ type: 'ZOOM_IN' })
    else dispatch({ type: 'ZOOM_OUT' })
  }, [dispatch])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault()
      setIsPanning(true)
      panStart.current = { x: e.clientX, y: e.clientY, ox: state.offsetX, oy: state.offsetY }
    }
  }, [state.offsetX, state.offsetY])

  useEffect(() => {
    if (!isPanning) return
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      dispatch({ type: 'SET_OFFSET', payload: { x: panStart.current.ox + dx, y: panStart.current.oy + dy } })
    }
    const handleUp = () => setIsPanning(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isPanning, dispatch])

  const handleViewMode = (mode: ViewMode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode })

  return (
    <main className="canvas-stage">
      <div className="canvas-heading">
        <div>
          <p className="section-kicker">工作台</p>
          <h2>当前印章预览</h2>
        </div>
        <div className="segmented-control" aria-label="预览模式">
          {([
            ['original', '原图'],
            ['effect', '效果图'],
            ['compare', '对比'],
          ] as [ViewMode, string][]).map(([mode, label]) => (
            <button
              key={mode}
              className={state.viewMode === mode ? 'active' : ''}
              onClick={() => handleViewMode(mode)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="canvas-outer">
        <div
          ref={containerRef}
          className="canvas-viewport"
          onDragOver={hasImage ? undefined : handleDragOver}
          onDrop={hasImage ? undefined : handleDrop}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          style={{ cursor: isPanning ? 'grabbing' : hasImage ? 'grab' : 'default' }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="canvas-aura" aria-hidden="true" />
          <canvas ref={canvasRef} className="render-canvas" />

          {hasImage && state.viewMode === 'compare' && (
            <div
              className="compare-line"
              style={{ left: String(state.comparePosition * 100) + '%' }}
              onMouseDown={handleCompareMouseDown}
            >
              <div className="compare-line__bar" />
              <div className="compare-handle">
                <span>↔</span>
              </div>
            </div>
          )}

          {!hasImage && (
            <div
              className="empty-canvas-state"
              onClick={openFileDialog}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="empty-seal-card">
                <img src={placeholderSeal} alt="印章占位图" draggable={false} />
              </div>
              <div className="empty-copy">
                <p>拖拽或点击上传印章图片</p>
                <span>PNG · JPG · WebP，最大 2048px</span>
              </div>
            </div>
          )}

          {state.uploadError && !hasImage && (
            <div className="canvas-error">{state.uploadError}</div>
          )}
        </div>
      </div>

      <div className="canvas-toolbar">
        <div className="tool-cluster">
          <button className="tool-button" type="button" title="缩小" aria-label="缩小" onClick={() => dispatch({ type: 'ZOOM_OUT' })}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <span className="zoom-readout">{Math.round(state.zoom * 100)}%</span>
          <button className="tool-button" type="button" title="放大" aria-label="放大" onClick={() => dispatch({ type: 'ZOOM_IN' })}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <span className="toolbar-separator" />
          <button className="tool-button" type="button" title="适应画布" aria-label="适应画布" onClick={() => dispatch({ type: 'ZOOM_FIT' })}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
          <button
            className={'tool-button ' + (state.showCheckerboard ? 'active' : '')}
            type="button"
            title="棋盘格背景"
            aria-label="棋盘格背景"
            onClick={() => dispatch({ type: 'SET_CHECKERBOARD', payload: !state.showCheckerboard })}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
        </div>
        <p className="canvas-hint">按住 Ctrl / Cmd 滚轮缩放，中键拖动画布</p>
      </div>
    </main>
  )
}
