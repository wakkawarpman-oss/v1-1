import { cn } from '@/lib/utils'

export function Progress({
  value,
  className,
  indicatorClassName,
}: Readonly<{
  value: number
  className?: string
  indicatorClassName?: string
}>) {
  const safeValue = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('rounded-full bg-slate-200/80 p-0', className)}>
      <progress
        className={cn('h-2.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-200/80 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-ecalc-orange [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-ecalc-orange', indicatorClassName)}
        max={100}
        value={safeValue}
      />
    </div>
  )
}
