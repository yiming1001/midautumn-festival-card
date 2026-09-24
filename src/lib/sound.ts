let audioContext: AudioContext | null = null
let ambientNodes: OscillatorNode[] = []

function getContext() {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  if (audioContext.state === 'suspended') void audioContext.resume()
  return audioContext
}

export function playChime(kind: 'open' | 'lantern' | 'complete') {
  try {
    const context = getContext()
    const now = context.currentTime
    const frequencies = kind === 'complete' ? [523.25, 659.25, 783.99] : kind === 'lantern' ? [392, 523.25] : [659.25, 783.99]
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, now + index * 0.07)
      gain.gain.exponentialRampToValueAtTime(0.06, now + index * 0.07 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.07 + 0.48)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(now + index * 0.07)
      oscillator.stop(now + index * 0.07 + 0.5)
    })
  } catch {
    // Sound is an enhancement. The card must stay usable if the browser blocks audio.
  }
}

export function startAmbient() {
  try {
    const context = getContext()
    if (ambientNodes.length) return
    const master = context.createGain()
    master.gain.value = 0.012
    master.connect(context.destination)
    ;[130.81, 196].forEach((frequency) => {
      const oscillator = context.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      oscillator.connect(master)
      oscillator.start()
      ambientNodes.push(oscillator)
    })
  } catch {
    // Keep silent when Web Audio is unavailable.
  }
}

export function stopAmbient() {
  ambientNodes.forEach((node) => {
    try {
      node.stop()
    } catch {
      // Already stopped.
    }
  })
  ambientNodes = []
}
