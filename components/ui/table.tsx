import * as React from 'react'
import { cn } from '@/lib/utils'

export function Table({ className, ...props }: Readonly<React.TableHTMLAttributes<HTMLTableElement>>) {
  return <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
}

export function TableHeader({ className, ...props }: Readonly<React.HTMLAttributes<HTMLTableSectionElement>>) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />
}

export function TableBody({ className, ...props }: Readonly<React.HTMLAttributes<HTMLTableSectionElement>>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

export function TableRow({ className, ...props }: Readonly<React.HTMLAttributes<HTMLTableRowElement>>) {
  return <tr className={cn('border-b border-ecalc-border transition-colors hover:bg-white/5', className)} {...props} />
}

export function TableHead({ className, ...props }: Readonly<React.ThHTMLAttributes<HTMLTableCellElement>>) {
  return <th className={cn('h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-ecalc-muted', className)} {...props} />
}

export function TableCell({ className, ...props }: Readonly<React.TdHTMLAttributes<HTMLTableCellElement>>) {
  return <td className={cn('p-3 align-middle text-sm text-ecalc-text', className)} {...props} />
}
