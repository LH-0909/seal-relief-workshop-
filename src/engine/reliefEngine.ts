/**
 * 印章浮雕效果引擎
 *
 * 两种工作模式：
 *   - 保真模式（fidelityMode=true）：原图不可修改，光照作为叠加层混合。
 *        Alpha 通道原样保留，不腐蚀边缘，颗粒仅叠加 RGB。
 *   - 经典模式（fidelityMode=false）：光照直接调制印章颜色 + 边缘效果。
 *
 * 纯 Canvas 像素处理管线：
 *   蒙版提取 → 高度图 → 高斯模糊 → Sobel 法线 → Phong 光照 → 保真融合 / 经典融合
 *
 * 所有运算在 Float32Array 上完成，不依赖 GPU / WebGL / 后端。
 */

/* ── 类型 ── */

export interface ReliefParams {
  mode: 'raise' | 'sink'       // 凸起浮雕 / 凹陷压印
  depth: number                // 浮雕深度 0-100
  soften: number               // 边缘柔化 0-100
  lightDir: number             // 光照方向索引 0-7
  lightHeight: number          // 光源高度角 0-90（度）
  shadow: number               // 阴影强度 0-100
  specular: number             // 高光强度 0-100
  grain: number                // 颗粒强度 0-100（保真模式下仅影响 RGB）
  wear: number                 // 磨损强度 0-100（保真模式下强制禁用）
  fidelityMode: boolean        // 是否启用保真浮雕模式
  fidelity: number             // 原图保留度 0-100
  reliefBlend: number          // 浮雕融合强度 0-100
}

/** 光照方向映射（同 RightPanel 罗盘布局，左上到右下） */
const LIGHT_DIRS: [number, number][] = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
  [-1,  1], [0,  1], [1,  1],
]

/** 内部处理分辨率上限（预览用，超出先降采样再升采样） */
export const PREVIEW_MAX_DIM = 512

/* ═══════════════════════════════════════════════════════
 * 主入口
 * ═══════════════════════════════════════════════════════ */

/**
 * 对印章 ImageData 执行完整浮雕管线。
 *
 * @param imageData - 原始印章 RGBA 数据
 * @param params   - 用户可调参数
 * @param maxDim   - 处理分辨率上限（预览 512，导出 4096）
 * @returns 处理后的 RGBA ImageData（尺寸与 imageData 一致）
 */
export function processReliefFull(
  imageData: ImageData,
  params: ReliefParams,
  maxDim: number = PREVIEW_MAX_DIM,
  bgType: number = 0,
  textureStr: number = 0,
): ImageData {
  const srcW = imageData.width
  const srcH = imageData.height

  // ── 分辨率策略 ──
  const longest = Math.max(srcW, srcH)
  const needDownscale = longest > maxDim
  const workW = needDownscale ? Math.round(srcW * maxDim / longest) : srcW
  const workH = needDownscale ? Math.round(srcH * maxDim / longest) : srcH

  let workData = imageData
  if (needDownscale) {
    workData = downsampleImageData(imageData, workW, workH)
  }

  const w = workData.width
  const h = workData.height

  // Step 1: 蒙版提取
  const mask = createSealMask(workData)

  // Step 2: 高度图生成
  let hm = createHeightMap(mask, params)

  // 高度图高斯模糊（可分离，边缘柔化参数映射）
  const blurSigma = (params.soften / 100) * 4.0
  if (blurSigma > 0.1) {
    hm = applyGaussianBlur(hm, w, h, blurSigma)
  }

  // Step 3: 光照计算（Sobel 法线 + Phong）
  const shading = computeShading(hm, params, w, h)

  // Step 4: 颜色融合（光照 × 印章颜色）
  let result: ImageData
  if (params.fidelityMode) {
    // ── 保真浮雕：光照叠加层混合，Alpha 原样保留 ──
    result = blendFidelity(workData, shading, mask, params)
    // Step 5: 颗粒仅叠加 RGB（不改 alpha），磨损强制跳过
    if ((params.grain ?? 0) > 0.5) {
      result = applyGrainRGBOnly(result, mask, shading, params)
    }
  } else {
    // ── 经典模式：直接调制 + 完整边缘效果 ──
    result = blendColor(workData, shading, mask)
    result = applyEdgeEffects(result, mask, shading, params)
  }

  // Step 6: 背景合成（宣纸纹理等）
  if (bgType === 1) {
    result = compositePaperBackground(result, mask, w, h, textureStr)
  } else if (bgType === 3) {
    result = compositeSolidBackground(result, [255, 255, 255, 255])
  } else if (bgType === 2) {
    result = compositeSolidBackground(result, [20, 20, 40, 255])
  }

  // 升采样回原始尺寸
  if (needDownscale) {
    result = upsampleImageData(result, srcW, srcH)
  }

  return result
}

