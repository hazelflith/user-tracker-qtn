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
    <Card className="relative flex h-full flex-col justify-center gap-3 overflow-hidden border border-slate-800/60 bg-slate-900/80 px-4 py-5 shadow-lg shadow-black/20 backdrop-blur">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{
          backgroundImage: `linear-gradient(90deg, ${accent}, ${accent}95)`,
        }}
      />

      <div className="flex items-center gap-2.5">
        {logoSrc ? (
          <div
            className={cn(
              'flex h-9 w-24 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 shadow-inner shadow-black/30',
              logoWrapperClassName,
            )}
          >
            <img
              src={logoSrc}
              alt={logoAlt ?? name}
              className={cn('max-h-7 w-auto max-w-[5.5rem] object-contain', logoClassName)}
            />
          </div>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500/80">{name}</p>
        )}
      </div>
      <p className="text-[0.5rem] font-semibold uppercase tracking-[0.26em] text-slate-400">{label}</p>
      <div>
        <p
          className={cn(
            'text-2xl font-semibold tracking-tight text-slate-100 transition-all duration-300 md:text-[1.9rem]',
            shouldPulse && 'animate-pop text-emerald-400 drop-shadow-sm',
          )}
        >
          {formattedUsers}
        </p>
      </div>
    </Card>
  )
}
