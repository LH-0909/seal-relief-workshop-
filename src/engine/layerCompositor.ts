/**
 * 2.5D 分层合成器
 *
 * 将各独立层按从底到顶的顺序组装为最终 ImageData：
 *
 *   第 0 层: 背景（透明 / 宣纸 / 纯色）
 *   第 1 层: 投影阴影（偏移 + 大半径模糊）
 *   第 2 层: 接触阴影（紧贴边缘 + 深色）
 *   第 3 层: 虚拟侧壁（沿光源反方向连续偏移绘制）
 *   第 4 层: 印章顶面（原始 RGBA × 顶面光照）
 *   第 5 层: 保真覆盖（原图叠加混合）
 *
 * 导出为独立函数，与 React 解耦。
 */

import { computeChamferDistance, distanceToHeightMap } from './distanceField'
import { renderSideWalls, type SideWallParams } from './sideWalls'
import { renderContactShadow, renderDropShadow, type ShadowParams } from './shadows'
import { gaussianBlur2D } from './reliefEngine'

/* ── 类型 ── */

/** 2.5D 立体渲染参数 */
export interface TwoHalfDParams {
  // 浮雕
  mode: 'raise' | 'sink'
  depth: number            // 浮雕深度 0-100

  // 距离场柔化
  soften: number           // 边缘柔化 0-100

  // 光照
  lightDir: number         // 方向索引 0-7
  lightHeight: number      // 光源高度角 0-90
  shadow: number           // AO 强度 0-100
  specular: number         // 高光 0-100

  // 立体
  stereoLevel: number      // 立体等级 0-2 (0=轻微,1=标准,2=强)
  sidewallDepth: number    // 侧壁深度 2-24 px
  sidewallDark: number     // 侧壁暗化 0-100

  // 阴影
  contactShadow: number    // 接触阴影 0-100
  dropShadow: number       // 投影阴影 0-100
  dropBlur: number         // 投影模糊 2-24 px

  // 顶面
  topLightIntensity: number // 顶面光照强度 0-100
  contourProtect: boolean   // 轮廓保护

  // 质感（2.5D 模式默认关闭磨损，低颗粒）
  grain: number
  wear: number

  // 保真
  fidelityMode: boolean
  reliefBlend: number
}

/** 光照方向表 */
export const LIGHT_DIRS_2_5D: [number, number][] = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
  [-1,  1], [0,  1], [1,  1],
]

/* ═══════════════════════════════════════════════════════
 * 主入口
 * ═══════════════════════════════════════════════════════ */

