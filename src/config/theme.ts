import type { FestivalCardConfig } from '../types'

export const midAutumnTheme: FestivalCardConfig = {
  themeId: 'midautumn',
  palette: {
    night: '#0B1026',
    horizon: '#1B2450',
    moon: '#FFF3D0',
    jade: '#90D7D1',
    gold: '#E7B968',
    vermilion: '#F57C56',
  },
  fonts: {
    display: 'Noto Serif SC, Songti SC, STSong, serif',
    body: 'Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif',
  },
  scenes: [
    {
      id: 'cover',
      copy: { title: '月光里的\n中秋祝福', eyebrow: '给重要的人' },
      assets: [],
      particlePreset: 'star-dust',
      next: 'moonrise',
    },
    {
      id: 'moonrise',
      copy: { title: '月亮升起来了', eyebrow: '把思念交给夜色' },
      assets: [],
      particlePreset: 'firefly',
      next: 'lanterns',
    },
    {
      id: 'lanterns',
      copy: { title: '点亮三盏灯', eyebrow: '让团圆有迹可循' },
      assets: [],
      particlePreset: 'lantern-gold',
      next: 'personalize',
    },
    {
      id: 'personalize',
      copy: { title: '写下你的祝福', eyebrow: '这一轮月光，送给谁' },
      assets: [],
      particlePreset: 'gold-dust',
      next: 'final',
    },
    {
      id: 'final',
      copy: { title: '愿你所念皆如愿', eyebrow: '月圆，人也圆' },
      assets: [],
      particlePreset: 'gold-dust',
      next: null,
    },
  ],
  audio: {
    effects: {
      open: 'soft-chime',
      lantern: 'warm-bell',
      complete: 'three-notes',
    },
  },
  share: {
    title: '月光里的中秋祝福',
    description: '打开这份小小的月光，收下一句团圆。',
  },
}

export const blessingLines = [
  '愿你抬头有月，低头有暖。',
  '把没说完的话，交给今晚的月光。',
  '愿每一次远望，都有温柔回应。',
]

export const defaultProfile = {
  to: '亲爱的你',
  message: '愿你月圆人安，心之所向都被温柔照亮。',
  from: '想念你的我',
}
