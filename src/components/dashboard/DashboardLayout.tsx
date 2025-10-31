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

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div className="grid flex-1 grid-rows-4 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            users={product.users}
            label={labels[product.id] ?? 'Active users'}
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
