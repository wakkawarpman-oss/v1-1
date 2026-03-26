import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 min-h-[44px] w-full rounded-lg border border-ecalc-border/70 bg-[#111520] px-3 py-2 text-sm text-ecalc-text ring-offset-[#111520] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ecalc-muted/50 focus-visible:outline-none focus-visible:border-ecalc-orange focus-visible:ring-2 focus-visible:ring-ecalc-orange/25 hover:border-ecalc-border disabled:cursor-not-allowed disabled:bg-ecalc-lightbg/50 disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
