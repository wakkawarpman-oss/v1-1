import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Avatar({ className, children }: Readonly<{ className?: string; children: ReactNode }>) {
  return <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 shadow-lg', className)}>{children}</div>
}

export function AvatarFallback({ className, children }: Readonly<{ className?: string; children: ReactNode }>) {
  return <span className={cn('text-sm font-bold uppercase tracking-wide', className)}>{children}</span>
}
