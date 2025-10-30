import { ProductCard, type ProductCardProps } from './ProductCard'

type ProductMetrics = Omit<ProductCardProps, 'isActive' | 'lastSaleAmount'> & {
  isActive?: boolean
  lastSaleAmount?: number
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
  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div className="grid flex-1 grid-rows-4 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            revenue={product.revenue}
            users={product.users}
            target={product.target}
            accent={product.accent}
            isActive={now - (pulseMap[product.id] ?? 0) < 1200}
            lastSaleAmount={
              recentSale && recentSale.productId === product.id && now - recentSale.timestamp < 1500
                ? recentSale.amount
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}
