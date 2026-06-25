import { useState } from 'react'
import { PRESETS, getPresetById } from '../engine/presets'
import { useImageUpload } from '../hooks/useImageUpload'
import { useEditor } from '../store/editorStore'


export default function LeftPanel() {
  const { state, dispatch } = useEditor()
  const { inputRef, openFileDialog, handleFileChange, handleDragOver, handleDrop } = useImageUpload()
  const [selectedPreset, setSelectedPreset] = useState('2.5d')
  const hasImage = state.originalImageData !== null

  const handlePresetClick = (presetId: string) => {
    setSelectedPreset(presetId)
    const preset = getPresetById(presetId)
    if (preset) {
      dispatch({ type: 'APPLY_PRESET', payload: preset.params })
    }
  }

  return (
    <aside className="editor-panel left-panel">
      <div className="panel-scroll">
        <section className="paper-card upload-card">
          <div className="panel-title-row">
            <div>
              <p className="section-kicker">素材</p>
              <h2 className="section-heading">印章图像</h2>
            </div>
            {hasImage && (
              <button className="mini-link" type="button" onClick={() => dispatch({ type: 'CLEAR_IMAGE' })}>
                清空
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="upload-zone" onClick={openFileDialog} onDragOver={handleDragOver} onDrop={handleDrop}>
            {hasImage ? (
              <>
                <div className="upload-thumb">
                  {state.originalImage && <img src={state.originalImage.src} alt="当前上传印章缩略图" />}
                </div>
                <p className="upload-title">图片已载入</p>
                <p className="upload-note">点击或拖入新图片重新上传</p>
              </>
            ) : (
              <>
                <span className="upload-icon" aria-hidden="true">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12" />
                    <path d="m7 8 5-5 5 5" />
                    <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
                  </svg>
                </span>
                <p className="upload-title">拖拽或点击上传印章</p>
                <p className="upload-note">支持 PNG / JPG / JPEG / WebP，本地处理</p>
              </>
            )}
          </div>

          {state.uploadError && <div className="upload-error">{state.uploadError}</div>}

          {hasImage && (
            <div className="image-meta">
              <span>{state.originalImageData!.width} × {state.originalImageData!.height} px</span>
              <span className="status-dot" />
            </div>
          )}
        </section>

        <section className="panel-group">
          <div className="panel-title-row">
            <div>
              <p className="section-kicker">Presets</p>
              <h2 className="section-heading">印章材质预设</h2>
            </div>
          </div>

          <div className="preset-list">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                className={'preset-card ' + (selectedPreset === preset.id ? 'active' : '')}
                onClick={() => handlePresetClick(preset.id)}
                type="button"
              >
                <span className="preset-mark">{preset.icon}</span>
                <span>
                  <strong>{preset.label}</strong>
                  <small>{preset.desc}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="workflow-card">
          <p className="section-kicker">Flow</p>
          <div className="workflow-grid">
            {['载入', '预设', '微调', '导出'].map((step, index) => (
              <div className="workflow-step" key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  )
}
