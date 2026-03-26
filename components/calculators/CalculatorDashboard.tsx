'use client'

import { useDashboardNav } from '@/hooks/useDashboardNav'
import {
  Activity, BarChart2, Compass, Cpu, Eye, Flame, Gauge,
  Link2, Map, Navigation, Plane, Radio, Ruler, ShieldAlert, ShieldCheck, Target,
  Thermometer, Volume2, Wind, Wrench, Zap, Battery,
} from 'lucide-react'
import { AeroNavigationSuite } from '@/components/calculators/AeroNavigationSuite'
import { AircraftGeometrySuite } from '@/components/calculators/AircraftGeometrySuite'
import { AviationEngineeringSuite } from '@/components/calculators/AviationEngineeringSuite'
import { AvionicsElectronicsSuite } from '@/components/calculators/AvionicsElectronicsSuite'
import { CoordinateSystemsSuite } from '@/components/calculators/CoordinateSystemsSuite'
import { ExternalFactorsSuite } from '@/components/calculators/ExternalFactorsSuite'
import { FrequencyToolsSuite } from '@/components/calculators/FrequencyToolsSuite'
import { MissionPlanningSuite } from '@/components/calculators/MissionPlanningSuite'
import { PerfCalc } from '@/components/calculators/PerfCalc'
import { RadioHorizonSuite } from '@/components/calculators/RadioHorizonSuite'
import { SolderingSuite } from '@/components/calculators/SolderingSuite'
import { CGCalcBasic, PropCalcBasic, XcopterCalcBasic } from '@/components/calculators/BasicCalcs'
import { DroneEngineerToolset } from '@/components/calculators/DroneEngineerToolset'
import { BallisticsSuite } from '@/components/calculators/BallisticsSuite'
import { BatteryPackSuite } from '@/components/calculators/BatteryPackSuite'
import { OpticsSuite } from '@/components/calculators/OpticsSuite'
import { DroneDatabase } from '@/components/calculators/DroneDatabase'
import { EwJammingSuite } from '@/components/calculators/EwJammingSuite'
import { WindProfileSuite } from '@/components/calculators/WindProfileSuite'
import { ThermalCoolingSuite } from '@/components/calculators/ThermalCoolingSuite'
import { AcousticSuite } from '@/components/calculators/AcousticSuite'
import { SlipstreamSuite } from '@/components/calculators/SlipstreamSuite'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { ErrorBoundary } from '@/components/ErrorBoundary'

import { Database } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type TabDef = { value: string; label: string; shortLabel: string; icon: LucideIcon }
type TabGroup = { group: string | null; tabs: TabDef[] }

