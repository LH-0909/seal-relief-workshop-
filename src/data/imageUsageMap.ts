export type ImageUsage = {
  path: string
  source: string
  allowedModules: string[]
  forbiddenUses: string[]
  note: string
}

export const atmosphereImageUsage: ImageUsage[] = [
  {
    path: '/images/atmosphere/seal-scene-01.png',
    source: 'E:/古风氛围/seal-scene-01.png',
    allowedModules: ['首页 Hero 右侧主视觉'],
    forbiddenUses: ['其他页面', '数字印谱馆', '工作台', '参数面板', 'Canvas 背景'],
    note: '只在首页 Hero 出现一次，使用渐变遮罩和边缘融合。',
  },
  {
    path: '/images/atmosphere/seal-scene-02.png',
    source: 'E:/古风氛围/seal-scene-02.png',
    allowedModules: ['首页灵感卡片：朱砂落纸'],
    forbiddenUses: ['首页 Hero', 'origin', 'gallery', 'workbench', '参数面板'],
    note: '只作为首页灵感卡片氛围图。',
  },
  {
    path: '/images/atmosphere/seal-scene-03.png',
    source: 'E:/古风氛围/seal-scene-03.png',
    allowedModules: ['首页灵感卡片：印玺雕琢'],
    forbiddenUses: ['首页 Hero', 'origin', 'gallery', 'workbench', '参数面板'],
    note: '只作为首页灵感卡片氛围图。',
  },
  {
    path: '/images/atmosphere/seal-scene-04.png',
    source: 'E:/古风氛围/seal-scene-04.png',
    allowedModules: ['首页灵感卡片：山水文房'],
    forbiddenUses: ['首页 Hero', 'origin', 'gallery', 'workbench', '参数面板'],
    note: '只作为首页灵感卡片氛围图。',
  },
]

export const homeScrollImageUsage = [
  '/images/seal-gallery/you-wen-sima-xi.png',
  '/images/seal-gallery/deng-shiru.jpg',
  '/images/seal-gallery/wu-changshuo.jpg',
]

export const sealGalleryRules = {
  galleryPage: '9 张印谱图在 /gallery 完整展陈，默认 object-fit: contain。',
  originPage: '按文化解读卡片使用对应印谱图，不作为背景。',
  homePage: '首页长卷只使用 3 张缩略图；数字印谱精选使用无图导览卡。',
  workbench: '工作台不使用固定氛围图或印谱图，只显示用户上传图、Canvas 和 SVG 空状态。',
}
