import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import { Card } from '../ui/card'

const numberFormatter = new Intl.NumberFormat('id-ID')

export type ProductCardProps = {
  id: string
  name: string
  users: number
  label: string
  accent: string
  isActive: boolean
  isUserPulse?: boolean
}

export function ProductCard({ name, users, label, accent, isActive, isUserPulse = false }: ProductCardProps) {
  const formattedUsers = numberFormatter.format(users)
  const previousUsersRef = useRef(users)
  const [hasLocalPulse, setHasLocalPulse] = useState(false)

  useEffect(() => {
    let timeout: number | null = null

    if (users > previousUsersRef.current) {
      setHasLocalPulse(true)
      timeout = window.setTimeout(() => setHasLocalPulse(false), 1800)
    }

    previousUsersRef.current = users

    return () => {
      if (timeout !== null) {
        window.clearTimeout(timeout)
      }
    }
  }, [users])

  const shouldPulse = isActive || isUserPulse || hasLocalPulse

  return (
    <Card className="relative flex h-full flex-col justify-between overflow-hidden border-none bg-white/85 px-5 py-5 shadow-card ring-1 ring-white/70 backdrop-blur-xl md:px-6 md:py-6">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{
          backgroundImage: `linear-gradient(90deg, ${accent}, ${accent}95)`,
        }}
      />

      <div className="space-y-2">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.45em] text-slate-500/80 md:text-xs">
          {name}
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{label}</p>
      </div>
      <div className="pt-6">
        <p
          className={cn(
            'text-5xl font-semibold tracking-tight text-slate-900 transition-all duration-300 md:text-6xl',
            shouldPulse && 'animate-pop text-emerald-500 drop-shadow-sm',
          )}
        >
          {formattedUsers}
        </p>
      </div>
    </Card>
  )
}