// ── Tab definitions with sidebar grouping ────────────────────────────────────
const tabGroups: TabGroup[] = [
  { group: null, tabs: [
    { value: 'dashboard', label: 'Головна', shortLabel: 'Головна', icon: Gauge },
  ]},
  { group: 'Характеристики', tabs: [
    { value: 'perfcalc',    label: 'perfCalc — Продуктивність',   shortLabel: 'perfCalc',    icon: BarChart2 },
    { value: 'xcoptercalc', label: 'xcopterCalc — Мультиротор',   shortLabel: 'xcopterCalc', icon: Cpu },
    { value: 'propcalc',    label: 'propCalc — Мотор + Пропелер', shortLabel: 'propCalc',    icon: Plane },
    { value: 'cgcalc',      label: 'cgCalc — Центр ваги',         shortLabel: 'cgCalc',      icon: Target },
  ]},
  { group: 'Планування місії', tabs: [
    { value: 'mission',  label: 'Центр планування місії', shortLabel: 'Місія',      icon: Navigation },
    { value: 'aeronav',  label: 'Аеронавігація',          shortLabel: 'AeroNav',    icon: Compass },
    { value: 'coords',   label: 'Системи координат',      shortLabel: 'Координати', icon: Map },
  ]},
  { group: 'Інженерія', tabs: [
    { value: 'engineering',   label: 'Aviation Engineering',  shortLabel: 'Engineering',   icon: Wrench },
    { value: 'avionics',      label: 'Avionics + Electronics', shortLabel: 'Avionics',     icon: Zap },
    { value: 'geometry',      label: 'Aircraft Geometry',     shortLabel: 'Geometry',      icon: Ruler },
    { value: 'environment',   label: 'Зовнішні фактори',      shortLabel: 'Середовище',   icon: Wind },
    { value: 'windprofile',   label: 'Профіль вітру (ISO 4354)', shortLabel: 'Вітер',      icon: Wind },
    { value: 'thermalcooling',label: 'Ram-Air охолодження',   shortLabel: 'Охолодження',  icon: Thermometer },
    { value: 'acoustic',      label: 'Акустика — OASPL',      shortLabel: 'Акустика',     icon: Volume2 },
    { value: 'slipstream',    label: 'Slipstream Drag',        shortLabel: 'Slipstream',   icon: Wind },
  ]},
  { group: 'Зв\u2019язок і радіо', tabs: [
    { value: 'radiohorizon', label: 'Radio Horizon + Radar',     shortLabel: 'Radio',     icon: Radio },
    { value: 'frequency',    label: 'Frequency Tools',           shortLabel: 'Frequency', icon: Activity },
    { value: 'optics',       label: 'Оптика, GSD та Радіоканал', shortLabel: 'Оптика',    icon: Eye },
    { value: 'ew',           label: 'РЕБ — Стійкість лінку',    shortLabel: 'РЕБ',       icon: ShieldAlert },
  ]},
  { group: 'Інструменти', tabs: [
    { value: 'dronetools',  label: 'Drone Tools',                 shortLabel: 'Drone Tools',  icon: Wrench },
    { value: 'soldering',   label: 'Soldering Tools',             shortLabel: 'Soldering',    icon: Flame },
    { value: 'ballistics',  label: 'Балістика скидання',          shortLabel: 'Балістика',    icon: Target },
    { value: 'battery',     label: 'Battery Pack Builder',         shortLabel: 'Battery',      icon: Battery },
  ]},
  { group: 'База знань', tabs: [
    { value: 'dronedb',   label: 'База дронів — ТТХ',       shortLabel: 'База дронів', icon: Database },
  ]},
]

const tabs: TabDef[] = tabGroups.flatMap((g) => g.tabs)

function isDashboardTab(value: string | null): value is string {
  return tabs.some((tab) => tab.value === value)
}

type CalculatorDashboardProps = Readonly<{ activeTab?: string }>

