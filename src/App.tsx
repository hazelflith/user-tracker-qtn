import { useCallback, useEffect, useRef, useState } from 'react'

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
  { id: 'meepo', name: 'Meepo', revenue: 12_450_000, users: 0, target: 28_000_000, accent: '#2563EB' },
  { id: 'kenangan', name: 'Kenangan', revenue: 9_860_000, users: 0, target: 24_000_000, accent: '#DB2777' },
  { id: 'quantumbyte', name: 'QuantumByte', revenue: 15_340_000, users: 0, target: 32_000_000, accent: '#0EA5E9' },
  { id: 'nexius', name: 'Nexius', revenue: 11_170_000, users: 0, target: 26_000_000, accent: '#8B5CF6' },
]

const normalizeIncomingUsers = (value: unknown): number | undefined => {
  if (value == null) return undefined
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  if (typeof value === 'object') {
    // handle MongoDB extended JSON { $numberInt: "123" }
    if ('$numberInt' in (value as Record<string, unknown>)) {
      const parsed = Number.parseInt((value as Record<string, string>).$numberInt, 10)
      return Number.isFinite(parsed) ? parsed : undefined
    }
    if ('$numberLong' in (value as Record<string, unknown>)) {
      const parsed = Number.parseInt((value as Record<string, string>).$numberLong, 10)
      return Number.isFinite(parsed) ? parsed : undefined
    }
    const raw = (value as { valueOf?: () => unknown; toString?: () => string }).valueOf?.()
    if (raw !== value) {
      const normalized = normalizeIncomingUsers(raw)
      if (normalized !== undefined) return normalized
    }
    const stringified = (value as { toString?: () => string }).toString?.()
    if (stringified && stringified !== '[object Object]') {
      const parsed = Number.parseFloat(stringified)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : undefined
}

const AUDIO_SOURCE = '/cash-register-purchase-87313.mp3'
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'

function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [pulseMap, setPulseMap] = useState<Record<string, number>>({})
  const [recentSale, setRecentSale] = useState<SaleEvent | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [isControlOpen, setControlOpen] = useState(false)
  const [isAudioUnlocked, setAudioUnlocked] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [isConnected, setConnected] = useState(false)

  const unlockPromiseRef = useRef<Promise<void> | null>(null)

  const warmupAudio = useCallback(async () => {
    const sample = new Audio(AUDIO_SOURCE)
    sample.volume = 0
    sample.muted = true
    try {
      await sample.play()
    } finally {
      sample.pause()
      sample.src = ''
    }
  }, [])

  const unlockAudio = useCallback(async () => {
    if (isAudioUnlocked) return

    if (!unlockPromiseRef.current) {
      unlockPromiseRef.current = warmupAudio()
        .then(() => {
          setAudioUnlocked(true)
          setAudioError(null)
        })
        .catch((error) => {
          console.error('Audio unlock failed', error)
          setAudioUnlocked(false)
          setAudioError('Sound blocked. Tap again to enable audio.')
          throw error
        })
        .finally(() => {
          unlockPromiseRef.current = null
        })
    }

    return unlockPromiseRef.current
  }, [isAudioUnlocked, warmupAudio])

  const playSaleSound = useCallback(async () => {
    try {
      await unlockAudio()
      const instance = new Audio(AUDIO_SOURCE)
      instance.volume = 1
      instance.play().catch((error) => {
        console.error('Playback rejected', error)
        setAudioUnlocked(false)
        setAudioError('Sound blocked. Tap to re-enable audio.')
      })
    } catch (error) {
      console.error('Unable to play sound', error)
    }
  }, [unlockAudio])

  const triggerAudioTest = useCallback(async () => {
    await playSaleSound()
  }, [playSaleSound])

  const fetchInitialState = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/state`)
      if (!response.ok) throw new Error(`Failed to load state: ${response.status}`)
      const payload = await response.json()
      const users: Record<string, number> = payload.users ?? {}
      setProducts((previous) =>
        previous.map((product) => ({
          ...product,
          users: users[product.id] ?? 0,
        })),
      )
    } catch (error) {
      console.error('Failed to load initial state', error)
    }
  }, [])

  useEffect(() => {
    void fetchInitialState()
  }, [fetchInitialState])

  useEffect(() => {
    let stop = false
    let eventSource: EventSource | null = null

    const connect = () => {
      if (stop) return
      const source = new EventSource(`${API_BASE}/api/stream`)
      eventSource = source

      source.onopen = () => {
        setConnected(true)
      }

      source.onmessage = async (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type: string
            users?:
              | Record<string, number | { $numberInt?: string; $numberLong?: string } | string>
              | Array<{ _id?: string; users?: number | { $numberInt?: string; $numberLong?: string } | string }>
            productId?: string
            usersLegacy?: number
            timestamp?: number
          }

          if (payload.type === 'snapshot' && payload.users) {
            const usersMap: Record<string, number> = Array.isArray(payload.users)
              ? payload.users.reduce<Record<string, number>>((acc, doc) => {
                  if (!doc || !doc._id) return acc
                  const normalized = normalizeIncomingUsers(doc.users)
                  if (normalized !== undefined) acc[doc._id] = normalized
                  return acc
                }, {})
              : Object.fromEntries(
                  Object.entries(payload.users).map(([key, value]) => [
                    key,
                    normalizeIncomingUsers(value) ?? 0,
                  ]),
                )

            setProducts((previous) =>
              previous.map((product) => ({
                ...product,
                users: usersMap[product.id] ?? 0,
              })),
            )
            setPulseMap({})
            setRecentSale(null)
          }

          if (payload.type === 'increment' && payload.productId) {
            const { productId, timestamp = Date.now() } = payload
            const normalized =
              normalizeIncomingUsers(
                Array.isArray(payload.users)
                  ? payload.users.find((doc) => doc && doc._id === productId)?.users
                  : payload.users?.[productId],
              ) ?? normalizeIncomingUsers(payload.usersLegacy)

            setProducts((previous) =>
              previous.map((product) =>
                product.id === productId
                  ? {
                      ...product,
                      users: normalized ?? product.users + 1,
                    }
                  : product,
              ),
            )

            setPulseMap((currentMap) => ({ ...currentMap, [productId]: timestamp }))
            setRecentSale({ productId, amount: 0, timestamp })
            await playSaleSound()
          }
        } catch (error) {
          console.error('Failed to process stream payload', error)
        }
      }

      source.onerror = () => {
        setConnected(false)
        source.close()
        if (!stop) {
          setTimeout(connect, 1500)
        }
      }
    }

    connect()

    return () => {
      stop = true
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [playSaleSound])

  useEffect(() => {
    const handler = () => {
      void unlockAudio()
    }

    if (!isAudioUnlocked) {
      window.addEventListener('pointerdown', handler)
      window.addEventListener('keydown', handler)
    }

    return () => {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [isAudioUnlocked, unlockAudio])

  useEffect(() => {
    const ticker = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(ticker)
  }, [])

  const handleManualHit = useCallback(async (productId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/products/${productId}/hit`, { method: 'POST' })
      if (!response.ok) throw new Error(`Failed to trigger product ${productId}`)
    } catch (error) {
      console.error('Manual hit failed', error)
    }
  }, [])

  return (
    <div className="relative flex h-screen w-screen items-stretch justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black px-6 pt-8 pb-12 lg:px-10 lg:pt-12 lg:pb-16">
      {!isAudioUnlocked ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-slate-950/80 px-10 text-center backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
            Tap to enable audio
          </p>
          <button
            type="button"
            onClick={() => void unlockAudio()}
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
            API base: <span className="font-mono text-slate-300">{API_BASE}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Use the endpoints below to push live user events. Each request increments the matching product.
          </p>

          <div className="mt-5 space-y-4">
            {products.map((product) => (
              <div key={product.id} className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between text-sm font-medium text-slate-200">
                  <span>{product.name}</span>
                  <span className={isConnected ? 'text-emerald-400' : 'text-slate-500'}>
                    {isConnected ? 'listening' : 'offline'}
                  </span>
                </div>
                <code className="block truncate rounded-lg bg-black/40 px-3 py-2 text-xs text-emerald-300">
                  POST {API_BASE}/api/products/{product.id}/hit
                </code>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Current users: {product.users.toLocaleString('id-ID')}</span>
                  <button
                    type="button"
                    onClick={() => void handleManualHit(product.id)}
                    className="rounded-full bg-emerald-400/90 px-3 py-1 font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:-translate-y-0.5 hover:bg-emerald-300"
                  >
                    Trigger
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
            <p className="font-semibold uppercase tracking-[0.3em] text-slate-300">Audio Monitor</p>
            <button
              type="button"
              onClick={() => void triggerAudioTest()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-slate-900 shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-300"
              disabled={!isAudioUnlocked}
            >
              Test Sound
            </button>
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

      {isAudioUnlocked && audioError ? (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/80 px-4 py-2 text-xs font-medium text-rose-400 shadow">
          {audioError}
        </div>
      ) : null}
    </div>
  )
}

export default App
