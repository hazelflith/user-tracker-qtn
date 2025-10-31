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
  logoSrc?: string
  logoAlt?: string
  logoClassName?: string
  logoWrapperClassName?: string
}

export function ProductCard({
  name,
  users,
  label,
  accent,
  isActive,
  isUserPulse = false,
  logoSrc,
  logoAlt,
  logoClassName,
  logoWrapperClassName,
}: ProductCardProps) {
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
    <Card className="relative flex h-full flex-col justify-center gap-8 overflow-hidden border-none bg-white/85 px-8 py-12 shadow-card ring-1 ring-white/70 backdrop-blur-xl">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{
          backgroundImage: `linear-gradient(90deg, ${accent}, ${accent}95)`,
        }}
      />

      <div className="flex items-center gap-5">
        {logoSrc ? (
          <div
            className={cn(
              'flex h-14 w-36 items-center justify-center rounded-2xl border border-white/70 bg-white/75 shadow-inner shadow-slate-900/5',
              logoWrapperClassName,
            )}
          >
            <img
              src={logoSrc}
              alt={logoAlt ?? name}
              className={cn('max-h-12 w-auto max-w-[9rem] object-contain', logoClassName)}
            />
          </div>
        ) : (
          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500/80">{name}</p>
        )}
      </div>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400">{label}</p>
      <div>
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
