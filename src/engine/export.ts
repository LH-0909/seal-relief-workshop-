/**
 * 导出工具 — 将效果图导出为 PNG 或 WebP。
 * 所有操作在浏览器本地完成。
 */

export type ExportFormat = 'png' | 'webp'
export type ExportScale = 1 | 2 | 4

/**
 * 导出 ImageData 为下载文件。
 *
 * @param imageData - 要导出的图像数据
 * @param format - 导出格式
 * @param scale - 导出倍率（基于 imageData 原始尺寸）
 * @param filename - 下载文件名（不含扩展名）
 */
export async function exportImage(
  imageData: ImageData,
  format: ExportFormat,
  scale: ExportScale,
  filename: string = 'seal-relief',
): Promise<void> {
  const targetW = imageData.width * scale
  const targetH = imageData.height * scale

  const canvas = new OffscreenCanvas(targetW, targetH)
  const ctx = canvas.getContext('2d')!

  // 设置透明背景
  ctx.clearRect(0, 0, targetW, targetH)

  if (scale === 1) {
    // 1x: 直接绘制，无需缩放
    ctx.putImageData(imageData, 0, 0)
  } else {
    // 2x/4x: 先绘制到临时 canvas，再缩放绘制
    // 使用 imageSmoothingEnabled 保持像素风格
    const temp = new OffscreenCanvas(imageData.width, imageData.height)
    const tempCtx = temp.getContext('2d')!
    tempCtx.putImageData(imageData, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(temp as unknown as CanvasImageSource, 0, 0, targetW, targetH)
  }

  const mimeType = format === 'webp' ? 'image/webp' : 'image/png'
  const blob = await canvas.convertToBlob({ type: mimeType, quality: 1.0 })

  // 触发浏览器下载
  const ext = format === 'webp' ? 'webp' : 'png'
  const scaleLabel = scale > 1 ? `_${scale}x` : ''
  downloadBlob(blob, `${filename}${scaleLabel}.${ext}`)
}

/**
 * 触发浏览器下载 Blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
