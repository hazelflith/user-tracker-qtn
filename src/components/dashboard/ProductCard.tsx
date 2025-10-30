import { Users } from 'lucide-react'

import { useAnimatedNumber } from '@/hooks/use-animated-number'
import { cn } from '@/lib/utils'

import { Card } from '../ui/card'

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('id-ID')

export type ProductCardProps = {
  id: string
  name: string
  revenue: number
  users: number
  target: number
  accent: string
  isActive: boolean
  lastSaleAmount?: number
}

export function ProductCard({
  name,
  revenue,
  users,
  target: _target,
  accent,
  isActive,
  lastSaleAmount,
}: ProductCardProps) {
  const animatedRevenue = useAnimatedNumber(revenue)
  const formattedRevenue = currencyFormatter.format(Math.round(animatedRevenue))
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

      <div className="space-y-2 pt-4">
        <p
          className={cn(
            'text-3xl font-semibold tracking-tight text-slate-900 transition-all duration-300 md:text-[2.4rem]',
            isActive && 'animate-pop text-emerald-500 drop-shadow-sm',
          )}
        >
          {formattedRevenue}
        </p>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Lifetime revenue</span>
          {lastSaleAmount ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-500">
              +{currencyFormatter.format(lastSaleAmount)}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
