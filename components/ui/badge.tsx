import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Badge({ className, children }: Readonly<{ className?: string; children: ReactNode }>) {
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide', className)}>{children}</span>
}
