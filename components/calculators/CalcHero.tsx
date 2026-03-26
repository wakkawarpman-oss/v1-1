type Props = Readonly<{
  badge: string
  title: string
  description: string
  children?: React.ReactNode
}>

import type React from 'react'

export function CalcHero({ badge, title, description, children }: Props) {
  return (
    <div className="calc-hero">
      <div className="relative z-10 px-5 py-6 sm:px-6 sm:py-7">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
          {badge}
        </div>
        <h3 className="display-font mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72">
          {description}
        </p>
        {children}
      </div>
    </div>
  )
}
