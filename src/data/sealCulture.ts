import { galleryCases, type GalleryCase } from './galleryCases'

export type TimelineNode = {
  title: string
  period: string
  text: string
  caseId?: string
}

export type CultureCard = {
  title: string
  caseId: string
  text: string
  tags: string[]
}

export const timelineNodes: TimelineNode[] = [
  {
    title: '古玺印面观摩 · 右闻司马玺',
    period: '先秦古玺',
    text: '作为古印源流中的实物展品节点，可观察印面文字、边界与古玺式章法的视觉特征。',
    caseId: 'you-wen-sima-xi',
  },
  {
    title: '秦汉玺印',
    period: '赏印',
    text: '以抽象印面和红白文图形表示权信、文字秩序与边界意识，不补充未经提供的实物图片。',
  },
  {
    title: '明清文人篆刻',
    period: '观印',
    text: '文人参与使篆刻逐渐成为可品读的视觉艺术，章法、刀法和印谱传播共同形成风貌。',
  },
  {
    title: '近现代印学传承',
    period: '承印',
    text: '不同审美取向在册页中并置，可从印文布局、金石气和线面关系中观察传承变化。',
  },
  {
    title: '当代数字浮雕',
    period: '制印',
    text: '通过蒙版、高度图与局部光照，将平面印文转换为可调参数的数字浮雕体验。',
  },
]

export const schoolCards: CultureCard[] = [
  {
    title: '文人篆刻之兴 · 何震',
    caseId: 'he-zhen',
    text: '以何震印谱资料作为观察入口，可看到文人篆刻兴起后对印文布局、篆书结构和刀法趣味的重视。',
    tags: ['章法', '刀法趣味', '文人气'],
  },
  {
    title: '邓派开新 · 以书入印',
    caseId: 'deng-shiru',
    text: '可从印面中观察到篆书结构与金石气之间的关系，文字线条不是单纯填满方框，而是在疏密中建立秩序。',
    tags: ['篆书结构', '金石气', '疏密'],
  },
  {
    title: '浙派印风 · 西泠八家',
    caseId: 'xiling-eight-masters',
    text: '该卡片以浙派印风为视觉线索，关注边栏、刀味和印谱传播中的风格辨识，而不展开未经核实的师承叙述。',
    tags: ['浙派', '边栏', '印谱传播'],
  },
  {
    title: '邓派承续 · 圆朱流韵',
    caseId: 'wu-rangzhi',
    text: '可从线条转折、虚实安排和印文取势中观察章法趣味，适合作为数字浮雕中保真与材质融合的参考。',
    tags: ['虚实', '取势', '章法节奏'],
  },
]

export const modernCards: CultureCard[] = [
  {
    title: '晚清印学新声 · 黄牧甫',
    caseId: 'huang-mufu',
    text: '可从印面中观察到更清朗的线面关系和章法控制，呈现出不同的近现代印学审美取向。',
    tags: ['清朗', '线面关系'],
  },
  {
    title: '海上印学雅韵 · 赵叔孺',
    caseId: 'zhao-shuru',
    text: '以完整册页方式呈现，便于观察印面、题字与页面留白之间的关系。',
    tags: ['古意', '册页'],
  },
  {
    title: '金石大写 · 吴昌硕',
    caseId: 'wu-changshuo',
    text: '可从印文密度、刀痕趣味与整体视觉张力中观察到较强的金石意味。',
    tags: ['金石气', '张力'],
  },
  {
    title: '齐派新貌 · 齐白石',
    caseId: 'qi-baishi',
    text: '印面呈现出鲜明的构成意识和质朴有力的取势方式，适合用于观察章法的现代感。',
    tags: ['构成', '质朴'],
  },
]

export const bridgeSteps = [
  '传统印面',
  '印文与章法',
  '印谱传播',
  '数字图像提取',
  '高度图生成',
  '浮雕质感再创作',
]

export function caseById(id: string): GalleryCase {
  const item = galleryCases.find((entry) => entry.id === id)
  if (!item) throw new Error('Missing gallery case: ' + id)
  return item
}
