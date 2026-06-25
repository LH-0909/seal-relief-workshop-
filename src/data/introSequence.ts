export type IntroSequenceFrame = {
  id: string
  src: string
  label: string
  stage: string
}

export const INTRO_SEQUENCE_STORAGE_KEY = 'seal-relief-intro-played'

const BASE = import.meta.env.BASE_URL

export const introSequenceFrames: IntroSequenceFrame[] = [
  {
    id: 'ink-awakening',
    src: `${BASE}images/intro-sequence/01-ink-awakening.png`,
    label: '泼墨初现',
    stage: '淡墨在宣纸上缓缓晕开',
  },
  {
    id: 'mountains-emerge',
    src: `${BASE}images/intro-sequence/02-mountains-emerge.png`,
    label: '山势显现',
    stage: '山势与云雾逐渐清晰',
  },
  {
    id: 'plum-appears',
    src: `${BASE}images/intro-sequence/03-plum-appears.png`,
    label: '梅枝初现',
    stage: '右侧梅枝像落笔般露出',
  },
  {
    id: 'plum-blooms',
    src: `${BASE}images/intro-sequence/04-plum-blooms.png`,
    label: '梅花渐开',
    stage: '少量朱色梅花在墨色中浮现',
  },
  {
    id: 'scene-complete',
    src: `${BASE}images/intro-sequence/05-scene-complete.png`,
    label: '山水成景',
    stage: '山水、云雾与梅枝构图完整',
  },
  {
    id: 'seal-imprint',
    src: `${BASE}images/intro-sequence/06-seal-imprint.png`,
    label: '朱砂钤印',
    stage: '右下角朱砂印痕完成落点',
  },
]
