import ExportButton from './workbench/ExportButton'
import { useEditor, type ExportFormat, type ExportScale } from '../store/editorStore'

function ParamSlider({ label, value, min, max, step, unit, onChange }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="slider-field">
      <div className="slider-label-row">
        <label>{label}</label>
        <span className="slider-value">{value}{unit ?? ''}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        className="range-input"
        style={{
          background: 'linear-gradient(to right, var(--seal-red) 0%, var(--seal-red) ' + pct + '%, rgba(244,235,216,0.16) ' + pct + '%, rgba(244,235,216,0.16) 100%)',
        }}
      />
    </div>
  )
}

function InspectorSection({ title, summary, children, open = true }: {
  title: string
  summary?: string
  children: React.ReactNode
  open?: boolean
}) {
  return (
    <details className="inspector-section" open={open}>
      <summary>
        <span>{title}</span>
        <small>{summary}</small>
      </summary>
      <div className="inspector-body">{children}</div>
    </details>
  )
}

const directions = ['左上', '上', '右上', '左', '右', '左下', '下', '右下']

export default function RightPanel() {
  const { state, dispatch } = useEditor()
  const mode = (state.params.reliefMode ?? 0) === 1 ? 'sink' as const : 'raise' as const
  const getParam = (key: string, fallback: number) => state.params[key] ?? fallback
  const setParam = (key: string, value: number) => dispatch({ type: 'SET_PARAM', payload: { key, value } })
  const setMode = (value: 'raise' | 'sink') => setParam('reliefMode', value === 'sink' ? 1 : 0)

  return (
    <aside className="editor-panel right-panel">
      <div className="panel-scroll">
        <div className="panel-title-row">
          <div>
            <p className="section-kicker">Parameters</p>
            <h2 className="section-heading">参数与材质</h2>
          </div>
        </div>

        <InspectorSection title="浮雕结构" summary="高度、柔化、保真">
          <div className="mode-toggle" aria-label="浮雕模式">
            <button className={mode === 'raise' ? 'active' : ''} onClick={() => setMode('raise')} type="button">凸起</button>
            <button className={mode === 'sink' ? 'active' : ''} onClick={() => setMode('sink')} type="button">凹陷</button>
          </div>
          <ParamSlider label="浮雕深度" value={getParam('depth', 50)} min={0} max={100} step={1} unit="%" onChange={(v) => setParam('depth', v)} />
          <ParamSlider label="边缘柔化" value={getParam('soften', 30)} min={0} max={100} step={1} unit="%" onChange={(v) => setParam('soften', v)} />
          <ParamSlider label="浮雕融合" value={getParam('reliefBlend', 60)} min={0} max={100} step={1} unit="%" onChange={(v) => setParam('reliefBlend', v)} />
          <ParamSlider label="原图保留度" value={getParam('fidelity', 100)} min={0} max={100} step={1} unit="%" onChange={(v) => setParam('fidelity', v)} />
          <p className="inspector-note">保真模式会保留印文轮廓和透明边界，只叠加高度、光照和阴影。</p>
        </InspectorSection>

        {getParam('renderMode', 0) === 1 && (
          <InspectorSection title="侧壁与立体" summary="2.5D 厚度" open={false}>
            <ParamSlider label="立体等级" value={getParam('stereoLevel', 1)} min={0} max={2} step={1} onChange={(v) => setParam('stereoLevel', v)} />
            <ParamSlider label="侧壁深度" value={getParam('sidewallDepth', 10)} min={2} max={24} step={1} unit="px" onChange={(v) => setParam('sidewallDepth', v)} />
            <ParamSlider label="侧壁暗化" value={getParam('sidewallDark', 60)} min={0} max={100} step={1} unit="%" onChange={(v) => setParam('sidewallDark', v)} />
            <ParamSlider label="接触阴影" value={getParam('contactShadow', 40)} min={0} max={100} step={1} unit="%" onChange={(v) => setParam('contactShadow', v)} />
            <ParamSlider label="投影阴影" value={getParam('dropShadow', 30)} min={0} max={100} step={1} unit="%" onChange={(v) => setParam('dropShadow', v)} />
            <ParamSlider label="投影模糊" value={getParam('dropBlur', 8)} min={2} max={24} step={1} unit="px" onChange={(v) => setParam('dropBlur', v)} />
            <ParamSlider label="顶面光照" value={getParam('topLightIntensity', 45)} min={0} max={100} step={1} unit="%" onChange={(v) => setParam('topLightIntensity', v)} />
            <p className="inspector-note">轮廓保护会尽量避免侧壁处理破坏原始印文边界。</p>
          </InspectorSection>
        )}

        <InspectorSection title="光照与阴影" summary="方向、高度、高光">
          <label className="control-label">光源方向</label>
          <div className="direction-grid">
            {directions.map((label, index) => (
              <button
                key={label}
                className={'direction-button ' + (getParam('lightDir', 0) === index ? 'active' : '')}
                onClick={() => setParam('lightDir', index)}
                title={label}
                type="button"
              >
                {index === 4 ? '·' : '◆'}
              </button>
            ))}
          </div>
          <ParamSlider label="光照高度" value={getParam('lightHeight', 45)} min={0} max={90} step={1} unit="°" onChange={(v) => setParam('lightHeight', v)} />
          <ParamSlider label="阴影强度" value={getParam('shadow', 35)} min={0} max={100} step={1} unit="%" onChange={(v) => setParam('shadow', v)} />
          <ParamSlider label="高光强度" value={getParam('specular', 25)} min={0} max={100} step={1} unit="%" onChange={(v) => setParam('specular', v)} />
        </InspectorSection>

        <InspectorSection title="颗粒与磨损" summary="朱砂质感" open={false}>
          <ParamSlider label="颗粒强度" value={getParam('grain', 15)} min={0} max={100} step={1} unit="%" onChange={(v) => setParam('grain', v)} />
          <ParamSlider label="磨损强度" value={getParam('wear', 10)} min={0} max={100} step={1} unit="%" onChange={(v) => setParam('wear', v)} />
          <ParamSlider label="纹理强度" value={getParam('texture', 40)} min={0} max={100} step={1} unit="%" onChange={(v) => setParam('texture', v)} />
        </InspectorSection>

        <InspectorSection title="背景与材质" summary="导出底色" open={false}>
          <label className="control-label">背景类型</label>
          <select value={getParam('bgType', 0)} onChange={(event) => setParam('bgType', parseFloat(event.target.value))} className="control-select">
            <option value={0}>透明背景</option>
            <option value={1}>宣纸底色</option>
            <option value={2}>深色背景</option>
            <option value={3}>纯白背景</option>
          </select>

          <label className="control-label">印章颜色</label>
          <div className="color-row">
            <input
              type="color"
              value="#9B2D20"
              onChange={(event) => setParam('sealColor', parseInt(event.target.value.slice(1), 16))}
              className="color-swatch"
            />
            <span>#9B2D20</span>
          </div>
        </InspectorSection>
      </div>

      <div className="export-dock">
        <div>
          <p className="section-kicker">Export</p>
          <h3>导出浮雕印章</h3>
        </div>
        <div className="export-options">
          <select
            value={state.exportFormat}
            onChange={(event) => dispatch({ type: 'SET_EXPORT_FORMAT', payload: event.target.value as ExportFormat })}
            className="control-select"
            aria-label="导出格式"
          >
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
          <select
            value={state.exportScale}
            onChange={(event) => dispatch({ type: 'SET_EXPORT_SCALE', payload: Number(event.target.value) as ExportScale })}
            className="control-select"
            aria-label="导出倍率"
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>
        <ExportButton className="w-full" label="导出作品" />
        <button className="btn-secondary w-full" type="button" onClick={() => dispatch({ type: 'RESET_PARAMS' })}>重置参数</button>
      </div>
    </aside>
  )
}
