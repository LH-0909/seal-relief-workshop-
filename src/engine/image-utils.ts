/**
 * 图片加载与预处理工具
 * 所有处理均在浏览器本地完成，不上传服务器。
 */

/** 最大输入边长（像素），超出等比缩放以避免浏览器卡死 */
export const MAX_INPUT_DIM = 2048

/** 支持的图片格式 */
export const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

export interface LoadResult {
  image: HTMLImageElement
  imageData: ImageData
  width: number
  height: number
}

/**
 * 从 File 对象加载图片，返回 Image 和 ImageData。
 * 超限时会等比降采样到 MAX_INPUT_DIM 以内。
 */
export async function loadImageFromFile(file: File): Promise<LoadResult> {
  if (!SUPPORTED_TYPES.includes(file.type)) {
    throw new Error(`不支持的图片格式: ${file.type || '未知'}。请上传 PNG / JPG / WebP。`)
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const { width, height } = clampDimensions(img.width, img.height, MAX_INPUT_DIM)
        const imageData = imageToImageData(img, width, height)
        resolve({ image: img, imageData, width, height })
      }
      img.onerror = () => reject(new Error('图片加载失败，文件可能已损坏。'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('文件读取失败。'))
    reader.readAsDataURL(file)
  })
}

/**
 * 从剪贴板 DataTransfer 加载图片
 */
export async function loadImageFromClipboard(dataTransfer: DataTransfer): Promise<LoadResult | null> {
  const files = dataTransfer.files
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file && SUPPORTED_TYPES.includes(file.type)) {
      return loadImageFromFile(file)
    }
  }
  return null
}

/**
 * 按比例缩放尺寸，使最长边不超过 maxDim
 */
export function clampDimensions(
  srcW: number, srcH: number, maxDim: number,
): { width: number; height: number } {
  const longest = Math.max(srcW, srcH)
  if (longest <= maxDim) return { width: srcW, height: srcH }
  const scale = maxDim / longest
  return {
    width: Math.round(srcW * scale),
    height: Math.round(srcH * scale),
  }
}

/**
 * 将 HTMLImageElement 绘制到 OffscreenCanvas 并提取 ImageData
 */
export function imageToImageData(
  img: HTMLImageElement,
  width: number,
  height: number,
): ImageData {
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

/**
 * 从 ImageData 创建 HTMLImageElement（用于预览）
 */
export async function imageDataToImage(imageData: ImageData): Promise<HTMLImageElement> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  const blob = await canvas.convertToBlob({ type: 'image/png' })
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('ImageData 转换失败'))
    img.src = URL.createObjectURL(blob)
  })
}
