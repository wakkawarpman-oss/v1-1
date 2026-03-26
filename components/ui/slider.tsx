import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  valueLabel?: string
}

export function Slider({ className, valueLabel, ...props }: SliderProps) {
  return (
    <div className="space-y-1.5">
      <input
        type="range"
        aria-valuenow={props.value !== undefined ? Number(props.value) : undefined}
        className={cn('h-2 w-full cursor-pointer appearance-none rounded-lg bg-ecalc-border accent-[#e8740c]', className)}
        {...props}
      />
      {valueLabel ? <div className="text-[11px] text-ecalc-muted">{valueLabel}</div> : null}
    </div>
  )
}
