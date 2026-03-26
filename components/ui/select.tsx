import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-10 min-h-[44px] w-full rounded-lg border border-ecalc-border/70 bg-[#111520] px-3 py-2 text-sm text-ecalc-text transition-colors focus-visible:outline-none focus-visible:border-ecalc-orange focus-visible:ring-2 focus-visible:ring-ecalc-orange/25 hover:border-ecalc-border disabled:cursor-not-allowed disabled:bg-ecalc-lightbg/50 disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
})

Select.displayName = 'Select'

export { Select }