/* ═══════════════════════════════════════════════════════
 * Step 1: 蒙版提取
 * ═══════════════════════════════════════════════════════ */

/**
 * 提取印章主体蒙版（Float32Array, 0=背景, 1=印章）。
 *
 * 策略：
 *   - PNG 有 alpha 通道 → 用 alpha 做蒙版
 *   - JPG 白底红印   → 用红色度 + 自适应阈值
 */
function createSealMask(img: ImageData): Float32Array {
  const w = img.width
  const h = img.height
  const d = img.data
  const n = w * h
  const mask = new Float32Array(n)

  // 检测是否有有效 alpha 通道
  let hasAlpha = false
  for (let i = 3; i < d.length && i < 4000; i += 4) {
    if ((d[i] ?? 255) < 250) { hasAlpha = true; break }
  }

  if (hasAlpha) {
    for (let i = 0; i < n; i++) {
      mask[i] = (d[i * 4 + 3] ?? 255) > 30 ? 1.0 : 0.0
    }
  } else {
    // 红色度提取（模拟 YCrCb Cr + R-G + R-B）
    const rednesses = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const r = d[i * 4] ?? 255
      const g = d[i * 4 + 1] ?? 255
      const b = d[i * 4 + 2] ?? 255
      rednesses[i] = Math.max(0, (r - g) / 255 * 0.4 + (r - b) / 255 * 0.4 + ((r - (g + b) / 2) / 255) * 0.2)
    }
    // 自适应阈值
    const sorted = new Float32Array(rednesses)
    sorted.sort()
    const p70 = sorted[Math.floor(n * 0.70)] ?? 0.15
    const threshold = Math.max(0.04, Math.min(0.25, p70 * 0.3))
    for (let i = 0; i < n; i++) {
      mask[i] = (rednesses[i] ?? 0) > threshold ? 1.0 : 0.0
    }
  }

  return mask
}

/* ═══════════════════════════════════════════════════════
 * Step 2: 高度图
 * ═══════════════════════════════════════════════════════ */

/** 从蒙版创建高度图，凸起/凹陷由 mode + depth 控制 */
function createHeightMap(mask: Float32Array, params: ReliefParams): Float32Array {
  const n = mask.length
  const hm = new Float32Array(n)
  const depth = params.depth / 100

  if (params.mode === 'raise') {
    for (let i = 0; i < n; i++) hm[i] = (mask[i] ?? 0) * depth
  } else {
    for (let i = 0; i < n; i++) hm[i] = (1 - (mask[i] ?? 0)) * depth
  }

  return hm
}

/** 可分离高斯模糊（水平 + 垂直），原地修改并返回新数组 */
export function gaussianBlur2D(data: Float32Array, w: number, h: number, sigma: number): Float32Array {
  return applyGaussianBlur(data, w, h, sigma)
}

/** 可分离高斯模糊内部实现 */
function applyGaussianBlur(data: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const result = new Float32Array(data)
  if (sigma < 0.1) return result

  const kRadius = Math.ceil(sigma * 3)
  const kSize = kRadius * 2 + 1
  const kernel = new Float32Array(kSize)
  let sum = 0
  for (let i = 0; i < kSize; i++) {
    const x = i - kRadius
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma))
    sum += kernel[i] ?? 0
  }
  for (let i = 0; i < kSize; i++) kernel[i] = (kernel[i] ?? 0) / sum

  const tmp = new Float32Array(w * h)

  // 水平 pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let val = 0
      for (let k = 0; k < kSize; k++) {
        const sx = x + k - kRadius
        if (sx >= 0 && sx < w) val += (data[y * w + sx] ?? 0) * (kernel[k] ?? 0)
      }
      tmp[y * w + x] = val
    }
  }
  // 垂直 pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let val = 0
      for (let k = 0; k < kSize; k++) {
        const sy = y + k - kRadius
        if (sy >= 0 && sy < h) val += (tmp[sy * w + x] ?? 0) * (kernel[k] ?? 0)
      }
      result[y * w + x] = val
    }
  }

  return result
}

