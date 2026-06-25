const BASE = import.meta.env.BASE_URL

export type GalleryCategory =
  | '古印源流'
  | '明清印学'
  | '流派传承'
  | '近现代篆刻'
  | '系统演示案例'

export type GalleryCase = {
  id: string
  title: string
  category: GalleryCategory
  image: string
  alt: string
  shortDescription: string
  styleTags: string[]
  source: string
  rightsNote: string
  recommendedPreset: string
  demo: boolean
}

export const historicalSource = '用户提供的印谱资料，出处待补充。'

export const historicalRightsNote =
  '仅用于项目展示与文化传播；正式参赛或公开发布前需补充来源与使用说明。'

export const galleryCases: GalleryCase[] = [
  {
    id: 'you-wen-sima-xi',
    title: '右闻司马玺',
    category: '古印源流',
    image: `${BASE}images/seal-gallery/you-wen-sima-xi.png`,
    alt: '右闻司马玺印谱资料完整图',
    shortDescription: '作为古印源流中的实物展品节点，可观察印面文字、边界和古玺式章法的视觉特征。',
    styleTags: ['古印', '印面结构', '源流节点'],
    source: historicalSource,
    rightsNote: historicalRightsNote,
    recommendedPreset: '保真朱砂浮雕',
    demo: false,
  },
  {
    id: 'he-zhen',
    title: '何震',
    category: '明清印学',
    image: `${BASE}images/seal-gallery/he-zhen.jpg`,
    alt: '何震印谱资料完整图',
    shortDescription: '可从印面中观察到文人篆刻兴起后的章法经营、篆书处理与刀味表达。',
    styleTags: ['文人篆刻', '章法', '刀味'],
    source: historicalSource,
    rightsNote: historicalRightsNote,
    recommendedPreset: '古籍印鉴',
    demo: false,
  },
  {
    id: 'deng-shiru',
    title: '邓石如',
    category: '明清印学',
    image: `${BASE}images/seal-gallery/deng-shiru.jpg`,
    alt: '邓石如印谱资料完整图',
    shortDescription: '以篆书结构和印面气息为观察重点，呈现皖派相关风貌中的文字秩序。',
    styleTags: ['皖派风貌', '篆书结构', '金石气'],
    source: historicalSource,
    rightsNote: historicalRightsNote,
    recommendedPreset: '宣纸压印',
    demo: false,
  },
  {
    id: 'xiling-eight-masters',
    title: '西泠八家',
    category: '流派传承',
    image: `${BASE}images/seal-gallery/xiling-eight-masters.jpg`,
    alt: '西泠八家印谱资料完整图',
    shortDescription: '以浙派印风为观察线索，关注印面边界、刀法节奏和印谱传播中的风格面貌。',
    styleTags: ['浙派印风', '刀法节奏', '印谱传播'],
    source: historicalSource,
    rightsNote: historicalRightsNote,
    recommendedPreset: '古籍印鉴',
    demo: false,
  },
  {
    id: 'wu-rangzhi',
    title: '吴让之',
    category: '流派传承',
    image: `${BASE}images/seal-gallery/wu-rangzhi.jpg`,
    alt: '吴让之印谱资料完整图',
    shortDescription: '可从印文布局和线条韵律中观察到不同于方整一路的章法趣味。',
    styleTags: ['章法节奏', '线条韵律', '金石趣味'],
    source: historicalSource,
    rightsNote: historicalRightsNote,
    recommendedPreset: '保真朱砂浮雕',
    demo: false,
  },
  {
    id: 'huang-mufu',
    title: '黄牧甫',
    category: '近现代篆刻',
    image: `${BASE}images/seal-gallery/huang-mufu.jpg`,
    alt: '黄牧甫印谱资料完整图',
    shortDescription: '呈现出近现代印学中更为清朗、严整的视觉取向，可从线面关系中观察章法控制。',
    styleTags: ['清朗', '章法控制', '近现代'],
    source: historicalSource,
    rightsNote: historicalRightsNote,
    recommendedPreset: '石雕浮雕',
    demo: false,
  },
  {
    id: 'zhao-shuru',
    title: '赵叔孺',
    category: '近现代篆刻',
    image: `${BASE}images/seal-gallery/zhao-shuru.jpg`,
    alt: '赵叔孺印谱资料完整图',
    shortDescription: '可从印面中观察到近现代篆刻对古意、秩序与册页呈现方式的综合处理。',
    styleTags: ['古意', '册页', '秩序'],
    source: historicalSource,
    rightsNote: historicalRightsNote,
    recommendedPreset: '青玉印玺',
    demo: false,
  },
  {
    id: 'wu-changshuo',
    title: '吴昌硕',
    category: '近现代篆刻',
    image: `${BASE}images/seal-gallery/wu-changshuo.jpg`,
    alt: '吴昌硕印谱资料完整图',
    shortDescription: '呈现出较强的金石气与视觉张力，可从印文密度和刀痕趣味中观察其面貌。',
    styleTags: ['金石气', '视觉张力', '刀痕趣味'],
    source: historicalSource,
    rightsNote: historicalRightsNote,
    recommendedPreset: '青铜古印',
    demo: false,
  },
  {
    id: 'qi-baishi',
    title: '齐白石',
    category: '近现代篆刻',
    image: `${BASE}images/seal-gallery/qi-baishi.jpg`,
    alt: '齐白石印谱资料完整图',
    shortDescription: '可从印面中观察到更鲜明的构成感、取势方式和质朴有力的视觉表达。',
    styleTags: ['构成感', '取势', '质朴'],
    source: historicalSource,
    rightsNote: historicalRightsNote,
    recommendedPreset: '保真朱砂浮雕',
    demo: false,
  },
]

export const demoResultCases: GalleryCase[] = []

export const galleryFilters: Array<'全部' | GalleryCategory> = [
  '全部',
  '古印源流',
  '明清印学',
  '流派传承',
  '近现代篆刻',
  '系统演示案例',
]

export function getGalleryCaseById(id: string) {
  return galleryCases.find((item) => item.id === id)
}
