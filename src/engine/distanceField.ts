/**
 * 距离场高度图 — Chamfer 双扫描算法
 *
 * 从二值蒙版生成连续的距离场：
 *   - 印章内部像素到最近边缘的距离 → 越靠近中心越高
 *   - 输出归一化到 [0, 1]
 *
 * 与二值蒙版高度图的不同：
 *   二值蒙版: 边缘=0，内部=1（阶梯）
 *   距离场:   边缘=0 → 内部连续递增 → 中心=1（斜面+顶面）
 */

/**
 * 两遍扫描 Chamfer 距离变换（3-4 近似 Euclidean）。
 *
 * Forward pass:  top-left → bottom-right
 * Backward pass: bottom-right → top-left
 *
 * @param mask - 二值蒙版 Float32Array, 1=印章, 0=背景
 * @param w, h - 图像尺寸
 * @returns 有符号距离场（内部正值，外部负值，单位=像素）
 */
export function computeChamferDistance(
  mask: Float32Array,
  w: number,
  h: number,
): Float32Array {
  const n = w * h
  const d = new Float32Array(n)

  const INF = 1e8

  // 初始化：内部=0，外部=INF（或反之用于外部距离）
  for (let i = 0; i < n; i++) {
    d[i] = mask[i]! > 0.5 ? 0 : INF
  }

  // ── Forward pass ──
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      let best = d[i]!

      if (y > 0) {
        const up = d[(y-1)*w + x]! + 1
        if (up < best) best = up
      }
      if (x > 0) {
        const left = d[y*w + (x-1)]! + 1
        if (left < best) best = left
      }
      if (y > 0 && x > 0) {
        const ul = d[(y-1)*w + (x-1)]! + 1.414
        if (ul < best) best = ul
      }
      if (y > 0 && x < w - 1) {
        const ur = d[(y-1)*w + (x+1)]! + 1.414
        if (ur < best) best = ur
      }

      d[i] = best
    }
  }

  // ── Backward pass ──
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x
      let best = d[i]!

      if (y < h - 1) {
        const down = d[(y+1)*w + x]! + 1
        if (down < best) best = down
      }
      if (x < w - 1) {
        const right = d[y*w + (x+1)]! + 1
        if (right < best) best = right
      }
      if (y < h - 1 && x < w - 1) {
        const dr = d[(y+1)*w + (x+1)]! + 1.414
        if (dr < best) best = dr
      }
      if (y < h - 1 && x > 0) {
        const dl = d[(y+1)*w + (x-1)]! + 1.414
        if (dl < best) best = dl
      }

      d[i] = best
    }
  }

  return d
}

/**
 * 从距离场生成高度图。
 *
 * 凸起模式: 距离边缘越远（内部深处）→ 高度越高（1）
 *          height = min(dist / maxDist, 1) * depthScale
 * 凹陷模式: 取反。
 *
 * @param dist - 距离场数组
 * @param mask - 原始蒙版
 * @param mode - 'raise' | 'sink'
 * @param depth - 浮雕深度 0-100
 * @returns 高度图 Float32Array, 范围 [0, 1]
 */
export function distanceToHeightMap(
  dist: Float32Array,
  mask: Float32Array,
  mode: 'raise' | 'sink',
  depth: number,
): Float32Array {
  const n = dist.length
  const hm = new Float32Array(n)
  const depthScale = depth / 100

  // 找到前景区域的最大距离（内部点到边缘的最远距离）
  let maxDist = 1
  for (let i = 0; i < n; i++) {
    if (mask[i]! > 0.5) {
      const d = dist[i]!
      if (d > maxDist) maxDist = d
    }
  }

  // 将距离映射为高度
  const invMax = 1.0 / Math.max(1, maxDist)

  if (mode === 'raise') {
    // 边缘=0，内部越高 → 高斯平滑后形成斜面→顶面
    for (let i = 0; i < n; i++) {
      if (mask[i]! > 0.5) {
        const h = Math.min(1.0, dist[i]! * invMax * 2.0)
        hm[i] = 0.2 + h * 0.8 * depthScale  // 基线 0.2 保证内部一直有高度
      } else {
        hm[i] = 0
      }
    }
  } else {
    // 凹陷：内部=低，背景=高
    for (let i = 0; i < n; i++) {
      if (mask[i]! > 0.5) {
        const h = Math.min(1.0, dist[i]! * invMax * 2.0)
        hm[i] = (1 - 0.2 - h * 0.8) * depthScale
      } else {
        hm[i] = depthScale
      }
    }
  }

  return hm
}
