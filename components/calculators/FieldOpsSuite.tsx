'use client'

import { useMemo } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import {
  evaluatePreflight, evaluateBingoRtl, missionRiskIndex,
  type PreflightInput, type BingoInput, type MissionRiskInput,
} from '@/lib/field-ops'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert, ShieldCheck, AlertTriangle, Clock, Battery } from 'lucide-react'

// ── Shared field primitive ────────────────────────────────────────────────────

function Field({
  id, label, hint, value, step = 1, min, onChange,
}: {
  id: string; label: string; hint?: string
  value: number; step?: number; min?: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id} type="number" step={step} min={min}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="text-[11px] text-ecalc-muted">{hint}</p>}
    </div>
  )
}

function Toggle({ id, label, value, onChange }: {
  id: string; label: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        id={id} type="button" role="switch" aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          value ? 'bg-ecalc-orange' : 'bg-ecalc-border'
        }`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <Label htmlFor={id} className="cursor-pointer">{label}</Label>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    SAFE:   { label: 'БЕЗПЕЧНО',  cls: 'border-green-500/40 bg-green-500/10 text-green-400',    icon: <ShieldCheck className="w-4 h-4" /> },
    safe:   { label: 'БЕЗПЕЧНО',  cls: 'border-green-500/40 bg-green-500/10 text-green-400',    icon: <ShieldCheck className="w-4 h-4" /> },
    CAUTION:{ label: 'ОБЕРЕЖНО', cls: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400', icon: <AlertTriangle className="w-4 h-4" /> },
    caution:{ label: 'ОБЕРЕЖНО', cls: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400', icon: <AlertTriangle className="w-4 h-4" /> },
    ABORT:  { label: 'ВІДБІЙ',   cls: 'border-red-500/40 bg-red-500/10 text-red-400',          icon: <ShieldAlert className="w-4 h-4" /> },
    unsafe: { label: 'НЕБЕЗПЕЧНО',cls: 'border-red-500/40 bg-red-500/10 text-red-400',         icon: <ShieldAlert className="w-4 h-4" /> },
  }
  const s = map[status] ?? { label: status, cls: 'border-ecalc-border bg-ecalc-lightbg text-ecalc-muted', icon: null }
  return (
    <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${s.cls}`}>
      {s.icon}{s.label}
    </div>
  )
}

function ReasonList({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return <p className="text-xs text-ecalc-green">Всі параметри в нормі</p>
  return (
    <ul className="space-y-1">
      {reasons.map((r) => (
        <li key={r} className="flex items-start gap-1.5 text-xs text-yellow-400">
          <span className="mt-0.5 shrink-0">⚠</span>
          <span className="font-mono">{r}</span>
        </li>
      ))}
    </ul>
  )
}

// ── 1. Preflight Gate ─────────────────────────────────────────────────────────

const PREFLIGHT_DEFAULTS: PreflightInput = {
  windGust: 5, windLimit: 10, reserveFeasible: true,
  linkMarginDb: 12, packetLossPct: 5, gpsSatCount: 12, homeLock: true,
}

function PreflightGate() {
  const [inp, setInp] = usePersistedState<PreflightInput>('fieldops.preflight.v1', PREFLIGHT_DEFAULTS)
  function set<K extends keyof PreflightInput>(k: K, v: PreflightInput[K]) {
    setInp((p) => ({ ...p, [k]: v }))
  }
  const result = useMemo(() => evaluatePreflight(inp), [inp])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preflight Gate — Допуск до вильоту</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="windGust"     label="Порив вітру (м/с)"      value={inp.windGust}      step={0.5} min={0} onChange={(v) => set('windGust', v)} />
          <Field id="windLimit"    label="Ліміт БПЛА (м/с)"       value={inp.windLimit}     step={0.5} min={0} onChange={(v) => set('windLimit', v)} />
          <Field id="linkMarginDb" label="Link margin (дБ)"        value={inp.linkMarginDb}  step={1}   onChange={(v) => set('linkMarginDb', v)} />
          <Field id="packetLoss"   label="Packet loss (%)"         value={inp.packetLossPct} step={1} min={0} onChange={(v) => set('packetLossPct', v)} />
          <Field id="gpsSat"       label="GPS супутники"           value={inp.gpsSatCount}   step={1} min={0} onChange={(v) => set('gpsSatCount', v)} />
        </div>
        <div className="space-y-3">
          <Toggle id="reserveOk" label="Резерв батареї feasible" value={inp.reserveFeasible} onChange={(v) => set('reserveFeasible', v)} />
          <Toggle id="homeLock"  label="Home point locked"        value={inp.homeLock}        onChange={(v) => set('homeLock', v)} />
        </div>

        <div className="rounded-xl border border-ecalc-border/60 bg-ecalc-lightbg/30 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <StatusBadge status={result.status} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-ecalc-muted">Оцінка:</span>
              <span className="text-2xl font-bold text-ecalc-orange tabular-nums">{result.score}</span>
              <span className="text-xs text-ecalc-muted">/100</span>
            </div>
          </div>
          <ReasonList reasons={result.reasons} />
        </div>
      </CardContent>
    </Card>
  )
}

// ── 2. Bingo RTL ──────────────────────────────────────────────────────────────

const BINGO_DEFAULTS: BingoInput = {
  distanceToHomeKm: 5, groundSpeedBackKmh: 80, currentA: 20,
  batteryRemainingMah: 5000, reservePct: 20, windPenaltyPct: 0,
}

