'use client'

import { useState, useId, Children, isValidElement, cloneElement } from 'react'
import { Check, Copy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export function formatToolNumber(value: number | null | undefined, digits = 2) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  if (value === Number.POSITIVE_INFINITY) return '∞'
  if (value === Number.NEGATIVE_INFINITY) return '-∞'
  return Number.isFinite(value) ? value.toFixed(digits) : '—'
}

export function ResultBox({
  children,
  copyValue,
}: Readonly<{ children: React.ReactNode; copyValue?: string }>) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const text = copyValue ?? (typeof children === 'string' ? children : '')
    if (!text || text === '—') return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="result-animate group relative flex items-center justify-between gap-2 rounded-xl border border-ecalc-border/70 border-l-2 border-l-ecalc-orange/60 bg-gradient-to-r from-[#1c2235] to-[#161b27] px-3.5 py-2.5 text-sm text-ecalc-text shadow-sm">
      <div className="pr-6">{children}</div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Копіювати"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-ecalc-muted opacity-100 transition-all duration-150 hover:bg-ecalc-orange/10 hover:text-ecalc-orange sm:opacity-0 sm:group-hover:opacity-100"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-ecalc-green" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export function Field({
  label,
  children,
  hint,
  htmlFor,
}: Readonly<{
  label: string
  children: React.ReactNode
  hint?: string
  htmlFor?: string
}>) {
  const autoId = useId()
  const fieldId = htmlFor ?? autoId

  // Inject the stable ID into the first React element child (the form control)
  // so the <Label htmlFor> association is always correct without manual wiring.
  const childArray = Children.toArray(children)
  const firstEl = childArray.find(isValidElement)
  const wiredChildren = Children.map(children, (child) => {
    if (child === firstEl && isValidElement(child)) {
      const el = child as React.ReactElement<{ id?: string }>
      return cloneElement(el, { id: el.props.id ?? fieldId })
    }
    return child
  })

  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ecalc-muted">{label}</Label>
      {wiredChildren}
      {hint ? <div className="text-[10px] text-ecalc-muted/70 leading-relaxed">{hint}</div> : null}
    </div>
  )
}

export function CalcEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-ecalc-border/60 px-3.5 py-4 text-center text-[11px] text-ecalc-muted/60">
      Введіть параметри та натисніть Розрахувати
    </div>
  )
}

export function ToolCard({
  icon,
  title,
  description,
  children,
}: Readonly<{
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}>) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Enter' || (e.target as HTMLElement).tagName === 'BUTTON') return
    const btn = e.currentTarget.querySelector<HTMLButtonElement>('button[type="button"]')
    btn?.click()
  }

  return (
    <Card className="calc-surface h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 text-[15px]">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-ecalc-orange/10 text-ecalc-orange ring-1 ring-ecalc-orange/15">
            {icon}
          </span>
          <span className="leading-snug font-semibold text-ecalc-navy">{title}</span>
        </CardTitle>
        <CardDescription className="text-[11px] leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3" onKeyDown={handleKeyDown}>{children}</CardContent>
    </Card>
  )
}
