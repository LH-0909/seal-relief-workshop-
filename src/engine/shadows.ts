/**
 * 双层阴影 — 接触阴影 + 投影阴影
 *
 * 接触阴影：紧贴印章边缘，范围小、颜色深
 * 投影阴影：在光源反方向，范围大、颜色浅、高斯模糊
 *
 * 绘制在背景层之上、侧壁层之下。
 */

/**
 * 阴影参数
 */
export interface ShadowParams {
  contactStrength: number   // 接触阴影强度 0-100，默认 40
  dropStrength: number      // 投影阴影强度 0-100，默认 30
  dropBlur: number          // 投影模糊半径 2-24 px，默认 8
  dropOffsetX: number       // 投影 X 偏移（由光源方向自动计算）
  dropOffsetY: number       // 投影 Y 偏移（由光源方向自动计算）
}

/**
 * 渲染接触阴影 — 紧贴印章边缘的暗带。
 *
 * 用 Sobel 边缘检测 + 小半径高斯模糊 + 暗色叠加。
 * 原地修改 dst。
 */
export function renderContactShadow(
  dst: ImageData,
  mask: Float32Array,
  w: number,
  h: number,
  strength: number,
): void {
  if (strength < 0.5) return

  // 计算边缘强度
  const edge = computeEdgeStrength(mask, w, h)

  // 小半径模糊边缘（3×3 box blur 1 pass）
  const blurred = boxBlur1Pass(edge, w, h, 1)

  const dstData = dst.data
  const s = strength / 100

  for (let i = 0; i < w * h; i++) {
    const e = blurred[i] ?? 0
    if (e < 0.05) continue

    // 接触阴影仅在背景区域绘制
    if ((mask[i] ?? 0) > 0.3) continue

    const alpha = e * s * 0.8
    const si = i * 4
    const existingA = (dstData[si+3] ?? 0) / 255
    const outA = existingA + (1 - existingA) * alpha

    if (outA < 0.01) continue
    // 暗色混合
    const r = 0, g = 0, b = 0
    dstData[si]     = clamp(Math.round(((dstData[si] ?? 0) * existingA + r * alpha) / outA))
    dstData[si + 1] = clamp(Math.round(((dstData[si+1] ?? 0) * existingA + g * alpha) / outA))
    dstData[si + 2] = clamp(Math.round(((dstData[si+2] ?? 0) * existingA + b * alpha) / outA))
    dstData[si + 3] = clamp(Math.round(outA * 255))
  }
}

/**
 * 渲染投影阴影 — 偏移蒙版 + 高斯模糊 + 暗色。
 * 原地修改 dst。
 */
export function renderDropShadow(
  dst: ImageData,
  mask: Float32Array,
  w: number,
  h: number,
  params: ShadowParams,
): void {
  const strength = params.dropStrength
  const blurRadius = Math.max(1, Math.min(24, Math.round(params.dropBlur)))
  if (strength < 0.5) return

  // 偏移蒙版
  const offsetMask = offsetMaskData(mask, w, h, Math.round(params.dropOffsetX), Math.round(params.dropOffsetY))

  // 高斯模糊偏移后的蒙版
  const blurred = gaussianBlurMask(offsetMask, w, h, blurRadius)

  const dstData = dst.data
  const s = strength / 100

  for (let i = 0; i < w * h; i++) {
    const v = blurred[i] ?? 0
    if (v < 0.01) continue

    // 不在原始印章区域绘制投影
    if ((mask[i] ?? 0) > 0.3) continue

    const alpha = v * s * 0.7
    const si = i * 4
    const existingA = (dstData[si+3] ?? 0) / 255
    const outA = Math.min(1, existingA + (1 - existingA) * alpha)

    if (outA < 0.01) continue
    const r = 0, g = 0, b = 0
    dstData[si]     = clamp(Math.round(((dstData[si] ?? 0) * existingA + r * alpha) / outA))
    dstData[si + 1] = clamp(Math.round(((dstData[si+1] ?? 0) * existingA + g * alpha) / outA))
    dstData[si + 2] = clamp(Math.round(((dstData[si+2] ?? 0) * existingA + b * alpha) / outA))
    dstData[si + 3] = clamp(Math.round(outA * 255))
  }
}

/* ── 工具 ── */

/** Sobel 边缘强度 */
function computeEdgeStrength(mask: Float32Array, w: number, h: number): Float32Array {
  const e = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx = Math.abs(
        (mask[(y-1)*w + x+1] ?? 0) - (mask[(y-1)*w + x-1] ?? 0)
        + 2*((mask[y*w + x+1] ?? 0) - (mask[y*w + x-1] ?? 0))
        + (mask[(y+1)*w + x+1] ?? 0) - (mask[(y+1)*w + x-1] ?? 0)
      )
      const gy = Math.abs(
        (mask[(y+1)*w + x-1] ?? 0) - (mask[(y-1)*w + x-1] ?? 0)
        + 2*((mask[(y+1)*w + x] ?? 0) - (mask[(y-1)*w + x] ?? 0))
        + (mask[(y+1)*w + x+1] ?? 0) - (mask[(y-1)*w + x+1] ?? 0)
      )
      e[y*w + x] = Math.min(1, (gx + gy) / 6)
    }
  }
  return e
}

/** 简单 box blur（1 遍） */
function boxBlur1Pass(data: Float32Array, w: number, h: number, radius: number): Float32Array {
  const result = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, cnt = 0
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const sy = y + dy, sx = x + dx
          if (sy >= 0 && sy < h && sx >= 0 && sx < w) {
            sum += data[sy * w + sx] ?? 0
            cnt++
          }
        }
      }
      result[y * w + x] = cnt > 0 ? sum / cnt : 0
    }
  }
  return result
}

/** 偏移蒙版（超出边界视为 0） */
function offsetMaskData(mask: Float32Array, w: number, h: number, ox: number, oy: number): Float32Array {
  const result = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = x - ox
      const sy = y - oy
      if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
        result[y * w + x] = mask[sy * w + sx] ?? 0
      }
    }
  }
  return result
}

/** 对蒙版做可分离高斯模糊 */
function gaussianBlurMask(data: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const radius = Math.ceil(sigma * 3)
  const size = radius * 2 + 1
  const kernel = new Float32Array(size)
  let sum = 0
  for (let i = 0; i < size; i++) {
    const x = i - radius
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma))
    sum += kernel[i] ?? 0
  }
  for (let i = 0; i < size; i++) kernel[i] = (kernel[i] ?? 0) / sum

  const tmp = new Float32Array(w * h)
  // 水平
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0
      for (let k = 0; k < size; k++) {
        const sx = x + k - radius
        if (sx >= 0 && sx < w) v += (data[y*w + sx] ?? 0) * (kernel[k] ?? 0)
      }
      tmp[y*w + x] = v
    }
  }
  // 垂直
  const result = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0
      for (let k = 0; k < size; k++) {
        const sy = y + k - radius
        if (sy >= 0 && sy < h) v += (tmp[sy*w + x] ?? 0) * (kernel[k] ?? 0)
      }
      result[y*w + x] = v
    }
  }
  return result
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v))
}