/* ═══════════════════════════════════════════════════════
 * Step 3: 光照计算（Sobel 梯度 + Phong/Blinn-Phong）
 * ═══════════════════════════════════════════════════════ */

/** 从高度图计算逐像素光照强度 shading ∈ [0, 1] */
function computeShading(
  hm: Float32Array,
  params: ReliefParams,
  w: number,
  h: number,
): Float32Array {
  const n = w * h
  const shading = new Float32Array(n)

  // 光源方向（方向角 + 高度角 → 3D 向量）
  const dir2d = LIGHT_DIRS[params.lightDir] ?? [-1, -1]
  const hRad = (params.lightHeight / 90) * Math.PI / 2
  const lx = dir2d[0]! * Math.cos(hRad)
  const ly = dir2d[1]! * Math.cos(hRad)
  const lz = Math.sin(hRad)
  const lLen = Math.sqrt(lx * lx + ly * ly + lz * lz)
  const Lx = lx / lLen
  const Ly = ly / lLen
  const Lz = lz / lLen

  const depthScale = 0.5 + (params.depth / 100) * 2.0
  const ambient = 0.2
  const diffuseStr = 0.8
  const specStr = params.specular / 100
  const shadowStr = params.shadow / 100

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x

      // Sobel 梯度
      const gx = (
        -(hm[(y-1)*w + x-1] ?? 0) + (hm[(y-1)*w + x+1] ?? 0)
        - 2*(hm[y*w + x-1] ?? 0) + 2*(hm[y*w + x+1] ?? 0)
        -(hm[(y+1)*w + x-1] ?? 0) + (hm[(y+1)*w + x+1] ?? 0)
      )
      const gy = (
        -(hm[(y-1)*w + x-1] ?? 0) - 2*(hm[(y-1)*w + x] ?? 0) - (hm[(y-1)*w + x+1] ?? 0)
        + (hm[(y+1)*w + x-1] ?? 0) + 2*(hm[(y+1)*w + x] ?? 0) + (hm[(y+1)*w + x+1] ?? 0)
      )

      // 法线 N = normalize([-gx*scale, -gy*scale, 1])
      const nx = -gx * depthScale
      const ny = -gy * depthScale
      const nz = 1.0
      const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz)
      const Nx = nx / nLen
      const Ny = ny / nLen
      const Nz = nz / nLen

      // Diffuse Lambert
      const NdotL = Math.max(0, Nx * Lx + Ny * Ly + Nz * Lz)

      // Specular Blinn-Phong (H = normalize(L + V), V=[0,0,1])
      const hx = Lx
      const hy = Ly
      const hz = Lz + 1
      const hLen2 = Math.sqrt(hx * hx + hy * hy + hz * hz)
      const NdotH = Math.max(0, Nx * hx / hLen2 + Ny * hy / hLen2 + Nz * hz / hLen2)
      const spec = Math.pow(NdotH, 32) * specStr

      // 简易 AO：局部邻域凹陷比例
      let ao = 0.0
      if (shadowStr > 0.01) {
        const center = hm[i] ?? 0
        let lower = 0
        let cnt = 0
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const ni = (y + dy) * w + (x + dx)
            if (ni >= 0 && ni < n) {
              if ((hm[ni] ?? 0) < center) lower++
              cnt++
            }
          }
        }
        ao = (lower / Math.max(1, cnt)) * shadowStr
      }

      let light = ambient + NdotL * diffuseStr + spec - ao
      light = Math.max(0.05, Math.min(1.0, light))
      shading[i] = light
    }
  }

  // 边界像素用最近有效值填充
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
        const nx = Math.min(w - 2, Math.max(1, x))
        const ny = Math.min(h - 2, Math.max(1, y))
        shading[y * w + x] = shading[ny * w + nx] ?? ambient
      }
    }
  }

  return shading
}