export function CalculatorDashboard({ activeTab: requestedTab = 'dashboard' }: CalculatorDashboardProps) {
  const { activeTab, toastVisible, handleTabChange, handleShare } = useDashboardNav(tabs, requestedTab)

  const activeTabData = tabs.find((t) => t.value === activeTab)!
  const ActiveTabIcon = activeTabData.icon

  return (
    <section id="suite-dashboard" data-testid="suite-dashboard" className="dashboard-shell max-w-7xl mx-auto px-3 py-5 sm:px-5 sm:py-8 lg:px-6 lg:py-10 rounded-none sm:rounded-[20px] lg:rounded-[28px]">

      {/* ── Mobile navigation ── */}
      <div className="lg:hidden sticky top-14 z-30 mb-4">
        <div className="dashboard-nav rounded-2xl px-3 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-ecalc-orange/20 text-ecalc-orange">
              <ActiveTabIcon className="h-4 w-4" />
            </span>
            <select
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value)}
              aria-label="Вибір розділу"
              className="flex-1 bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer appearance-none"
            >
              {tabGroups.map((g) => (
                g.group
                  ? <optgroup key={g.group} label={g.group} className="bg-ecalc-darksurf text-white/60">
                      {g.tabs.map((tab) => (
                        <option key={tab.value} value={tab.value} className="bg-ecalc-darksurf text-white">{tab.label}</option>
                      ))}
                    </optgroup>
                  : g.tabs.map((tab) => (
                      <option key={tab.value} value={tab.value} className="bg-ecalc-darksurf text-white">{tab.label}</option>
                    ))
              ))}
            </select>
            <svg className="h-4 w-4 flex-shrink-0 text-white/50 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <button type="button" onClick={handleShare} aria-label="Поділитись" className="flex-shrink-0 rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
              <Link2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toastVisible && (
        <div className="animate-fade-in fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-ecalc-darksurf px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          <Link2 className="h-4 w-4 text-ecalc-orange" />
          Посилання скопійовано
        </div>
      )}

      {/* ── Engineering models notice ── */}
      <div className="rounded-2xl border border-white/10 bg-ecalc-darksurf px-5 py-4 space-y-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Фізичні моделі</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

          <div className="rounded-xl border border-ecalc-orange/20 bg-ecalc-orange/5 px-3 py-2.5">
            <div className="mb-1">
              <span className="inline-flex items-center rounded-full bg-ecalc-orange/15 border border-ecalc-orange/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ecalc-orange">Altmann Motor</span>
            </div>
            <p className="text-[11px] text-white/55 leading-relaxed">
              back-EMF + advance ratio. База <span className="text-white/80 font-medium">80 моторів</span>.
            </p>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
            <div className="mb-1">
              <span className="inline-flex items-center rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-400 whitespace-nowrap">Peukert + V-Sag</span>
            </div>
            <p className="text-[11px] text-white/55 leading-relaxed">
              Реальна ємність АКБ + просадка напруги.
            </p>
          </div>

          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2.5">
            <div className="mb-1">
              <span className="inline-flex items-center rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-purple-400">Reynolds Polars</span>
            </div>
            <p className="text-[11px] text-white/55 leading-relaxed">
              Корекція CD₀ та CL_max при Re&lt;300k. Два проходи.
            </p>
          </div>

          <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 px-3 py-2.5">
            <div className="mb-1">
              <span className="inline-flex items-center rounded-full bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-400">UIUC Prop DB</span>
            </div>
            <p className="text-[11px] text-white/55 leading-relaxed">
              Реальні Ct/Cp для <span className="text-white/80 font-medium">33 пропелерів</span>.
            </p>
          </div>

          <button type="button" onClick={() => handleTabChange('windprofile')}
            className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2.5 text-left transition-colors hover:border-sky-500/40 hover:bg-sky-500/10 cursor-pointer">
            <div className="mb-1 flex items-center justify-between gap-1">
              <span className="inline-flex items-center rounded-full bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-400 whitespace-nowrap">Log Wind Profile</span>
              <span className="text-[10px] text-sky-400/60">→</span>
            </div>
            <p className="text-[11px] text-white/55 leading-relaxed">ISO 4354 — швидкість вітру на висоті за 8 класами рельєфу.</p>
          </button>

          <button type="button" onClick={() => handleTabChange('slipstream')}
            className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-3 py-2.5 text-left transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/10 cursor-pointer">
            <div className="mb-1 flex items-center justify-between gap-1">
              <span className="inline-flex items-center rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-400 whitespace-nowrap">Slipstream Drag</span>
              <span className="text-[10px] text-indigo-400/60">→</span>
            </div>
            <p className="text-[11px] text-white/55 leading-relaxed">Actuator disk — пропвош БПЛА і додатковий аеродинамічний опір.</p>
          </button>

          <button type="button" onClick={() => handleTabChange('thermalcooling')}
            className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-left transition-colors hover:border-rose-500/40 hover:bg-rose-500/10 cursor-pointer">
            <div className="mb-1 flex items-center justify-between gap-1">
              <span className="inline-flex items-center rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-400 whitespace-nowrap">Thermal Cooling</span>
              <span className="text-[10px] text-rose-400/60">→</span>
            </div>
            <p className="text-[11px] text-white/55 leading-relaxed">Ram-air охолодження ESC/мотору — площа повітрозабірника за ΔT.</p>
          </button>

          <button type="button" onClick={() => handleTabChange('acoustic')}
            className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-left transition-colors hover:border-amber-500/40 hover:bg-amber-500/10 cursor-pointer">
            <div className="mb-1 flex items-center justify-between gap-1">
              <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-400 whitespace-nowrap">Acoustic OASPL</span>
              <span className="text-[10px] text-amber-400/60">→</span>
            </div>
            <p className="text-[11px] text-white/55 leading-relaxed">Шум пропелера в дБ(A) — лопаті, Mach, відстань, мультиротор.</p>
          </button>

        </div>
      </div>

      {/* ── Main layout ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="lg:grid lg:grid-cols-[268px,1fr] gap-6 items-start">

        {/* ── Desktop sidebar ── */}
        <div className="hidden lg:block dashboard-nav rounded-[24px] p-3 text-white lg:sticky lg:top-24" data-testid="dashboard-sidebar">
          {/* Header */}
          <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/40 font-semibold">Калькулятори</div>
            <h2 className="display-font mt-1.5 text-lg font-bold text-white leading-tight">droneCalc 🇺🇦</h2>
            <p className="mt-1.5 text-xs text-white/55 leading-relaxed">Безкоштовний калькулятор для RC-авіації</p>
            <button type="button" onClick={handleShare} className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-semibold tracking-[0.02em] text-white/80 transition-all duration-150 hover:bg-white/16 hover:text-white hover:border-white/25">
              <Link2 className="h-3.5 w-3.5" /> Поділитись посиланням
            </button>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
              <div className="metric-tile-dark text-center">
                <div className="text-[9px] text-white/40 uppercase tracking-[0.06em]">Розділів</div>
                <div className="mt-0.5 text-xl font-bold text-white tabular-nums">{tabs.filter(t => t.value !== 'dashboard').length}</div>
              </div>
              <div className="metric-tile-dark text-center">
                <div className="text-[9px] text-white/40 uppercase tracking-[0.06em]">Інструментів</div>
                <div className="mt-0.5 text-xl font-bold text-white tabular-nums">170+</div>
              </div>
            </div>
          </div>

          {/* Grouped nav */}
          <TabsList className="h-auto w-full flex-col items-stretch bg-transparent p-0 gap-0.5" aria-label="Навігація калькуляторів" data-testid="dashboard-tabs">
            {tabGroups.map((g) => (
              <div key={g.group ?? '__home'}>
                {g.group && (
                  <div className="px-2.5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                    {g.group}
                  </div>
                )}
                {g.tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = tab.value === activeTab
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      data-testid={`dashboard-tab-${tab.value}`}
                      className="w-full justify-start gap-3 rounded-xl bg-transparent px-3 py-2.5 text-white/65 transition-all duration-150 hover:bg-white/10 hover:text-white data-[state=active]:bg-ecalc-orange data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                      <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-current'}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-left text-[12.5px] leading-snug font-medium truncate">{tab.shortLabel}</span>
                    </TabsTrigger>
                  )
                })}
              </div>
            ))}
          </TabsList>
        </div>

        {/* ── Content area ── */}
        <div className="min-w-0">
          <TabsContent value="dashboard" data-testid="tab-panel-dashboard">
            <Card className="calc-surface overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">🛫 Калькулятори електроприводів</CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed">
                  24 розділи: аеродинаміка, навігація, пропульсія, електроніка, RF та планування місії. Безкоштовно, без реєстрації.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-3 sm:px-6">
                {/* Mission planning highlight */}
                <button
                  type="button"
                  onClick={() => handleTabChange('mission')}
                  className="group w-full rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border border-ecalc-orange/30 bg-gradient-to-r from-ecalc-orange/10 to-ecalc-navy/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-ecalc-orange/15 text-ecalc-orange">
                      <Navigation className="h-5 w-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ecalc-orange">Нове</div>
                      <div className="text-sm font-bold text-ecalc-navy leading-snug">Центр планування місії</div>
                      <div className="mt-0.5 text-xs text-ecalc-muted">Ендюранс, тактичний радіус, бюджет маршруту з урахуванням резерву</div>
                    </div>
                    <svg className="h-5 w-5 flex-shrink-0 text-ecalc-orange/50 group-hover:text-ecalc-orange transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { tab: 'windprofile',   accent: true,  tag: '🆕 Wind Profile', title: 'Профіль вітру',               desc: 'ISO 4354 — швидкість вітру на висоті за 8 класами рельєфу.' },
                    { tab: 'thermalcooling',accent: true,  tag: '🆕 Cooling',      title: 'Ram-Air охолодження',         desc: 'Мінімальна площа NACA duct для відведення тепла ESC/мотора.' },
                    { tab: 'acoustic',      accent: true,  tag: '🆕 Acoustic',     title: 'Акустичний підпис OASPL',     desc: 'Шум пропелера в дБ(A) — лопаті, Mach, відстань, мультиротор.' },
                    { tab: 'slipstream',    accent: true,  tag: '🆕 Slipstream',   title: 'Slipstream Drag',             desc: 'Actuator disk — пропвош БПЛА, динамічний тиск в сліді та опір тіл.' },
                    { tab: 'perfcalc',     accent: true,  tag: 'perfCalc',    title: 'Продуктивність літака',     desc: 'Потужність, швидкість Карсона, зрив, кут набору, тяга/вага.' },
                    { tab: 'xcoptercalc',  accent: true,  tag: 'xcopterCalc', title: 'Мультиротор',               desc: 'Час висіння, запас тяги, витрати потужності, оцінка вильоту.' },
                    { tab: 'propcalc',     accent: false, tag: 'propCalc',    title: 'Мотор + Пропелер',          desc: 'Підбір пропелера, тяга, струм і потужність приводу.' },
                    { tab: 'cgcalc',       accent: false, tag: 'cgCalc',      title: 'Центр ваги',                desc: 'Центр ваги літака за секціями та позицією компонентів.' },
                    { tab: 'aeronav',      accent: true,  tag: 'Aero + Nav',  title: 'Аеродинаміка і маршрут',   desc: 'Reynolds, ортодромія, локсодромія, поправка на вітер.' },
                    { tab: 'coords',       accent: false, tag: 'Coordinates', title: 'Системи координат',         desc: 'ECEF, ENU, UTM, Haversine, bearing, destination.' },
                    { tab: 'engineering',  accent: true,  tag: 'Engineering', title: 'Місія, тяга, L/D, батарея', desc: 'TAS/EAS, Бреге, CLmax, ROC, C-rate, torque, efficiency.' },
                    { tab: 'avionics',     accent: false, tag: 'Avionics',    title: 'ESC, RF, thermals, PWM',    desc: 'Втрати ESC, кабелі, ripple, receiver sensitivity, дальність.' },
                    { tab: 'geometry',     accent: false, tag: 'Geometry',    title: 'AR, MAC, taper, tail',      desc: 'Крило, хвіст, фюзеляж, товщина профілю, washout.' },
                    { tab: 'environment',  accent: true,  tag: 'Environment', title: 'Погода, RF, обмерзання',    desc: 'Gusts, EDR, density altitude, cloud base, icing, solar.' },
                    { tab: 'radiohorizon', accent: true,  tag: 'Radio',       title: 'LOS, k-factor, radar range',desc: 'Горизонт, effective Earth radius, FSPL, air-ground link.' },
                    { tab: 'frequency',    accent: false, tag: 'Frequency',   title: 'RF, PWM, LC/RC, Shannon',  desc: 'Частоти, Wi-Fi канали, доплер, фільтри, інтермодуляція.' },
                    { tab: 'dronetools',   accent: false, tag: 'Drone Tools', title: 'Польові інструменти',       desc: 'ISA, LiPo, тяга, одиниці, енергія батареї, геометрія рами.' },
                    { tab: 'soldering',    accent: true,  tag: 'Soldering',   title: 'Heat, PID, reflow, stencil',desc: 'Тепловкладення, heater resistance, reflow profile, paste.' },
                    { tab: 'ballistics',   accent: true,  tag: 'Балістика',   title: 'Скидання вантажу',          desc: 'Дальність падіння, час польоту, швидкість удару — з опором і без.' },
                    { tab: 'ew',           accent: true,  tag: 'РЕБ',         title: 'Стійкість лінку зв\'язку',  desc: 'J/S ratio, BW-штраф загороджувача, PG для ELRS/LoRa, макс. дальність РЕБ.' },
                    { tab: 'optics',       accent: false, tag: 'Оптика',      title: 'GSD, камера, радіоканал',   desc: 'Роздільна здатність знімку, дальність виявлення, Link Budget.' },
                    { tab: 'battery',      accent: false, tag: 'Battery Pack', title: 'Battery Pack Builder',      desc: 'S/P конфігурація, IR, Ragone, C-rate, ємність та напруга паку.' },
                    { tab: 'dronedb',      accent: false, tag: 'База дронів',  title: 'ТТХ дронів',                desc: 'Технічні характеристики серійних БПЛА — маса, дальність, висота.' },
                  ].map(({ tab, accent, tag, title, desc }) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => handleTabChange(tab)}
                      className={`group w-full rounded-2xl p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
                        accent
                          ? 'border border-ecalc-orange/20 bg-gradient-to-br from-ecalc-orange/6 to-[#1c2235] hover:border-ecalc-orange/35'
                          : 'border border-ecalc-border bg-[#161b27] hover:border-ecalc-border/60 hover:bg-ecalc-lightbg/80'
                      }`}
                    >
                      <div className={`text-[9px] font-bold uppercase tracking-[0.2em] ${accent ? 'text-ecalc-orange' : 'text-ecalc-muted'}`}>{tag}</div>
                      <div className="mt-1 text-sm font-semibold text-ecalc-navy leading-snug">{title}</div>
                      <div className="mt-0.5 text-[11px] text-ecalc-muted leading-relaxed">{desc}</div>
                    </button>
                  ))}
                </div>

                {/* Disclaimer */}
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/50 leading-relaxed">
                  Всі дані отримані з відкритих джерел. Інструмент має довідковий та освітній характер і не призначений для практичного використання. Інструмент не призначений для використання в умовах реальних операцій або прийняття рішень.
                </div>

                {/* Privacy strip */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Без Google Analytics', 'Без трекерів', 'Без зовнішніх шрифтів', 'Розрахунки локально', 'Офлайн-режим'].map((badge) => (
                    <span key={badge} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ecalc-green/10 border border-ecalc-green/25 text-ecalc-green text-[11px] font-medium">
                      <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                      {badge}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mission"      data-testid="tab-panel-mission">{activeTab === 'mission'      && <ErrorBoundary><MissionPlanningSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="dronedb"      data-testid="tab-panel-dronedb">{activeTab === 'dronedb'      && <ErrorBoundary><DroneDatabase /></ErrorBoundary>}</TabsContent>
          <TabsContent value="perfcalc"     data-testid="tab-panel-perfcalc">{activeTab === 'perfcalc'     && <ErrorBoundary><PerfCalc /></ErrorBoundary>}</TabsContent>
          <TabsContent value="propcalc"     data-testid="tab-panel-propcalc">{activeTab === 'propcalc'     && <ErrorBoundary><PropCalcBasic /></ErrorBoundary>}</TabsContent>
          <TabsContent value="xcoptercalc"  data-testid="tab-panel-xcoptercalc">{activeTab === 'xcoptercalc'  && <ErrorBoundary><XcopterCalcBasic /></ErrorBoundary>}</TabsContent>
          <TabsContent value="cgcalc"       data-testid="tab-panel-cgcalc">{activeTab === 'cgcalc'       && <ErrorBoundary><CGCalcBasic /></ErrorBoundary>}</TabsContent>
          <TabsContent value="aeronav"      data-testid="tab-panel-aeronav">{activeTab === 'aeronav'      && <ErrorBoundary><AeroNavigationSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="engineering"  data-testid="tab-panel-engineering">{activeTab === 'engineering'  && <ErrorBoundary><AviationEngineeringSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="avionics"     data-testid="tab-panel-avionics">{activeTab === 'avionics'     && <ErrorBoundary><AvionicsElectronicsSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="geometry"     data-testid="tab-panel-geometry">{activeTab === 'geometry'     && <ErrorBoundary><AircraftGeometrySuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="environment"  data-testid="tab-panel-environment">{activeTab === 'environment'  && <ErrorBoundary><ExternalFactorsSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="radiohorizon" data-testid="tab-panel-radiohorizon">{activeTab === 'radiohorizon' && <ErrorBoundary><RadioHorizonSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="coords"       data-testid="tab-panel-coords">{activeTab === 'coords'       && <ErrorBoundary><CoordinateSystemsSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="frequency"    data-testid="tab-panel-frequency">{activeTab === 'frequency'    && <ErrorBoundary><FrequencyToolsSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="soldering"    data-testid="tab-panel-soldering">{activeTab === 'soldering'    && <ErrorBoundary><SolderingSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="dronetools"   data-testid="tab-panel-dronetools">{activeTab === 'dronetools'   && <ErrorBoundary><DroneEngineerToolset /></ErrorBoundary>}</TabsContent>
          <TabsContent value="ballistics"   data-testid="tab-panel-ballistics">{activeTab === 'ballistics'   && <ErrorBoundary><BallisticsSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="optics"       data-testid="tab-panel-optics">{activeTab === 'optics'       && <ErrorBoundary><OpticsSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="battery"      data-testid="tab-panel-battery">{activeTab === 'battery'      && <ErrorBoundary><BatteryPackSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="ew"            data-testid="tab-panel-ew">{activeTab === 'ew'            && <ErrorBoundary><EwJammingSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="windprofile"  data-testid="tab-panel-windprofile">{activeTab === 'windprofile'  && <ErrorBoundary><WindProfileSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="thermalcooling" data-testid="tab-panel-thermalcooling">{activeTab === 'thermalcooling' && <ErrorBoundary><ThermalCoolingSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="acoustic"     data-testid="tab-panel-acoustic">{activeTab === 'acoustic'     && <ErrorBoundary><AcousticSuite /></ErrorBoundary>}</TabsContent>
          <TabsContent value="slipstream"  data-testid="tab-panel-slipstream">{activeTab === 'slipstream'  && <ErrorBoundary><SlipstreamSuite /></ErrorBoundary>}</TabsContent>
        </div>
      </Tabs>
    </section>
  )
}
