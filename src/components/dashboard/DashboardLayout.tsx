import { ProductCard } from './ProductCard'

type ProductMetrics = {
  id: string
  name: string
  users: number
  accent: string
}

type DashboardLayoutProps = {
  products: ProductMetrics[]
  pulseMap: Record<string, number>
  now: number
  recentSale?: {
    productId: string
    amount: number
    timestamp: number
  } | null
}

export function DashboardLayout({ products, pulseMap, now, recentSale }: DashboardLayoutProps) {
  const labels: Record<string, string> = {
    meepo: 'User subscribed',
    kenangan: 'Gift transactions',
    quantumbyte: 'User subscribed',
    nexius: 'Report generation',
  }

  const logos: Record<
    string,
    {
      src: string
      alt: string
      className?: string
      wrapperClassName?: string
    }
  > = {
    meepo: { src: '/logo-meepo.svg', alt: 'Meepo', className: 'max-h-8', wrapperClassName: 'h-10 w-28' },
    kenangan: { src: '/logo-kenangan-red.svg', alt: 'Kenangan', className: 'max-h-7' },
    quantumbyte: { src: '/logo_quantumbyte.png', alt: 'QuantumByte', className: 'max-h-7' },
    nexius: {
      src: '/nexius-logo.png',
      alt: 'Nexius',
      className: 'max-h-6',
    },
  }

  return (
    <div className="flex h-full flex-col justify-between gap-1.5">
      <div className="grid flex-1 grid-rows-4 gap-1.5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            users={product.users}
            label={labels[product.id] ?? 'Active users'}
            logoSrc={logos[product.id]?.src}
            logoAlt={logos[product.id]?.alt}
            logoClassName={logos[product.id]?.className}
            logoWrapperClassName={logos[product.id]?.wrapperClassName}
            accent={product.accent}
            isActive={now - (pulseMap[product.id] ?? 0) < 1200}
            isUserPulse={Boolean(
              recentSale && recentSale.productId === product.id && now - recentSale.timestamp < 1500,
            )}
          />
        ))}
      </div>
    </div>
  )
}