/* ═══════════════════════════════════════════════════════
 * Step 4: 颜色融合
 * ═══════════════════════════════════════════════════════ */

/** 将光照强度与印章颜色相乘，印章区域着色，背景透明 */
function blendColor(
  img: ImageData,
  shading: Float32Array,
  mask: Float32Array,
): ImageData {
  const w = img.width
  const h = img.height
  const src = img.data
  const result = new ImageData(w, h)
  const dst = result.data

  for (let i = 0; i < w * h; i++) {
    const si = i * 4
    const light = shading[i] ?? 0.5

    if ((mask[i] ?? 0) > 0.5) {
      dst[si]     = clamp(Math.round((src[si] ?? 0) * light))
      dst[si + 1] = clamp(Math.round((src[si+1] ?? 0) * light))
      dst[si + 2] = clamp(Math.round((src[si+2] ?? 0) * light))
      dst[si + 3] = src[si+3] ?? 255
    } else {
      dst[si]     = 0
      dst[si + 1] = 0
      dst[si + 2] = 0
      dst[si + 3] = 0
    }
  }
  return result
}

/**
 * 保真融合 —— 光照叠加层技术。
 *
 * 核心公式（来自需求规范）：
 *   effectiveLight = 1.0 + (shading - 0.5) * 2 * (reliefBlend / 100)
 *   finalRGB = originalRGB * effectiveLight
 *   finalAlpha = originalAlpha   ← 原样保留，不修改
 *
 * 浮雕融合强度 (reliefBlend): 0% = 原图, 60% = 适度浮雕, 100% = 最强光照。
 * 原图保留度 (fidelity):  0-100, 100 = 保留全部（目前等价于 Alpha 锁定 + 不腐蚀）。
 */
function blendFidelity(
  img: ImageData,
  shading: Float32Array,
  mask: Float32Array,
  params: ReliefParams,
): ImageData {
  const w = img.width
  const h = img.height
  const src = img.data
  const result = new ImageData(w, h)
  const dst = result.data

  // 将 shading [0,1] 转为叠加乘数，中性点 0.5 → 乘数 1.0
  // blend = 1.0 + (shading - 0.5) * 2 * reliefBlend/100
  const blendScale = (params.reliefBlend / 100) * 2

  for (let i = 0; i < w * h; i++) {
    const si = i * 4
    const alpha = src[si + 3] ?? 0

    // 背景像素原样保留（保真模式不改变透明边界）
    if (alpha < 20 || (mask[i] ?? 0) <= 0.5) {
      dst[si]     = src[si]     ?? 0
      dst[si + 1] = src[si + 1] ?? 0
      dst[si + 2] = src[si + 2] ?? 0
      dst[si + 3] = alpha
      continue
    }

    const light = shading[i] ?? 0.5
    // 计算叠加乘数：中性 0.5 时乘数为 1.0（不变），>0.5 变亮，<0.5 变暗
    const multiplier = 1.0 + (light - 0.5) * blendScale
    // 防溢出：限制在 [0.4, 2.0] 避免极端
    const safeMult = Math.max(0.4, Math.min(2.0, multiplier))

    dst[si]     = clamp(Math.round((src[si] ?? 0) * safeMult))
    dst[si + 1] = clamp(Math.round((src[si+1] ?? 0) * safeMult))
    dst[si + 2] = clamp(Math.round((src[si+2] ?? 0) * safeMult))
    dst[si + 3] = alpha  // ← Alpha 原样保留，不修改
  }

  return result
}

