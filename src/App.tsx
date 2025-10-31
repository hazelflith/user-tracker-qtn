import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type Product = {
  id: string
  name: string
  revenue: number
  users: number
  target: number
  accent: string
}

type SaleEvent = {
  productId: string
  amount: number
  timestamp: number
}

const INITIAL_PRODUCTS: Product[] = [
  { id: 'meepo', name: 'Meepo', revenue: 12_450_000, users: 938, target: 28_000_000, accent: '#2563EB' },
  { id: 'kenangan', name: 'Kenangan', revenue: 9_860_000, users: 812, target: 24_000_000, accent: '#DB2777' },
  { id: 'quantumbyte', name: 'QuantumByte', revenue: 15_340_000, users: 1_124, target: 32_000_000, accent: '#0EA5E9' },
  { id: 'nexius', name: 'Nexius', revenue: 11_170_000, users: 678, target: 26_000_000, accent: '#8B5CF6' },
]

const randomInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const AUDIO_SOURCE = '/cash-register-purchase-87313.mp3'

function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [pulseMap, setPulseMap] = useState<Record<string, number>>({})
  const [recentSale, setRecentSale] = useState<SaleEvent | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const saleTimerRef = useRef<number | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const setupPromiseRef = useRef<Promise<void> | null>(null)
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null)

  const [isAudioReady, setAudioReady] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [salesPerSecond, setSalesPerSecond] = useState(0.12)
  const [isControlOpen, setControlOpen] = useState(false)

  useEffect(() => {
    const audio = new Audio(AUDIO_SOURCE)
    audio.preload = 'auto'
    audio.volume = 1
    fallbackAudioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
      fallbackAudioRef.current = null
    }
  }, [])

  const ensureAudioReady = useCallback(async () => {
    if (typeof window === 'undefined') return

    if (audioBufferRef.current) {
      const context = audioContextRef.current
      if (context && context.state === 'suspended') {
        await context.resume()
      }
      setAudioReady(true)
      return
    }

    if (!setupPromiseRef.current) {
      setupPromiseRef.current = (async () => {
        const AudioContextCtor = window.AudioContext ?? (window as any).webkitAudioContext
        if (!AudioContextCtor) {
          throw new Error('Web Audio API not supported')
        }

        const context = audioContextRef.current ?? new AudioContextCtor()
        audioContextRef.current = context

        if (context.state === 'suspended') {
          await context.resume()
        }

        const response = await fetch(AUDIO_SOURCE)
        if (!response.ok) {
          throw new Error('Failed to load audio file')
        }

        const arrayBuffer = await response.arrayBuffer()
        const decoded = await context.decodeAudioData(arrayBuffer.slice(0))
        audioBufferRef.current = decoded
        setAudioReady(true)
        setAudioError(null)
      })()
        .catch((error) => {
          console.error('Audio setup failed', error)
          setAudioReady(false)
          setAudioError('Unable to enable audio. Tap again to allow sound.')
          throw error
        })
        .finally(() => {
          setupPromiseRef.current = null
        })
    }

    return setupPromiseRef.current
  }, [])

  const playSaleSound = useCallback(async () => {
    try {
      await ensureAudioReady()
      const context = audioContextRef.current
      const buffer = audioBufferRef.current

      if (context && buffer) {
        if (context.state === 'suspended') {
          await context.resume()
        }

        const source = context.createBufferSource()
        source.buffer = buffer
        source.connect(context.destination)
        source.start()
        setAudioReady(true)
        setAudioError(null)
        return true
      }
    } catch (error) {
      console.error('Primary audio playback failed', error)
    }

    try {
      const fallback = new Audio(AUDIO_SOURCE)
      fallback.volume = 1
      await fallback.play()
      setAudioReady(true)
      setAudioError(null)
      return true
    } catch (error) {
      console.error('Fallback audio playback failed', error)
      setAudioReady(false)
      setAudioError('Sound blocked. Tap to re-enable audio.')
      return false
    }
  }, [ensureAudioReady])

  const triggerAudioTest = useCallback(async () => {
    await playSaleSound()
  }, [playSaleSound])

  const handleFrequencyChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value)
    if (Number.isNaN(value)) return
    setSalesPerSecond(Math.min(3, Math.max(0, value)))
  }, [])

  const clearSaleTimer = useCallback(() => {
    if (saleTimerRef.current !== null) {
      window.clearTimeout(saleTimerRef.current)
      saleTimerRef.current = null
    }
  }, [])

  const generateSale = useCallback(() => {
    let event: SaleEvent | null = null

    setProducts((previous) => {
      if (!previous.length) return previous

      const productIndex = Math.floor(Math.random() * previous.length)
      const product = previous[productIndex]
      if (!product) return previous

      const saleAmount = randomInRange(180_000, 1_450_000)
      const updatedProducts = previous.map((entry, index) =>
        index === productIndex ? { ...entry, revenue: entry.revenue + saleAmount, users: entry.users + 1 } : entry,
      )

      event = { productId: product.id, amount: saleAmount, timestamp: Date.now() + Math.random() }

      return updatedProducts
    })

    if (!event) return

    const { productId, timestamp, amount } = event

    setPulseMap((currentMap) => ({ ...currentMap, [productId]: timestamp }))
    setRecentSale({ productId, amount, timestamp })
    void playSaleSound()
  }, [playSaleSound])

  const scheduleNextSale = useCallback(() => {
    clearSaleTimer()

    if (salesPerSecond <= 0) {
      return
    }

    const randomDelayMs = Math.max(80, Math.round((-Math.log(1 - Math.random()) / salesPerSecond) * 1000))

    saleTimerRef.current = window.setTimeout(() => {
      generateSale()
      scheduleNextSale()
    }, randomDelayMs)
  }, [clearSaleTimer, generateSale, salesPerSecond])

  useEffect(() => {
    const handler = () => {
      void ensureAudioReady()
    }

    if (!isAudioReady) {
      window.addEventListener('pointerdown', handler)
      window.addEventListener('keydown', handler)
    }

    return () => {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [ensureAudioReady, isAudioReady])

  useEffect(() => {
    const ticker = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(ticker)
  }, [])

  useEffect(() => {
    scheduleNextSale()

    return () => {
      clearSaleTimer()
    }
  }, [clearSaleTimer, scheduleNextSale])

  return (
    <div className="relative flex h-screen w-screen items-stretch justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black px-6 pt-8 pb-12 lg:px-10 lg:pt-12 lg:pb-16">
      {!isAudioReady ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-slate-950/80 px-10 text-center backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
            Tap to enable audio
          </p>
          <button
            type="button"
            onClick={() => void ensureAudioReady()}
            className="rounded-full bg-slate-100 px-6 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-950/30 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl active:translate-y-0"
          >
            Enable Sound
          </button>
          {audioError ? <p className="text-xs text-rose-400">{audioError}</p> : null}
          <p className="max-w-sm text-xs text-slate-400">
            Browsers block autoplay. Touch anywhere or use the button once to let the dashboard ring on every sale.
          </p>
        </div>
      ) : null}

      <div className="flex h-full w-full max-w-[720px] flex-col pb-4">
        <DashboardLayout products={products} pulseMap={pulseMap} now={now} recentSale={recentSale} />
      </div>

      <Dialog open={isControlOpen} onOpenChange={setControlOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group absolute bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-slate-100 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 shadow-lg shadow-slate-950/30 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
          >
            Live Controls
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-sm border-slate-800 bg-slate-900/95 p-6 text-slate-100">
          <DialogTitle className="text-base font-semibold uppercase tracking-[0.35em] text-slate-300">
            Control Center
          </DialogTitle>
          <p className="mt-2 text-sm text-slate-400">
            Fine-tune the mock sale cadence and confirm the audio cue without covering the dashboard.
          </p>

          <div className="mt-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
                <span>Mock Sale Frequency</span>
                <span>
                  {salesPerSecond.toFixed(2)} /s · {(salesPerSecond * 60).toFixed(0)} /min
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                step={0.05}
                value={salesPerSecond}
                onChange={handleFrequencyChange}
                aria-label="Mock sale frequency per second"
                className="w-full accent-emerald-400"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Audio Monitor</p>
              <button
                type="button"
                onClick={() => void triggerAudioTest()}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-900 shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-300"
                disabled={!isAudioReady}
              >
                Test Sound
              </button>
            </div>
          </div>

          <DialogClose asChild>
            <button
              type="button"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-900 shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl active:translate-y-0"
            >
              Done
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {isAudioReady && audioError ? (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/80 px-4 py-2 text-xs font-medium text-rose-400 shadow">
          {audioError}
        </div>
      ) : null}
    </div>
  )
}

export default App
