'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { LogoMark } from '@/components/LogoMark'

const navLinks = [
  { label: 'Калькулятори', href: '/dashboard?tab=dashboard', tab: 'dashboard' },
]

function getNavLinkClass(isActive: boolean) {
  return [
    'rounded-md text-sm font-medium transition-all duration-150',
    isActive ? 'bg-ecalc-orange text-white shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10',
  ].join(' ')
}

type HeaderProps = Readonly<{
  activeTab?: string
}>

export default function Header({ activeTab = 'dashboard' }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 shadow-lg" data-testid="site-header">
      <div className="nav-top bg-ecalc-darksurf">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center h-8 overflow-hidden">
          <span className="text-white text-[11px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis tracking-wide">
            🇺🇦 Безкоштовно · Без реєстрації · Інженерне моделювання · Без трекерів · Без аналітики · Розрахунки локально · Офлайн-режим · Всі дані з відкритих джерел · Довідковий та освітній характер · Не призначено для реальних операцій
          </span>
        </div>
      </div>

      <nav className="main-nav" aria-label="Основна навігація">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/dashboard" className="flex items-center gap-3 flex-shrink-0" data-testid="brand-link">
              <LogoMark className="w-9 h-11 text-ecalc-orange drop-shadow-md" />
              <div className="leading-tight">
                <div className="text-white font-bold text-lg tracking-tight">droneCalc</div>
                <div className="text-white/50 text-[10px] font-light tracking-wider uppercase">
                  🇺🇦 Україна
                </div>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  scroll={false}
                  aria-current={activeTab === link.tab ? 'page' : undefined}
                  data-testid={`top-nav-${link.tab}`}
                  className={`px-3.5 py-2 ${getNavLinkClass(activeTab === link.tab)}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              aria-label="Меню"
              aria-controls="mobile-navigation"
              data-testid="mobile-menu-toggle"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div id="mobile-navigation" className="md:hidden border-t border-white/10 bg-ecalc-darksurf animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  scroll={false}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 ${getNavLinkClass(activeTab === link.tab)}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