/** 保真模式下的颗粒：仅叠加 RGB 颜色纹理，不修改 Alpha */
function applyGrainRGBOnly(
  img: ImageData,
  mask: Float32Array,
  shading: Float32Array,
  params: ReliefParams,
): ImageData {
  const w = img.width
  const h = img.height
  const grainAmount = params.grain / 100
  if (grainAmount < 0.01) return img

  const dst = new ImageData(w, h)
  const srcData = img.data
  const dstData = dst.data

  // 边缘强度
  const edgeStr = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      edgeStr[i] = Math.min(1.0, (
        Math.abs((mask[(y-1)*w + x+1] ?? 0) - (mask[(y-1)*w + x-1] ?? 0)) +
        Math.abs((mask[(y+1)*w + x+1] ?? 0) - (mask[(y+1)*w + x-1] ?? 0))
      ) / 2.0)
    }
  }

  const rand = (x: number, y: number, seed: number): number => {
    const v = Math.sin(x * 12.9898 + y * 78.233 + seed * 437.585) * 43758.5453
    return v - Math.floor(v)
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const si = i * 4
      const edge = edgeStr[i] ?? 0
      const light = shading[i] ?? 0.5
      const alpha = srcData[si+3] ?? 0

      // 复制原始像素
      dstData[si]     = srcData[si]     ?? 0
      dstData[si + 1] = srcData[si + 1] ?? 0
      dstData[si + 2] = srcData[si + 2] ?? 0
      dstData[si + 3] = alpha  // ← Alpha 不动

      // 仅在边缘区域叠加轻微 RGB 颗粒（暗面加强）
      if (edge > 0.1 && alpha > 20) {
        const r = rand(x, y, 1)
        const gs = edge * grainAmount * 0.06  // 保真模式颗粒强度减半
        const darkBias = 1 - light
        const grain = (r - 0.5) * gs * (0.3 + darkBias * 0.7)
        dstData[si]     = clamp(Math.round((dstData[si]     ?? 0) + grain * 255))
        dstData[si + 1] = clamp(Math.round((dstData[si + 1] ?? 0) + grain * 255))
        dstData[si + 2] = clamp(Math.round((dstData[si + 2] ?? 0) + grain * 255))
        // Alpha 不修改
      }
    }
  }

  return dst
}

/* ═══════════════════════════════════════════════════════
 * Step 5: 边缘颗粒与磨损（经典模式）
 * ═══════════════════════════════════════════════════════ */

/** 在印章边缘叠加颗粒纹理和轻微磨损 */
function applyEdgeEffects(
  img: ImageData,
  mask: Float32Array,
  shading: Float32Array,
  params: ReliefParams,
): ImageData {
  const w = img.width
  const h = img.height
  const grainAmount = params.grain / 100
  const wearAmount = params.wear / 100

  if (grainAmount < 0.01 && wearAmount < 0.01) return img

  const dst = new ImageData(w, h)
  const srcData = img.data
  const dstData = dst.data

  // 用 Sobel 近似边缘强度
  const edgeStr = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const gx = Math.abs(
        (mask[(y-1)*w + x+1] ?? 0) - (mask[(y-1)*w + x-1] ?? 0)
        + 2 * ((mask[y*w + x+1] ?? 0) - (mask[y*w + x-1] ?? 0))
        + (mask[(y+1)*w + x+1] ?? 0) - (mask[(y+1)*w + x-1] ?? 0)
      )
      const gy = Math.abs(
        (mask[(y+1)*w + x-1] ?? 0) - (mask[(y-1)*w + x-1] ?? 0)
        + 2 * ((mask[(y+1)*w + x] ?? 0) - (mask[(y-1)*w + x] ?? 0))
        + (mask[(y+1)*w + x+1] ?? 0) - (mask[(y-1)*w + x+1] ?? 0)
      )
      edgeStr[i] = Math.min(1.0, (gx + gy) / 3.0)
    }
  }

  // 确定性伪随机（坐标哈希，避免雪花感）
  const rand = (x: number, y: number, seed: number): number => {
    const v = Math.sin(x * 12.9898 + y * 78.233 + seed * 437.585) * 43758.5453
    return v - Math.floor(v)
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const si = i * 4
      const edge = edgeStr[i] ?? 0
      const light = shading[i] ?? 0.5

      // 复制原始像素
      dstData[si]     = srcData[si]     ?? 0
      dstData[si + 1] = srcData[si + 1] ?? 0
      dstData[si + 2] = srcData[si + 2] ?? 0
      dstData[si + 3] = srcData[si + 3] ?? 0

      // 颗粒（边缘区域，暗面加强）
      if (edge > 0.1 && grainAmount > 0.01) {
        const r = rand(x, y, 1)
        const gs = edge * grainAmount * 0.15
        const darkBias = 1 - light
        const grain = (r - 0.5) * gs * (0.5 + darkBias * 0.5)
        dstData[si]     = clamp(Math.round((dstData[si]     ?? 0) + grain * 255))
        dstData[si + 1] = clamp(Math.round((dstData[si + 1] ?? 0) + grain * 255))
        dstData[si + 2] = clamp(Math.round((dstData[si + 2] ?? 0) + grain * 255))
      }

      // 磨损（边缘概率性降低 alpha）
      if (edge > 0.3 && wearAmount > 0.01) {
        const r2 = rand(x, y, 2)
        if (r2 < edge * wearAmount * 0.3) {
          dstData[si + 3] = clamp(Math.round((dstData[si + 3] ?? 255) * 0.5))
        }
      }
    }
  }

  return dst
}

