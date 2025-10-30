import * as React from 'react'

import { cn } from '@/lib/utils'

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ className, value = 0, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('relative h-2 w-full overflow-hidden rounded-full bg-slate-200/80', className)}
    {...props}
  >
    <div
      className="h-full w-full flex-1 rounded-full bg-slate-900 transition-all duration-500"
      style={{ transform: `translateX(-${100 - Math.min(Math.max(value, 0), 100)}%)` }}
    />
  </div>
))
Progress.displayName = 'Progress'

export { Progress }
