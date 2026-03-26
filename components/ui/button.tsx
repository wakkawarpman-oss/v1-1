import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[0.01em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecalc-orange/40 focus-visible:ring-offset-1 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-b from-ecalc-orangelt to-ecalc-orange text-white shadow-[0_1px_3px_rgba(0,0,0,0.18),0_4px_12px_rgba(217,114,14,0.22)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.15),0_6px_16px_rgba(217,114,14,0.30)] hover:brightness-105',
        outline: 'border border-ecalc-border bg-ecalc-lightbg text-ecalc-text shadow-sm hover:bg-[#1c2235] hover:border-ecalc-orange/50 hover:shadow-md',
        secondary: 'bg-gradient-to-b from-ecalc-navylt to-ecalc-navy text-white shadow-sm hover:brightness-110',
        ghost: 'text-ecalc-navy hover:bg-ecalc-lightbg',
      },
      size: {
        default: 'h-10 min-h-[44px] px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 min-h-[44px] px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
