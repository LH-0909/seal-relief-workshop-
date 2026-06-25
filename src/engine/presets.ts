/**
 * 材质预设定义
 *
 * 默认预设「2.5D 强立体」— 距离场高度图 + 虚拟侧壁 + 双层阴影 + 顶面保真
 */

import type { ReliefParams } from './reliefEngine'

export interface PresetDef {
  id: string
  label: string
  desc: string
  icon: string
  params: Record<string, number>
  reliefParams: ReliefParams
}

export const PRESETS: PresetDef[] = [
  {
    id: '2.5d',
    label: '2.5D 强立体',
    desc: '距离场 + 侧壁 + 双层阴影 · 明显厚度感',
    icon: '💎',
    params: {
      renderMode: 1,          // 2.5D 模式
      reliefMode: 0,          // 凸起
      depth: 55,
      soften: 16,
      lightDir: 0,            // 左上光
      lightHeight: 48,
      shadow: 15,
      specular: 18,
      // 2.5D 立体参数
      stereoLevel: 1,         // 标准
      sidewallDepth: 10,
      sidewallDark: 60,
      contactShadow: 40,
      dropShadow: 30,
      dropBlur: 8,
      topLightIntensity: 45,
      contourProtect: 1,
      // 保真
      fidelityMode: 1,
      fidelity: 100,
      reliefBlend: 65,
      // 质感（默认低颗粒、无磨损）
      grain: 8,
      wear: 0,
      // 背景
      bgType: 0,
      texture: 0,
    },
    reliefParams: {
      mode: 'raise', depth: 55, soften: 16, lightDir: 0, lightHeight: 48,
      shadow: 15, specular: 18, grain: 8, wear: 0,
      fidelityMode: true, fidelity: 100, reliefBlend: 65,
    },
  },
  {
    id: 'fidelity',
    label: '保真浮雕',
    desc: '保留印章轮廓 · 仅叠加光照与高度感',
    icon: '🔴',
    params: {
      renderMode: 0,
      reliefMode: 0, depth: 42, soften: 18,
      lightDir: 0, lightHeight: 50, shadow: 20, specular: 14,
      stereoLevel: 0, sidewallDepth: 0, sidewallDark: 0,
      contactShadow: 0, dropShadow: 0, dropBlur: 0,
      topLightIntensity: 30, contourProtect: 1,
      fidelityMode: 1, fidelity: 100, reliefBlend: 60,
      grain: 12, wear: 0, bgType: 0, texture: 0,
    },
    reliefParams: {
      mode: 'raise', depth: 42, soften: 18, lightDir: 0, lightHeight: 50,
      shadow: 20, specular: 14, grain: 12, wear: 0,
      fidelityMode: true, fidelity: 100, reliefBlend: 60,
    },
  },
  {
    id: 'classic',
    label: '经典朱砂印',
    desc: '深朱红层次 · 轻微凸起 · 透明背景',
    icon: '🪷',
    params: {
      renderMode: 0,
      reliefMode: 0, depth: 48, soften: 22,
      lightDir: 0, lightHeight: 52, shadow: 25, specular: 15,
      stereoLevel: 0, sidewallDepth: 0, sidewallDark: 0,
      contactShadow: 0, dropShadow: 0, dropBlur: 0,
      topLightIntensity: 35, contourProtect: 1,
      fidelityMode: 1, fidelity: 80, reliefBlend: 70,
      grain: 24, wear: 8, bgType: 0, texture: 0,
    },
    reliefParams: {
      mode: 'raise', depth: 48, soften: 22, lightDir: 0, lightHeight: 52,
      shadow: 25, specular: 15, grain: 24, wear: 8,
      fidelityMode: true, fidelity: 80, reliefBlend: 70,
    },
  },
  {
    id: 'paper',
    label: '宣纸压印',
    desc: '宣纸底纹 · 凹陷压痕 · 柔和阴影',
    icon: '📜',
    params: {
      renderMode: 0,
      reliefMode: 1, depth: 28, soften: 35,
      lightDir: 0, lightHeight: 62, shadow: 42, specular: 4,
      stereoLevel: 0, sidewallDepth: 0, sidewallDark: 0,
      contactShadow: 0, dropShadow: 0, dropBlur: 0,
      topLightIntensity: 20, contourProtect: 1,
      fidelityMode: 1, fidelity: 90, reliefBlend: 55,
      grain: 30, wear: 5, bgType: 1, texture: 60,
    },
    reliefParams: {
      mode: 'sink', depth: 28, soften: 35, lightDir: 0, lightHeight: 62,
      shadow: 42, specular: 4, grain: 30, wear: 5,
      fidelityMode: true, fidelity: 90, reliefBlend: 55,
    },
  },
]

export function getPresetById(id: string): PresetDef | undefined {
  return PRESETS.find(p => p.id === id)
}
