'use client'

import { useMemo, useState } from 'react'
import { Database, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  droneDb,
  droneTypeColors,
  threatColors,
  originFlag,
  type Drone,
  type DroneType,
} from '@/lib/drone-db'

const ALL_TYPES = 'all'

export function DroneDatabase() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<DroneType | typeof ALL_TYPES>(ALL_TYPES)
  const [expanded, setExpanded] = useState<number | null>(null)

  const types = useMemo(() => {
    const set = new Set(droneDb.map((d) => d.type))
    return Array.from(set).sort()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return droneDb.filter((d) => {
      const matchType = typeFilter === ALL_TYPES || d.type === typeFilter
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.specs.toLowerCase().includes(q) || d.origin.toLowerCase().includes(q)
      return matchType && matchSearch
    })
  }, [search, typeFilter])

  const stats = useMemo(() => {
    const byType: Record<string, number> = {}
    droneDb.forEach((d) => { byType[d.type] = (byType[d.type] ?? 0) + 1 })
    return byType
  }, [])

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="calc-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ecalc-orange/15 text-ecalc-orange">
                <Database className="h-4 w-4" />
              </div>
              <h2 className="display-font text-xl font-bold text-ecalc-navy">База дронів</h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-ecalc-muted">
              {droneDb.length} платформ з ТТХ, батареями та тактичними характеристиками.
              Натисни <span className="text-ecalc-orange font-medium">«Розрахувати»</span> — параметри дрона підставляться в калькулятор автоматично.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats).map(([type, count]) => (
              <div key={type} className="metric-tile min-w-[80px] text-center">
                <div className="text-xs text-ecalc-muted truncate">{type}</div>
                <div className="text-lg font-bold text-ecalc-navy">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ecalc-muted" />
            <Input
              placeholder="Пошук за назвою, характеристиками..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as DroneType | typeof ALL_TYPES)}
            className="sm:w-52"
          >
            <option value={ALL_TYPES}>Всі типи ({droneDb.length})</option>
            {types.map((t) => (
              <option key={t} value={t}>{t} ({stats[t] ?? 0})</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-ecalc-muted">
        Показано {filtered.length} з {droneDb.length} записів
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((drone) => (
          <DroneCard
            key={drone.id}
            drone={drone}
            isExpanded={expanded === drone.id}
            onToggle={() => setExpanded(expanded === drone.id ? null : drone.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ecalc-border p-10 text-center text-sm text-ecalc-muted">
          Нічого не знайдено — спробуй інший запит або тип
        </div>
      )}
    </section>
  )
}

function DroneCard({
  drone,
  isExpanded,
  onToggle,
}: {
  drone: Drone
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="calc-surface flex flex-col overflow-hidden">
      {/* Top stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-ecalc-orange/60 to-ecalc-orange/20" />

      <div className="flex flex-1 flex-col p-4 gap-3">
        {/* Name + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-ecalc-navy leading-snug">{drone.name}</div>
            <div className="mt-0.5 text-xs text-ecalc-muted">{originFlag[drone.origin]} {drone.origin}</div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${droneTypeColors[drone.type]}`}>
              {drone.type}
            </span>
            <span className={`text-[10px] font-semibold ${threatColors[drone.threat]}`}>
              ⚡ {drone.threat}
            </span>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Маса" value={formatWeight(drone.weight_g)} />
          <Metric label="Payload" value={formatWeight(drone.payload_g)} />
          <Metric label="Дальність" value={`${drone.range_km} км`} />
          <Metric label="Час пол." value={formatTime(drone.endurance_min)} />
          <Metric label="Швидкість" value={`${drone.speed_kmh} км/год`} />
          <Metric label="Батарея" value={drone.battery_mah ? `${(drone.battery_mah / 1000).toFixed(1)} Аг` : '—'} />
        </div>

        {/* Expandable specs */}
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1 text-left text-xs text-ecalc-muted hover:text-ecalc-text transition-colors"
        >
          {isExpanded ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
          {isExpanded ? 'Згорнути' : 'Докладніше'}
        </button>
        {isExpanded && (
          <div className="rounded-lg border border-ecalc-border/50 bg-ecalc-lightbg/60 p-3 text-xs leading-relaxed text-ecalc-muted">
            {drone.specs}
          </div>
        )}

      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ecalc-border/50 bg-ecalc-lightbg/40 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.1em] text-ecalc-muted">{label}</div>
      <div className="mt-0.5 text-xs font-semibold text-ecalc-navy tabular-nums">{value}</div>
    </div>
  )
}

function formatWeight(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(g >= 10000 ? 0 : 1)} кг`
  return `${g} г`
}

function formatTime(min: number): string {
  if (min >= 60) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}г ${m}хв` : `${h} год`
  }
  return `${min} хв`
}