/* ═══════════════════════════════════════════════════════
 * Step 6: 背景合成
 * ═══════════════════════════════════════════════════════ */

/** 宣纸背景：米白色基底 + 纤维纹理 */
function compositePaperBackground(
  img: ImageData,
  mask: Float32Array,
  w: number,
  h: number,
  textureStr: number,
): ImageData {
  const dst = new ImageData(w, h)
  const src = img.data
  const dstData = dst.data

  // 宣纸色
  const paperR = 245
  const paperG = 240
  const paperB = 232
  // 纤维纹理强度
  const fiberNoise = (textureStr / 100) * 12  // 0-12 的 RGB 偏移

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const si = i * 4

      if ((mask[i] ?? 0) > 0.5) {
        // 印章区域：保持原样
        dstData[si]     = src[si]     ?? 0
        dstData[si + 1] = src[si + 1] ?? 0
        dstData[si + 2] = src[si + 2] ?? 0
        dstData[si + 3] = src[si + 3] ?? 255
      } else {
        // 背景区域：宣纸色 + 纤维纹理
        // 水平纤维纹理（模拟宣纸纤维方向）
        const fiberH = Math.sin(y * 0.3 + x * 0.05) * 0.5 + 0.5
        // 细颗粒纹理
        const grain = Math.sin(x * 17.3 + y * 41.7) * Math.sin(y * 23.1 + x * 37.9)
        // 局部染色不均（宣纸抄造时有厚度差异）
        const stain = Math.sin(x * 0.08 + y * 0.12) * Math.cos(y * 0.06 + x * 0.09)

        const tex = (fiberH * 0.6 + grain * 0.25 + stain * 0.15) * fiberNoise

        dstData[si]     = clamp(Math.round(paperR + tex))
        dstData[si + 1] = clamp(Math.round(paperG + tex * 0.9))
        dstData[si + 2] = clamp(Math.round(paperB + tex * 0.7))
        dstData[si + 3] = 255
      }
    }
  }

  return dst
}

/** 纯色背景 */
function compositeSolidBackground(
  img: ImageData,
  color: [number, number, number, number],
): ImageData {
  const w = img.width
  const h = img.height
  const dst = new ImageData(w, h)
  const src = img.data
  const dstData = dst.data

  for (let i = 0; i < w * h; i++) {
    const si = i * 4
    const a = src[si + 3] ?? 0
    if (a > 20) {
      // 印章像素：保留
      dstData[si]     = src[si]     ?? 0
      dstData[si + 1] = src[si + 1] ?? 0
      dstData[si + 2] = src[si + 2] ?? 0
      dstData[si + 3] = src[si + 3] ?? 255
    } else {
      // 背景像素：填充纯色
      dstData[si]     = color[0] ?? 0
      dstData[si + 1] = color[1] ?? 0
      dstData[si + 2] = color[2] ?? 0
      dstData[si + 3] = color[3] ?? 0
    }
  }
  return dst
}

/* ═══════════════════════════════════════════════════════
 * 工具函数
 * ═══════════════════════════════════════════════════════ */

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v))
}

function downsampleImageData(src: ImageData, dw: number, dh: number): ImageData {
  const offscreen = new OffscreenCanvas(dw, dh)
  const ctx = offscreen.getContext('2d')!
  const temp = new OffscreenCanvas(src.width, src.height)
  const tempCtx = temp.getContext('2d')!
  tempCtx.putImageData(src, 0, 0)
  ctx.drawImage(temp as unknown as CanvasImageSource, 0, 0, dw, dh)
  return ctx.getImageData(0, 0, dw, dh)
}

function upsampleImageData(src: ImageData, dw: number, dh: number): ImageData {
  return downsampleImageData(src, dw, dh)
}