export function process2_5D(
  originalImage: ImageData,
  params: TwoHalfDParams,
  bgType: number,
  textureStr: number,
): ImageData {
  const w = originalImage.width
  const h = originalImage.height
  const srcData = originalImage.data
  const n = w * h

  // ── 蒙版 ──
  const mask = extractMask(originalImage)

  // ── 距离场高度图 ──
  const distField = computeChamferDistance(mask, w, h)
  const heightMap = distanceToHeightMap(distField, mask, params.mode, params.depth)

  // 高度图柔化
  const blurSigma = (params.soften / 100) * 3.0
  if (blurSigma > 0.1) {
    gaussianBlur2D(heightMap, w, h, blurSigma)
  }

  // ── Phong 光照（仅用于顶面） ──
  const shading = computePhongShading(heightMap, params, w, h)

  // ── 光源方向 ──
  const dir2d = LIGHT_DIRS_2_5D[params.lightDir] ?? [-1, -1]
  const hRad = (params.lightHeight / 90) * Math.PI / 2
  const ldx = dir2d[0]! * Math.cos(hRad)
  const ldy = dir2d[1]! * Math.cos(hRad)
  const lLen = Math.sqrt(ldx * ldx + ldy * ldy + 1)
  const Lx = ldx / lLen
  const Ly = ldy / lLen

  // ── 印章基色（从原图采样前景平均色） ──
  let sumR = 0, sumG = 0, sumB = 0, fgCount = 0
  for (let i = 0; i < n; i++) {
    if ((mask[i] ?? 0) > 0.5) {
      sumR += srcData[i*4] ?? 0
      sumG += srcData[i*4+1] ?? 0
      sumB += srcData[i*4+2] ?? 0
      fgCount++
    }
  }
  const baseR = fgCount > 0 ? sumR / fgCount : 180
  const baseG = fgCount > 0 ? sumG / fgCount : 25
  const baseB = fgCount > 0 ? sumB / fgCount : 20

  // ════════════════════════════════════════════
  // 从底到顶逐层构建
  // ════════════════════════════════════════════

  // ── 第 0 层: 背景 ──
  let result: ImageData
  if (bgType === 1) {
    result = createPaperBackground(w, h, textureStr)
  } else if (bgType === 3) {
    result = createSolidBg(w, h, [255,255,255,255])
  } else if (bgType === 2) {
    result = createSolidBg(w, h, [20,20,40,255])
  } else {
    result = new ImageData(w, h) // 全透明
  }

  // ── 第 1 层: 投影阴影 ──
  const dropOffX = Math.round(-Lx * 12)
  const dropOffY = Math.round(-Ly * 12)
  const shadowParams: ShadowParams = {
    contactStrength: 0,  // 接触阴影在第 2 层单独处理
    dropStrength: params.dropShadow,
    dropBlur: params.dropBlur,
    dropOffsetX: dropOffX,
    dropOffsetY: dropOffY,
  }
  renderDropShadow(result, mask, w, h, shadowParams)

  // ── 第 2 层: 接触阴影 ──
  renderContactShadow(result, mask, w, h, params.contactShadow)

  // ── 第 3 层: 虚拟侧壁 ──
  const sideWallParams: SideWallParams = {
    depth: params.sidewallDepth,
    darkStrength: params.sidewallDark,
  }
  renderSideWalls(result, mask, w, h, Lx, Ly, sideWallParams, baseR, baseG, baseB)

  // ── 第 4 层: 印章顶面（光照叠加） ──
  const topIntensity = params.topLightIntensity / 100
  const dstData = result.data
  for (let i = 0; i < n; i++) {
    if ((mask[i] ?? 0) < 0.5) continue
    const si = i * 4
    const light = shading[i] ?? 0.5
    // 顶面光照乘数: 1.0 + (light - 0.5) * topIntensity
    const mult = 1.0 + (light - 0.5) * topIntensity * 2

    dstData[si]     = clamp(Math.round((srcData[si] ?? 0) * mult))
    dstData[si + 1] = clamp(Math.round((srcData[si+1] ?? 0) * mult))
    dstData[si + 2] = clamp(Math.round((srcData[si+2] ?? 0) * mult))
    dstData[si + 3] = srcData[si+3] ?? 255
  }

  // ── 第 5 层: 顶面保真混合（原图与光照顶面的加权混合） ──
  const fidelityBlend = params.reliefBlend / 100
  if (fidelityBlend < 1.0) {
    const fidelityWeight = 1.0 - fidelityBlend
    for (let i = 0; i < n; i++) {
      if ((mask[i] ?? 0) < 0.5) continue
      const si = i * 4
      // 混合: (1 - blend) * original + blend * processed
      dstData[si]     = clamp(Math.round((srcData[si] ?? 0) * fidelityWeight + (dstData[si] ?? 0) * fidelityBlend))
      dstData[si + 1] = clamp(Math.round((srcData[si+1] ?? 0) * fidelityWeight + (dstData[si+1] ?? 0) * fidelityBlend))
      dstData[si + 2] = clamp(Math.round((srcData[si+2] ?? 0) * fidelityWeight + (dstData[si+2] ?? 0) * fidelityBlend))
      // Alpha 始终用原图
      dstData[si + 3] = srcData[si+3] ?? 0
    }
  }

  return result
}

/* ═══════════════════════════════════════════════════════
 * 内部函数
 * ═══════════════════════════════════════════════════════ */

function extractMask(img: ImageData): Float32Array {
  const w = img.width, h = img.height, n = w * h
  const d = img.data
  const mask = new Float32Array(n)

  let hasAlpha = false
  for (let i = 3; i < d.length && i < 4000; i += 4) {
    if ((d[i] ?? 255) < 250) { hasAlpha = true; break }
  }

  if (hasAlpha) {
    for (let i = 0; i < n; i++) mask[i] = (d[i*4+3] ?? 255) > 30 ? 1.0 : 0.0
  } else {
    for (let i = 0; i < n; i++) {
      const r = d[i*4] ?? 255, g = d[i*4+1] ?? 255, b2 = d[i*4+2] ?? 255
      const redness = Math.max(0, (r - g) / 255 * 0.4 + (r - b2) / 255 * 0.4 + ((r - (g + b2) / 2) / 255) * 0.2)
      mask[i] = redness > 0.08 ? 1.0 : 0.0
    }
  }
  return mask
}

