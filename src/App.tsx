import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { CSSProperties, FormEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { defaultProfile, blessingLines, midAutumnTheme } from './config/theme'
import { playChime, startAmbient, stopAmbient } from './lib/sound'
import { ParticleField, type ParticleFieldHandle } from './components/ParticleField'
import type { CardProfile, SceneId } from './types'

const sceneOrder: SceneId[] = ['cover', 'moonrise', 'lanterns', 'personalize', 'final']

function readProfileFromUrl(): CardProfile {
  const params = new URLSearchParams(window.location.search)
  return {
    to: limitText(params.get('to') || defaultProfile.to, 20),
    message: limitText(params.get('msg') || defaultProfile.message, 80),
    from: limitText(params.get('from') || defaultProfile.from, 20),
  }
}

function createCardImage(profile: CardProfile): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 1500
    const context = canvas.getContext('2d')
    if (!context) {
      reject(new Error('当前设备不支持图片生成'))
      return
    }

    const background = context.createLinearGradient(0, 0, 1200, 1500)
    background.addColorStop(0, '#151b43')
    background.addColorStop(0.52, '#252e68')
    background.addColorStop(1, '#0b1026')
    context.fillStyle = background
    context.fillRect(0, 0, canvas.width, canvas.height)

    const glow = context.createRadialGradient(875, 260, 20, 875, 260, 360)
    glow.addColorStop(0, 'rgba(255, 243, 208, .42)')
    glow.addColorStop(1, 'rgba(255, 243, 208, 0)')
    context.fillStyle = glow
    context.fillRect(520, 0, 680, 620)

    context.beginPath()
    context.arc(900, 260, 185, 0, Math.PI * 2)
    context.fillStyle = '#fff3d0'
    context.shadowColor = 'rgba(255, 243, 208, .6)'
    context.shadowBlur = 40
    context.fill()
    context.shadowBlur = 0

    context.strokeStyle = 'rgba(231, 185, 104, .35)'
    context.lineWidth = 2
    context.beginPath()
    context.arc(900, 260, 275, 0, Math.PI * 2)
    context.stroke()

    context.fillStyle = '#e7b968'
    context.font = '600 24px sans-serif'
    context.fillText('中秋 / MID-AUTUMN', 90, 1020)
    context.fillStyle = '#fff3d0'
    context.font = '500 54px serif'
    context.fillText(`${profile.to || defaultProfile.to}，`, 90, 1120)
    context.font = '34px serif'
    const message = profile.message || defaultProfile.message
    const lines = message.match(/.{1,18}/g) || [message]
    lines.slice(0, 3).forEach((line, index) => context.fillText(line, 90, 1190 + index * 58))
    context.fillStyle = 'rgba(255, 243, 208, .62)'
    context.font = '24px sans-serif'
    context.fillText(profile.from || defaultProfile.from, 90, 1400)
    context.fillStyle = '#f57c56'
    context.font = '26px serif'
    context.fillText('月', 1040, 1370)
    context.fillText('圆', 1040, 1402)

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('图片生成失败'))
        return
      }
      resolve(new File([blob], 'mid-autumn-blessing.png', { type: 'image/png' }))
    }, 'image/png')
  })
}

function limitText(value: string, max: number) {
  return Array.from(value.trim()).slice(0, max).join('')
}

