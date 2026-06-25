import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'

/* ── 类型定义 ── */

export type ViewMode = 'original' | 'effect' | 'compare'
export type ExportFormat = 'png' | 'webp'
export type ExportScale = 1 | 2 | 4

export interface EditorState {
  // 图片数据
  originalImage: HTMLImageElement | null
  originalImageData: ImageData | null
  effectImageData: ImageData | null // 经过浮雕引擎处理后的效果图
  isProcessing: boolean           // 是否正在计算效果

  // 视图
  viewMode: ViewMode
  zoom: number
  offsetX: number
  offsetY: number
  showCheckerboard: boolean
  comparePosition: number // 0-1

  // 上传状态
  uploadError: string | null

  // 导出
  exportFormat: ExportFormat
  exportScale: ExportScale

  // 效果参数（当前仅占位，后续阶段使用）
  params: Record<string, number>
}

export type EditorAction =
  | { type: 'SET_IMAGE'; payload: { image: HTMLImageElement; imageData: ImageData } }
  | { type: 'CLEAR_IMAGE' }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'ZOOM_FIT' }
  | { type: 'SET_OFFSET'; payload: { x: number; y: number } }
  | { type: 'SET_CHECKERBOARD'; payload: boolean }
  | { type: 'SET_COMPARE_POSITION'; payload: number }
  | { type: 'SET_EXPORT_FORMAT'; payload: ExportFormat }
  | { type: 'SET_EXPORT_SCALE'; payload: ExportScale }
  | { type: 'SET_UPLOAD_ERROR'; payload: string | null }
  | { type: 'SET_PARAM'; payload: { key: string; value: number } }
  | { type: 'APPLY_PRESET'; payload: Record<string, number> }
  | { type: 'RESET_PARAMS' }
  | { type: 'SET_EFFECT_IMAGE'; payload: ImageData }

/* ── 初始状态 ── */

const initialState: EditorState = {
  originalImage: null,
  originalImageData: null,
  effectImageData: null,
  isProcessing: false,
  viewMode: 'effect',
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  showCheckerboard: false,
  comparePosition: 0.5,
  uploadError: null,
  exportFormat: 'png',
  exportScale: 1,
  params: {},
}

/* ── Reducer ── */

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_IMAGE':
      return {
        ...state,
        originalImage: action.payload.image,
        originalImageData: action.payload.imageData,
        effectImageData: action.payload.imageData, // 初始效果图 = 原图（加载后立即计算）
        isProcessing: true,
        uploadError: null,
        viewMode: 'effect',
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      }

    case 'CLEAR_IMAGE':
      return {
        ...state,
        originalImage: null,
        originalImageData: null,
        effectImageData: null,
        isProcessing: false,
        uploadError: null,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      }

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.1, Math.min(5, action.payload)) }

    case 'ZOOM_IN':
      return { ...state, zoom: Math.min(5, state.zoom * 1.25) }

    case 'ZOOM_OUT':
      return { ...state, zoom: Math.max(0.1, state.zoom / 1.25) }

    case 'ZOOM_FIT':
      return { ...state, zoom: 1, offsetX: 0, offsetY: 0 }

    case 'SET_OFFSET':
      return { ...state, offsetX: action.payload.x, offsetY: action.payload.y }

    case 'SET_CHECKERBOARD':
      return { ...state, showCheckerboard: action.payload }

    case 'SET_COMPARE_POSITION':
      return { ...state, comparePosition: Math.max(0.05, Math.min(0.95, action.payload)) }

    case 'SET_EXPORT_FORMAT':
      return { ...state, exportFormat: action.payload }

    case 'SET_EXPORT_SCALE':
      return { ...state, exportScale: action.payload }

    case 'SET_UPLOAD_ERROR':
      return { ...state, uploadError: action.payload }

    case 'SET_PARAM':
      return { ...state, params: { ...state.params, [action.payload.key]: action.payload.value } }

    case 'APPLY_PRESET':
      return { ...state, params: { ...action.payload } }

    case 'RESET_PARAMS':
      return { ...state, params: {} }

    case 'SET_EFFECT_IMAGE':
      return { ...state, effectImageData: action.payload, isProcessing: false }

    default:
      return state
  }
}

/* ── Context ── */

const EditorContext = createContext<{
  state: EditorState
  dispatch: Dispatch<EditorAction>
} | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorProvider')
  return ctx
}

export { initialState }
