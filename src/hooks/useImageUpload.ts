import { useCallback, useRef } from 'react'
import { loadImageFromFile, SUPPORTED_EXTENSIONS } from '../engine/image-utils'
import { useEditor } from '../store/editorStore'

/**
 * 图片上传 Hook
 * 返回拖拽事件处理器和文件选择处理器。
 */
export function useImageUpload() {
  const { dispatch } = useEditor()
  const inputRef = useRef<HTMLInputElement | null>(null)

  /** 处理 File 对象 */
  const processFile = useCallback(async (file: File) => {
    try {
      dispatch({ type: 'SET_UPLOAD_ERROR', payload: null })
      const result = await loadImageFromFile(file)
      dispatch({ type: 'SET_IMAGE', payload: { image: result.image, imageData: result.imageData } })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '图片加载失败，请重试。'
      dispatch({ type: 'SET_UPLOAD_ERROR', payload: msg })
    }
  }, [dispatch])

  /** 点击上传 */
  const openFileDialog = useCallback(() => {
    inputRef.current?.click()
  }, [])

  /** 文件选择事件 */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // 重置 input 以允许重复选择同一文件
    e.target.value = ''
  }, [processFile])

  /** 拖拽事件 */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  /** 剪贴板粘贴 */
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item?.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) processFile(file)
        return
      }
    }
  }, [processFile])

  /** 校验文件扩展名 */
  const isValidExtension = (filename: string): boolean => {
    const ext = '.' + filename.split('.').pop()?.toLowerCase()
    return SUPPORTED_EXTENSIONS.includes(ext)
  }

  return {
    inputRef,
    openFileDialog,
    handleFileChange,
    handleDragOver,
    handleDrop,
    handlePaste,
    isValidExtension,
  }
}
