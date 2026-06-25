/**
 * Canvas 绘制工具
 * 所有绘制操作均使用原生 Canvas 2D API。
 */

/** 棋盘格参数 */
const CHECKER_SIZE = 16
const CHECKER_COLOR_LIGHT = '#e8e4db'
const CHECKER_COLOR_DARK = '#c4bdb2'

/**
 * 在 Canvas 上绘制棋盘格透明背景
 */
export function drawCheckerboard(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const cols = Math.ceil(width / CHECKER_SIZE)
  const rows = Math.ceil(height / CHECKER_SIZE)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? CHECKER_COLOR_LIGHT : CHECKER_COLOR_DARK
      ctx.fillRect(col * CHECKER_SIZE, row * CHECKER_SIZE, CHECKER_SIZE, CHECKER_SIZE)
    }
  }
}

/**
 * 将 ImageData 绘制到 Canvas 上下文，居中缩放以适应区域。
 * 返回实际绘制的区域 { x, y, w, h }。
 */
export function drawImageDataCentered(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
): { x: number; y: number; w: number; h: number } {
  const imgW = imageData.width * zoom
  const imgH = imageData.height * zoom
  const x = (canvasWidth - imgW) / 2 + offsetX
  const y = (canvasHeight - imgH) / 2 + offsetY

  // 创建临时 canvas 绘制 ImageData
  const temp = new OffscreenCanvas(imageData.width, imageData.height)
  const tempCtx = temp.getContext('2d')!
  tempCtx.putImageData(imageData, 0, 0)

  // 绘制到目标 canvas
  ctx.imageSmoothingEnabled = zoom < 1
  ctx.drawImage(temp as unknown as CanvasImageSource, x, y, imgW, imgH)

  return { x, y, w: imgW, h: imgH }
}

/**
 * 左-右对比：左侧显示 imageA，右侧显示 imageB，中间分割线
 */
export function drawCompareView(
  ctx: CanvasRenderingContext2D,
  imageA: ImageData,
  imageB: ImageData,
  canvasWidth: number,
  canvasHeight: number,
  comparePosition: number, // 0-1，分割线位置比例
  zoom: number,
  offsetX: number,
  offsetY: number,
): void {
  const splitX = Math.round(canvasWidth * comparePosition)

  // 保存上下文
  ctx.save()

  // 绘制左侧（imageA）
  ctx.beginPath()
  ctx.rect(0, 0, splitX, canvasHeight)
  ctx.clip()
  drawImageDataCentered(ctx, imageA, canvasWidth, canvasHeight, zoom, offsetX, offsetY)
  ctx.restore()

  // 绘制右侧（imageB）
  ctx.save()
  ctx.beginPath()
  ctx.rect(splitX, 0, canvasWidth - splitX, canvasHeight)
  ctx.clip()
  drawImageDataCentered(ctx, imageB, canvasWidth, canvasHeight, zoom, offsetX, offsetY)
  ctx.restore()

  // 分割线
  ctx.strokeStyle = '#c0392b'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(splitX, 0)
  ctx.lineTo(splitX, canvasHeight)
  ctx.stroke()

  // 分割线手柄
  const handleY = canvasHeight / 2
  ctx.fillStyle = '#c0392b'
  ctx.beginPath()
  ctx.arc(splitX, handleY, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f5f0e8'
  ctx.beginPath()
  ctx.arc(splitX, handleY, 5, 0, Math.PI * 2)
  ctx.fill()

  // 左右箭头
  ctx.fillStyle = '#f5f0e8'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('◂', splitX - 4, handleY)
  ctx.fillText('▸', splitX + 4, handleY)
}

/**
 * 设置 Canvas 的 CSS 大小以匹配物理像素（高清屏适配）
 */
export function setupHiDPI(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  cssWidth: number,
  cssHeight: number,
): void {
  const dpr = window.devicePixelRatio || 1
  canvas.width = cssWidth * dpr
  canvas.height = cssHeight * dpr
  canvas.style.width = `${cssWidth}px`
  canvas.style.height = `${cssHeight}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
