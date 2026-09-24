import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

type Point = { x: number; y: number }
type Particle = Point & { vx: number; vy: number; life: number; maxLife: number; size: number; color: string; alpha: number; gravity: number }

export type ParticleFieldHandle = {
  burst: (point: Point, color?: string, amount?: number) => void
}

type ParticleFieldProps = {
  scene: string
  reducedMotion: boolean
}

const ambientColors = ['rgba(255,243,208,', 'rgba(231,185,104,', 'rgba(144,215,209,']

export const ParticleField = forwardRef<ParticleFieldHandle, ParticleFieldProps>(function ParticleField({ scene, reducedMotion }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const burstsRef = useRef<Particle[]>([])
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 })

  useImperativeHandle(ref, () => ({
    burst: ({ x, y }, color = '#E7B968', amount = 22) => {
      const list = burstsRef.current
      for (let index = 0; index < amount; index += 1) {
        const angle = (Math.PI * 2 * index) / amount + Math.random() * 0.4
        const velocity = 1.2 + Math.random() * 2.8
        list.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 0.5,
          life: 1,
          maxLife: 0.7 + Math.random() * 0.8,
          size: 1.2 + Math.random() * 2.2,
          color,
          alpha: 0.8 + Math.random() * 0.2,
          gravity: 0.018,
        })
      }
    },
  }), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    let frame = 0
    let raf = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = window.innerWidth
      const height = window.innerHeight
      sizeRef.current = { width, height, dpr }
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
      const cores = navigator.hardwareConcurrency ?? 4
      const count = reducedMotion ? 26 : Math.min(110, Math.max(38, Math.round(memory * cores * 2.4)))
      particlesRef.current = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        life: 1,
        maxLife: 1,
        size: index % 7 === 0 ? 1.8 : 0.7 + Math.random() * 1.3,
        color: ambientColors[index % ambientColors.length],
        alpha: 0.28 + Math.random() * 0.52,
        gravity: 0,
      }))
    }
    resize()
    window.addEventListener('resize', resize)

    const render = () => {
      const { width, height } = sizeRef.current
      context.clearRect(0, 0, width, height)
      frame += 1
      particlesRef.current.forEach((particle, index) => {
        particle.x += particle.vx + Math.sin(frame * 0.004 + index) * 0.015
        particle.y += particle.vy
        if (particle.x < -10) particle.x = width + 10
        if (particle.x > width + 10) particle.x = -10
        if (particle.y < -10) particle.y = height + 10
        if (particle.y > height + 10) particle.y = -10
        const twinkle = 0.65 + Math.sin(frame * 0.025 + index * 2) * 0.35
        context.fillStyle = `${particle.color}${Math.max(0.05, particle.alpha * twinkle)})`
        context.beginPath()
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        context.fill()
      })

      burstsRef.current = burstsRef.current.filter((particle) => {
        particle.life -= 0.018
        particle.vy += particle.gravity
        particle.x += particle.vx
        particle.y += particle.vy
        if (particle.life <= 0) return false
        context.globalAlpha = Math.max(0, particle.life) * particle.alpha
        context.fillStyle = particle.color
        context.beginPath()
        context.arc(particle.x, particle.y, particle.size * (0.6 + particle.life), 0, Math.PI * 2)
        context.fill()
        context.globalAlpha = 1
        return true
      })

      if (!reducedMotion || burstsRef.current.length) raf = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [reducedMotion, scene])

  return <canvas aria-hidden="true" className={`particle-field particle-field--${scene}`} ref={canvasRef} />
})