function App() {
  const [scene, setScene] = useState<SceneId>('cover')
  const [profile, setProfile] = useState<CardProfile>(() => readProfileFromUrl())
  const [blessingIndex, setBlessingIndex] = useState(0)
  const [lanterns, setLanterns] = useState([false, false, false])
  const [soundOn, setSoundOn] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const particleRef = useRef<ParticleFieldHandle>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!soundOn) {
      stopAmbient()
      return
    }
    startAmbient()
    return () => stopAmbient()
  }, [soundOn])

  const displayStep = scene === 'cover' ? 1 : scene === 'moonrise' ? 2 : scene === 'lanterns' ? 3 : 4
  const isShared = useMemo(() => Boolean(new URLSearchParams(window.location.search).get('to')), [])

  useEffect(() => {
    if (!isShared || scene !== 'cover') return
    const timer = window.setTimeout(() => setScene('final'), 2200)
    return () => window.clearTimeout(timer)
  }, [isShared, scene])

  function burstFromElement(element: HTMLElement, color = midAutumnTheme.palette.gold, amount = 26) {
    const rect = element.getBoundingClientRect()
    particleRef.current?.burst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, color, amount)
  }

  function goTo(nextScene: SceneId) {
    setScene(nextScene)
    setShareStatus('')
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  function goNext() {
    const currentIndex = sceneOrder.indexOf(scene)
    const nextScene = sceneOrder[currentIndex + 1]
    if (nextScene) goTo(nextScene)
  }

  function goBack() {
    const currentIndex = sceneOrder.indexOf(scene)
    const previousScene = sceneOrder[currentIndex - 1]
    if (previousScene) goTo(previousScene)
  }

  function handleCoverOpen(element: HTMLElement) {
    burstFromElement(element, midAutumnTheme.palette.moon, 38)
    if (soundOn) playChime('open')
    if (isShared) {
      goTo('final')
    } else {
      goNext()
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (target.closest('button, input, textarea, select, label')) return
    setDragStart({ x: event.clientX, y: event.clientY })
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStart) return
    const deltaX = event.clientX - dragStart.x
    const deltaY = event.clientY - dragStart.y
    setDragStart(null)
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 42) return
    if (scene === 'cover' && deltaY < -42) goNext()
    if (scene === 'moonrise' && Math.abs(deltaX) > Math.abs(deltaY)) {
      setBlessingIndex((current) => (deltaX < 0 ? (current + 1) % blessingLines.length : (current - 1 + blessingLines.length) % blessingLines.length))
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!stageRef.current || event.pointerType === 'touch') return
    const x = (event.clientX / window.innerWidth - 0.5) * 2
    const y = (event.clientY / window.innerHeight - 0.5) * 2
    stageRef.current.style.setProperty('--mx', x.toFixed(3))
    stageRef.current.style.setProperty('--my', y.toFixed(3))
  }

  function handlePointerLeave() {
    stageRef.current?.style.setProperty('--mx', '0')
    stageRef.current?.style.setProperty('--my', '0')
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (target.closest('input, textarea, select')) return
    if (scene === 'moonrise' && event.key === 'ArrowLeft') {
      event.preventDefault()
      setBlessingIndex((current) => (current - 1 + blessingLines.length) % blessingLines.length)
      return
    }
    if (scene === 'moonrise' && event.key === 'ArrowRight') {
      event.preventDefault()
      setBlessingIndex((current) => (current + 1) % blessingLines.length)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault()
      goNext()
    }
    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault()
      goBack()
    }
  }

  function handleLanternClick(index: number, element: HTMLButtonElement) {
    if (lanterns[index]) return
    const nextLanterns = lanterns.map((isLit, lanternIndex) => lanternIndex === index || isLit)
    setLanterns(nextLanterns)
    burstFromElement(element, index === 1 ? midAutumnTheme.palette.jade : midAutumnTheme.palette.gold, 20)
    if (soundOn) playChime(nextLanterns.every(Boolean) ? 'complete' : 'lantern')
  }

  function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile.to.trim() || !profile.message.trim() || !profile.from.trim()) return
    goTo('final')
    if (soundOn) playChime('complete')
  }

  async function handleShare() {
    const url = new URL(window.location.href)
    url.search = ''
    url.searchParams.set('theme', midAutumnTheme.themeId)
    url.searchParams.set('to', limitText(profile.to, 20))
    url.searchParams.set('msg', limitText(profile.message, 80))
    url.searchParams.set('from', limitText(profile.from, 20))
    const shareData = { title: `${profile.to || defaultProfile.to}，有一份月光祝福给你`, text: '点开这张动态贺卡，收下祝福，也可以制作一张送给别人。', url: url.toString() }
    try {
      if (navigator.share) {
        setShareStatus('正在打开分享面板…')
        await navigator.share(shareData)
        setShareStatus('动态贺卡已分享')
        return
      }
      await navigator.clipboard.writeText(url.toString())
      setShareStatus('动态贺卡入口已复制')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setShareStatus('已取消分享')
        return
      }
      try {
        await navigator.clipboard.writeText(url.toString())
        setShareStatus('动态贺卡入口已复制')
      } catch {
        setShareStatus(url.toString())
      }
    }
  }

  async function downloadCardImage(image?: File) {
    const cardImage = image || await createCardImage(profile)
    const href = URL.createObjectURL(cardImage)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = cardImage.name
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(href), 1000)
  }

  function handleReplay() {
    setLanterns([false, false, false])
    setBlessingIndex(0)
    setShareStatus('')
    goTo('cover')
  }

  return (
    <MotionConfig reducedMotion="user">
    <main
      className={`app-shell scene-${scene} ${isShared ? 'is-shared' : ''} ${reducedMotion ? 'is-reduced-motion' : ''}`}
      ref={stageRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{ '--night': midAutumnTheme.palette.night, '--horizon': midAutumnTheme.palette.horizon, '--moon': midAutumnTheme.palette.moon, '--gold': midAutumnTheme.palette.gold, '--jade': midAutumnTheme.palette.jade, '--verm': midAutumnTheme.palette.vermilion } as CSSProperties}
    >
      <ParticleField ref={particleRef} scene={scene} reducedMotion={reducedMotion} />
      <div className="atmosphere atmosphere--top" aria-hidden="true" />
      <div className="atmosphere atmosphere--bottom" aria-hidden="true" />

      <header className="topbar">
        <div className="brand-mark" aria-label="月光里的中秋祝福">
          <span className="brand-mark__dot" aria-hidden="true" />
          <span>Moonlit / 09</span>
        </div>
        <div className="topbar__actions">
          {scene !== 'cover' && (
            <button className="icon-button" type="button" onClick={goBack} aria-label="返回上一屏">
              <span aria-hidden="true">↖</span>
              <span className="icon-button__label">返回</span>
            </button>
          )}
          <button
            className={`sound-toggle ${soundOn ? 'is-on' : ''}`}
            type="button"
            onClick={() => setSoundOn((current) => !current)}
            aria-pressed={soundOn}
            aria-label={soundOn ? '关闭声音' : '开启声音'}
          >
            <span className="sound-toggle__bars" aria-hidden="true"><i /><i /><i /></span>
            <span>{soundOn ? '声音开' : '静音'}</span>
          </button>
        </div>
      </header>

      <div className="progress-wrap" aria-label={`第 ${displayStep} 屏，共 4 屏`}>
        <span>0{displayStep}</span>
        <div className="progress-line"><span style={{ width: `${(displayStep / 4) * 100}%` }} /></div>
        <span>04</span>
      </div>

      <div className="scene-frame">
        <AnimatePresence mode="wait" initial={false}>
          {scene === 'cover' && <CoverScene key="cover" isShared={isShared} onOpen={handleCoverOpen} onMakeCard={() => goTo('personalize')} />}
          {scene === 'moonrise' && (
            <MoonriseScene
              key="moonrise"
              blessingIndex={blessingIndex}
              onPrevious={() => setBlessingIndex((current) => (current - 1 + blessingLines.length) % blessingLines.length)}
              onNextBlessing={() => setBlessingIndex((current) => (current + 1) % blessingLines.length)}
              onContinue={goNext}
            />
          )}
          {scene === 'lanterns' && (
            <LanternScene key="lanterns" lanterns={lanterns} onLanternClick={handleLanternClick} onContinue={goNext} />
          )}
          {scene === 'personalize' && (
            <PersonalizeScene key="personalize" profile={profile} onChange={setProfile} onSubmit={handleGenerate} />
          )}
          {scene === 'final' && <FinalScene key="final" profile={profile} isShared={isShared} shareStatus={shareStatus} onShare={handleShare} onDownload={() => downloadCardImage()} onReplay={handleReplay} onMakeCard={() => goTo('personalize')} />}
        </AnimatePresence>
      </div>

      <footer className="footer-note">
        <span>Mid-Autumn / 2026</span>
        <span className="footer-note__line" />
        <span>一轮月光，刚好寄给你</span>
      </footer>
    </main>
    </MotionConfig>
  )
}