function computePhongShading(
  hm: Float32Array, params: TwoHalfDParams, w: number, h: number,
): Float32Array {
  const n = w * h
  const shading = new Float32Array(n)
  const dir2d = LIGHT_DIRS_2_5D[params.lightDir] ?? [-1, -1]
  const hRad = (params.lightHeight / 90) * Math.PI / 2
  const lx = dir2d[0]! * Math.cos(hRad), ly = dir2d[1]! * Math.cos(hRad), lz = Math.sin(hRad)
  const lLen = Math.sqrt(lx*lx+ly*ly+lz*lz)
  const Lx = lx/lLen, Ly = ly/lLen, Lz = lz/lLen
  const depthScale = 0.5 + (params.depth / 100) * 2.0
  const ambient = 0.15, diffuseStr = 0.85, specStr = params.specular / 100
  const shadowStr = params.shadow / 100

  for (let y = 1; y < h-1; y++) {
    for (let x = 1; x < w-1; x++) {
      const i = y*w + x
      const gx = (-(hm[(y-1)*w+x-1]??0) + (hm[(y-1)*w+x+1]??0) - 2*(hm[y*w+x-1]??0) + 2*(hm[y*w+x+1]??0) - (hm[(y+1)*w+x-1]??0) + (hm[(y+1)*w+x+1]??0))
      const gy = (-(hm[(y-1)*w+x-1]??0) - 2*(hm[(y-1)*w+x]??0) - (hm[(y-1)*w+x+1]??0) + (hm[(y+1)*w+x-1]??0) + 2*(hm[(y+1)*w+x]??0) + (hm[(y+1)*w+x+1]??0))
      const nx = -gx*depthScale, ny = -gy*depthScale, nz = 1.0
      const nLen = Math.sqrt(nx*nx+ny*ny+nz*nz)
      const NdotL = Math.max(0, (nx/nLen)*Lx + (ny/nLen)*Ly + (nz/nLen)*Lz)
      const hx = Lx, hy = Ly, hz = Lz+1
      const hLen2 = Math.sqrt(hx*hx+hy*hy+hz*hz)
      const NdotH = Math.max(0, (nx/nLen)*hx/hLen2 + (ny/nLen)*hy/hLen2 + (nz/nLen)*hz/hLen2)
      const spec = Math.pow(NdotH, 32) * specStr
      let ao = 0.0
      if (shadowStr > 0.01) {
        const center = hm[i]??0; let lower=0,cnt=0
        for (let dy=-2;dy<=2;dy++) for (let dx=-2;dx<=2;dx++) {
          const ni=(y+dy)*w+(x+dx)
          if (ni>=0&&ni<n) { if ((hm[ni]??0)<center) lower++; cnt++ }
        }
        ao = (lower/Math.max(1,cnt))*shadowStr
      }
      shading[i] = Math.max(0.05, Math.min(1, ambient + NdotL*diffuseStr + spec - ao))
    }
  }
  // 边界填充
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x===0||x===w-1||y===0||y===h-1) {
        const nx=Math.min(w-2,Math.max(1,x)), ny=Math.min(h-2,Math.max(1,y))
        shading[y*w+x] = shading[ny*w+nx]??ambient
      }
    }
  }
  return shading
}

function createPaperBackground(w: number, h: number, textureStr: number): ImageData {
  const dst = new ImageData(w, h), d = dst.data
  const fn = (textureStr/100)*12, pR=245,pG=240,pB=232
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
    const i=y*w+x, si=i*4
    const fiberH=Math.sin(y*0.3+x*0.05)*0.5+0.5
    const grain=Math.sin(x*17.3+y*41.7)*Math.sin(y*23.1+x*37.9)
    const stain=Math.sin(x*0.08+y*0.12)*Math.cos(y*0.06+x*0.09)
    const tex=(fiberH*0.6+grain*0.25+stain*0.15)*fn
    d[si]=clamp(Math.round(pR+tex)); d[si+1]=clamp(Math.round(pG+tex*0.9))
    d[si+2]=clamp(Math.round(pB+tex*0.7)); d[si+3]=255
  }
  return dst
}

function createSolidBg(w: number, h: number, color: [number,number,number,number]): ImageData {
  const dst = new ImageData(w, h), d = dst.data
  for (let i=0;i<w*h;i++) {
    d[i*4]=color[0]??0; d[i*4+1]=color[1]??0; d[i*4+2]=color[2]??0; d[i*4+3]=color[3]??0
  }
  return dst
}

function clamp(v: number): number { return Math.max(0, Math.min(255, v)) }
