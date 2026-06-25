/**
 * 虚拟侧壁层 — 沿光源反方向连续偏移绘制蒙版，模拟印章厚度
 *
 * 原理：
 *   光源从左上来 → 侧壁应在右下可见。
 *   每次偏移蒙版 1px 沿 -lightDir，透明度递减、颜色加深，
 *   绘制在原始印章下方，形成"挤出"的立体感。
 */

/**
 * 侧壁参数
 */
export interface SideWallParams {
  depth: number        // 侧壁深度 2-24 px，默认 10
  darkStrength: number // 侧壁暗化强度 0-100，默认 60
}

/**
 * 绘制虚拟侧壁层到目标 ImageData。
 *
 * 导出为独立函数，不依赖全局状态。
 *
 * @param dst      - 目标 ImageData（已含背景及阴影层，原地修改）
 * @param mask     - 印章蒙版 Float32Array
 * @param w, h     - 图像尺寸
 * @param ldx, ldy - 光源方向（归一化，用于计算反方向即侧壁方向）
 * @param params   - 侧壁参数
 * @param baseR/G/B- 印章基色（侧壁从此颜色暗化）
 */
export function renderSideWalls(
  dst: ImageData,
  mask: Float32Array,
  w: number,
  h: number,
  ldx: number,
  ldy: number,
  params: SideWallParams,
  baseR: number,
  baseG: number,
  baseB: number,
): void {
  const depth = Math.max(2, Math.min(24, Math.round(params.depth)))
  if (depth < 1) return

  const dark = params.darkStrength / 100
  const dstData = dst.data

  // 侧壁方向 = 光源反方向
  const wallDx = -ldx
  const wallDy = -ldy

  // 从远到近逐层绘制（远层先画，近层覆盖）
  for (let step = depth; step >= 1; step--) {
    const ox = Math.round(wallDx * step)
    const oy = Math.round(wallDy * step)

    // 该层的透明度：越远越透明
    const layerAlpha = 1.0 - (step / depth) * 0.85

    // 该层的暗化：越远越暗
    const darkFactor = 1.0 - (step / depth) * dark
    const r = clamp(Math.round(baseR * darkFactor))
    const g = clamp(Math.round(baseG * darkFactor))
    const b = clamp(Math.round(baseB * darkFactor))
    const a = clamp(Math.round(layerAlpha * 255))

    // 逐像素绘制偏移蒙版
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x
        if ((mask[i] ?? 0) < 0.5) continue // 源像素不在印章内

        // 偏移后的位置
        const tx = x + ox
        const ty = y + oy
        if (tx < 0 || tx >= w || ty < 0 || ty >= h) continue

        // 只在背景区域绘制侧壁（印章内部不重叠）
        const ti = ty * w + tx
        if ((mask[ti] ?? 0) > 0.5) continue

        // Alpha 混合
        const si = ti * 4
        const existingA = dstData[si + 3] ?? 0
        const blendA = a / 255
        const outA = existingA + (255 - existingA) * blendA
        if (outA < 1) continue

        const outR = (dstData[si]! * existingA + r * a * (1 - existingA / 255)) / outA
        const outG = (dstData[si+1]! * existingA + g * a * (1 - existingA / 255)) / outA
        const outB = (dstData[si+2]! * existingA + b * a * (1 - existingA / 255)) / outA

        dstData[si]     = clamp(Math.round(outR))
        dstData[si + 1] = clamp(Math.round(outG))
        dstData[si + 2] = clamp(Math.round(outB))
        dstData[si + 3] = clamp(Math.round(outA))
      }
    }
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v))
}