const sceneMotion = {
  initial: { opacity: 0, y: 34, scale: 0.965, filter: 'blur(14px)' },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -34, scale: 1.035, filter: 'blur(14px)' },
  transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const },
}

function CoverScene({ isShared, onOpen, onMakeCard }: { isShared: boolean; onOpen: (element: HTMLElement) => void; onMakeCard: () => void }) {
  return (
    <motion.section className="scene scene--cover" {...sceneMotion} aria-labelledby="cover-title">
      <div className="cover-copy">
        <p className="eyebrow">{isShared ? '有人把月光寄给你' : '给重要的人'}</p>
        <h1 id="cover-title">月光里的<br /><em>中秋祝福</em></h1>
        <p className="lede">把没说完的话，交给今晚的月亮。</p>
      </div>
      <div className="cover-haze cover-haze--one" aria-hidden="true" />
      <div className="cover-haze cover-haze--two" aria-hidden="true" />
      <div className="cover-petals" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</div>
      <div className="cover-orbit" aria-hidden="true"><span /><span /><span /></div>
      <button className="moon-trigger" type="button" onClick={(event) => onOpen(event.currentTarget)} aria-label="打开月光里的中秋祝福">
        <span className="moon-core" />
        <span className="moon-glint" />
        <span className="moon-ripple moon-ripple--one" />
        <span className="moon-ripple moon-ripple--two" />
        <span className="moon-caption">{isShared ? '轻触月亮打开祝福' : '轻触月亮开启'}</span>
      </button>
      {!isShared && <button className="cover-make-button" type="button" onClick={onMakeCard}>我也做一张 <span aria-hidden="true">↗</span></button>}
      <div className="cover-meta"><span>01</span><span className="meta-rule" /><span>月出之前</span></div>
    </motion.section>
  )
}