function BingoRtl() {
  const [inp, setInp] = usePersistedState<BingoInput>('fieldops.bingo.v1', BINGO_DEFAULTS)
  function set<K extends keyof BingoInput>(k: K, v: number) {
    setInp((p) => ({ ...p, [k]: v }))
  }
  const result = useMemo(() => evaluateBingoRtl(inp), [inp])

  const turnSec = Math.round(result.latestTurnbackTimeSec)
  const turnMin = Math.floor(turnSec / 60)
  const turnRemSec = turnSec % 60

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bingo RTL — Остання точка повернення</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="distHome"     label="Дистанція до дому (км)"     value={inp.distanceToHomeKm}    step={0.5} min={0} onChange={(v) => set('distanceToHomeKm', v)} />
          <Field id="speedBack"    label="Зворотна швидкість (км/год)" value={inp.groundSpeedBackKmh}  step={5}   min={1} onChange={(v) => set('groundSpeedBackKmh', v)} />
          <Field id="currentA"     label="Поточний струм (А)"         value={inp.currentA}            step={0.5} min={0.1} onChange={(v) => set('currentA', v)} />
          <Field id="battMah"      label="Залишок батареї (мАг)"      value={inp.batteryRemainingMah} step={100} min={0} onChange={(v) => set('batteryRemainingMah', v)} />
          <Field id="reservePct"   label="Резерв (%)"                  value={inp.reservePct}          step={1}   min={0} onChange={(v) => set('reservePct', v)} hint="Відсоток батареї залишити як резерв" />
          <Field id="windPenalty"  label="Штраф вітру (%)"            value={inp.windPenaltyPct}      step={5}   min={0} onChange={(v) => set('windPenaltyPct', v)} hint="Зниження зворотної швидкості через зустрічний вітер" />
        </div>

        <div className="rounded-xl border border-ecalc-border/60 bg-ecalc-lightbg/30 p-4 space-y-3">
          {result.bingoNow ? (
            <div className="flex items-center gap-2 text-red-400 font-bold text-base">
              <Battery className="w-5 h-5" />
              BINGO! Розворот ЗАРАЗ
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-400 font-semibold text-base">
              <Clock className="w-5 h-5" />
              Можна летіти ще {turnMin}:{String(turnRemSec).padStart(2, '0')} хв
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-xs text-ecalc-muted">
            <div>Потрібно: <span className="text-ecalc-text font-mono">{result.requiredMah.toFixed(0)} мАг</span></div>
            <div>Доступно: <span className="text-ecalc-text font-mono">{result.availableMah.toFixed(0)} мАг</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── 3. Mission Risk Index ─────────────────────────────────────────────────────

const MRI_DEFAULTS: MissionRiskInput = {
  batteryWarning: 'ok', linkMarginDb: 12, thermalHeadroomPct: 40,
  reserveMet: true, windPenaltyPct: 5,
}

function MriPanel() {
  const [inp, setInp] = usePersistedState<MissionRiskInput>('fieldops.mri.v1', MRI_DEFAULTS)
  function set<K extends keyof MissionRiskInput>(k: K, v: MissionRiskInput[K]) {
    setInp((p) => ({ ...p, [k]: v }))
  }
  const result = useMemo(() => missionRiskIndex(inp), [inp])

  const batOptions: Array<{ value: MissionRiskInput['batteryWarning']; label: string }> = [
    { value: 'ok',       label: 'OK' },
    { value: 'warning',  label: 'Попередження' },
    { value: 'critical', label: 'Критично' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mission Risk Index — Інтегральна оцінка місії</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="batWarn">Батарея</Label>
            <select
              id="batWarn"
              value={inp.batteryWarning}
              onChange={(e) => set('batteryWarning', e.target.value as MissionRiskInput['batteryWarning'])}
              className="w-full rounded-md border border-ecalc-border bg-ecalc-lightbg px-3 py-2 text-sm text-ecalc-text"
            >
              {batOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <Field id="mriLink"    label="Link margin (дБ)"       value={inp.linkMarginDb}       step={1}   onChange={(v) => set('linkMarginDb', v)} />
          <Field id="mriTherm"   label="Тепловий запас (%)"     value={inp.thermalHeadroomPct} step={5} min={0} onChange={(v) => set('thermalHeadroomPct', v)} />
          <Field id="mriWind"    label="Штраф вітру (%)"        value={inp.windPenaltyPct ?? 0}step={5} min={0} onChange={(v) => set('windPenaltyPct', v)} />
        </div>
        <Toggle id="mriReserve" label="Резерв виконано" value={inp.reserveMet} onChange={(v) => set('reserveMet', v)} />

        <div className="rounded-xl border border-ecalc-border/60 bg-ecalc-lightbg/30 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <StatusBadge status={result.class} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-ecalc-muted">MRI:</span>
              <span className="text-2xl font-bold text-ecalc-orange tabular-nums">{result.score}</span>
              <span className="text-xs text-ecalc-muted">/100</span>
            </div>
          </div>
          <ReasonList reasons={result.reasons} />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────

export function FieldOpsSuite() {
  return (
    <section className="space-y-6">
      {/* Hero */}
      <div className="calc-hero">
        <div className="relative z-10 px-5 py-6 sm:px-6 sm:py-7">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
            Польові рішення
          </div>
          <h3 className="display-font mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Field Ops — Польові інструменти
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72">
            Три P0-інструменти для оперативних рішень: Preflight Gate (допуск до вильоту з оцінкою score та reasons), Bingo RTL (остання точка повернення за батареєю та вітром), Mission Risk Index (інтегральна оцінка 0–100 з класом safe/caution/unsafe).
          </p>
        </div>
      </div>

      <PreflightGate />
      <BingoRtl />
      <MriPanel />
    </section>
  )
}
