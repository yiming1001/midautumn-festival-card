export type SceneId = 'cover' | 'moonrise' | 'lanterns' | 'personalize' | 'final'

export type CardProfile = {
  to: string
  message: string
  from: string
}

export type FestivalCardConfig = {
  themeId: string
  palette: Record<string, string>
  fonts: {
    display: string
    body: string
  }
  scenes: Array<{
    id: SceneId
    copy: Record<string, string>
    assets: string[]
    particlePreset: string
    next: SceneId | null
  }>
  audio: {
    ambient?: string
    effects: Record<string, string>
  }
  share: {
    title: string
    description: string
  }
}