function MoonriseScene({ blessingIndex, onPrevious, onNextBlessing, onContinue }: { blessingIndex: number; onPrevious: () => void; onNextBlessing: () => void; onContinue: () => void }) {
  return (
    <motion.section className="scene scene--moonrise" {...sceneMotion} aria-labelledby="moonrise-title">
      <div className="scene-heading">
        <p className="eyebrow">02 / 月出</p>
        <h2 id="moonrise-title">月亮升起来了</h2>
        <p>远方的风，替我问候你。</p>
      </div>
      <div className="moonrise-art" aria-hidden="true">
        <div className="moon-glow" />
        <div className="moon-large" />
        <div className="cloud cloud--one" /><div className="cloud cloud--two" />
        <div className="mountain mountain--back" /><div className="mountain mountain--front" />
        <div className="branch"><i /><i /><i /><i /><i /></div>
      </div>
      <div className="blessing-panel">
        <span className="blessing-panel__kicker">今晚的第一句</span>
        <AnimatePresence mode="wait">
          <motion.p key={blessingIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.28 }}>{blessingLines[blessingIndex]}</motion.p>
        </AnimatePresence>
        <div className="blessing-panel__controls">
          <button type="button" onClick={onPrevious} aria-label="上一句祝福">←</button>
          <span>{String(blessingIndex + 1).padStart(2, '0')} / 03</span>
          <button type="button" onClick={onNextBlessing} aria-label="下一句祝福">→</button>
        </div>
      </div>
      <button className="primary-button primary-button--right" type="button" onClick={onContinue}>继续点亮 <span aria-hidden="true">↗</span></button>
    </motion.section>
  )
}

function LanternScene({ lanterns, onLanternClick, onContinue }: { lanterns: boolean[]; onLanternClick: (index: number, element: HTMLButtonElement) => void; onContinue: () => void }) {
  const complete = lanterns.every(Boolean)
  return (
    <motion.section className="scene scene--lanterns" {...sceneMotion} aria-labelledby="lantern-title">
      <div className="scene-heading scene-heading--lanterns">
        <p className="eyebrow">03 / 团圆</p>
        <h2 id="lantern-title">点亮三盏灯</h2>
        <p>{complete ? '你把月光聚拢成了家的方向。' : '每一盏，都替你守一会儿想念。'}</p>
      </div>
      <div className="lantern-stage" aria-label="三盏待点亮的灯笼">
        <div className={`rabbit ${complete ? 'is-visible' : ''}`} aria-hidden="true"><span className="rabbit-ear rabbit-ear--left" /><span className="rabbit-ear rabbit-ear--right" /><span className="rabbit-body" /><span className="rabbit-tail" /></div>
        {lanterns.map((isLit, index) => (
          <button key={index} className={`lantern lantern--${index + 1} ${isLit ? 'is-lit' : ''}`} type="button" onClick={(event) => onLanternClick(index, event.currentTarget)} aria-pressed={isLit} aria-label={`${isLit ? '已点亮' : '点亮'}第 ${index + 1} 盏灯笼`}>
            <span className="lantern__cap" /><span className="lantern__body"><i /></span><span className="lantern__tassel" />
          </button>
        ))}
      </div>
      <div className="lantern-status" aria-live="polite"><span className="lantern-status__count">{lanterns.filter(Boolean).length}</span><span> / 3 已点亮</span></div>
      {complete && <button className="primary-button primary-button--right" type="button" onClick={onContinue}>写下祝福 <span aria-hidden="true">↗</span></button>}
    </motion.section>
  )
}

