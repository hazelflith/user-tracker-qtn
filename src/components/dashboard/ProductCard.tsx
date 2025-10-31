import { Users } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Card } from '../ui/card'

const numberFormatter = new Intl.NumberFormat('id-ID')

export type ProductCardProps = {
  id: string
  name: string
  users: number
  target: number
  accent: string
  isActive: boolean
  lastSaleAmount?: number
  isUserPulse?: boolean
}

export function ProductCard({ name, users, target: _target, accent, isActive, lastSaleAmount, isUserPulse = false }: ProductCardProps) {
  const formattedUsers = numberFormatter.format(users)

  return (
    <Card className="relative flex h-full flex-col justify-between overflow-hidden border-none bg-white/85 px-5 py-5 shadow-card ring-1 ring-white/70 backdrop-blur-xl md:px-6 md:py-6">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{
          backgroundImage: `linear-gradient(90deg, ${accent}, ${accent}95)`,
        }}
      />

      <div className="flex items-start justify-between gap-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.45em] text-slate-500/80 md:text-xs">
          {name}
        </p>
        <div className="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-2.5 py-1 text-[0.75rem] font-medium text-slate-500 shadow-sm backdrop-blur">
          <Users className="h-3 w-3 text-slate-400" />
          <span>{formattedUsers}</span>
        </div>
      </div>
      <div className="space-y-4 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Active Users</p>
        <p
          className={cn(
            'text-5xl font-semibold tracking-tight text-slate-900 transition-all duration-300 md:text-6xl',
            (isActive || isUserPulse) && 'animate-pop text-emerald-500 drop-shadow-sm',
          )}
        >
          {formattedUsers}
        </p>
        {lastSaleAmount ? (
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
            <span className="rounded-full bg-emerald-50 px-2 py-0.5">New user joined</span>
            <span className="text-xs font-medium text-emerald-500/80">+{numberFormatter.format(lastSaleAmount)}</span>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