function PersonalizeScene({ profile, onChange, onSubmit }: { profile: CardProfile; onChange: (profile: CardProfile) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <motion.section className="scene scene--personalize" {...sceneMotion} aria-labelledby="personalize-title">
      <div className="scene-heading">
        <p className="eyebrow">04 / 写给你</p>
        <h2 id="personalize-title">写下你的祝福</h2>
        <p>留下一点只属于你们的月光。</p>
      </div>
      <div className="personalize-grid">
        <form className="wish-form" onSubmit={onSubmit}>
          <label htmlFor="to">收卡人</label>
          <input id="to" name="to" value={profile.to} maxLength={20} onChange={(event) => onChange({ ...profile, to: event.target.value })} placeholder="例如：小满" required />
          <label htmlFor="message">一句祝福</label>
          <textarea id="message" name="message" value={profile.message} maxLength={80} onChange={(event) => onChange({ ...profile, message: event.target.value })} placeholder="想对 TA 说些什么？" rows={3} required />
          <div className="field-footer"><span>最多 80 字</span><span>{profile.message.length}/80</span></div>
          <label htmlFor="from">署名</label>
          <input id="from" name="from" value={profile.from} maxLength={20} onChange={(event) => onChange({ ...profile, from: event.target.value })} placeholder="你的名字" required />
          <button className="primary-button" type="submit">生成祝福 <span aria-hidden="true">↗</span></button>
        </form>
        <CardFace profile={profile} preview />
      </div>
    </motion.section>
  )
}

function FinalScene({ profile, isShared, shareStatus, onShare, onDownload, onReplay, onMakeCard }: { profile: CardProfile; isShared: boolean; shareStatus: string; onShare: () => void; onDownload: () => void; onReplay: () => void; onMakeCard: () => void }) {
  return (
    <motion.section className="scene scene--final" {...sceneMotion} aria-labelledby="final-title">
      <div className="final-intro">
        <p className="eyebrow">月圆，人也圆</p>
        <h2 id="final-title">愿你所念皆如愿</h2>
        <p>{isShared ? '这是一份专门写给你的中秋祝福。' : '这份月光，现在可以寄出去了。'}</p>
      </div>
      <CardFace profile={profile} />
      {isShared ? (
        <div className="final-actions final-actions--received">
          <button className="text-button" type="button" onClick={onReplay}>再看一次 <span aria-hidden="true">↗</span></button>
        </div>
      ) : (
        <div className="final-actions">
          <button className="primary-button" type="button" onClick={onShare}>分享动态卡片 <span aria-hidden="true">↗</span></button>
          <button className="text-button" type="button" onClick={onDownload}>保存图片</button>
          <button className="text-button" type="button" onClick={onMakeCard}>我也做一张</button>
          <button className="text-button" type="button" onClick={onReplay}>再看一次</button>
        </div>
      )}
      <p className="share-status" aria-live="polite">{shareStatus}</p>
    </motion.section>
  )
}

function CardFace({ profile, preview = false }: { profile: CardProfile; preview?: boolean }) {
  return (
    <article className={`card-face ${preview ? 'card-face--preview' : ''}`} aria-label="中秋祝福卡片预览">
      <div className="card-face__grain" aria-hidden="true" />
      <div className="card-face__sheen" aria-hidden="true" />
      <div className="card-face__moon" aria-hidden="true" />
      <div className="card-face__stars" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className="card-face__rabbit" aria-hidden="true"><span className="rabbit-ear rabbit-ear--left" /><span className="rabbit-ear rabbit-ear--right" /><span className="rabbit-body" /><span className="rabbit-tail" /></div>
      <div className="card-face__copy">
        <span>中秋 / MID-AUTUMN</span>
        <strong>{profile.to || '亲爱的你'}，</strong>
        <p>{profile.message || defaultProfile.message}</p>
        <small>{profile.from || defaultProfile.from}</small>
      </div>
      <div className="card-face__seal" aria-hidden="true">月<br />圆</div>
    </article>
  )
}

export default App
