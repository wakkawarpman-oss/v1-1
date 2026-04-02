'use client'

import { useState } from 'react'
import { Battery, Clock, Flame, ShieldAlert, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CalcEmptyState, Field, formatToolNumber, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { usePersistedState } from '@/hooks/usePersistedState'
import {
  CELL_DATABASE,
  batteryPack,
  hoverTimeFromPack,
  packMaxCurrent,
  cRate,
  packEnergyDensity,
  lipoStorageCharge,
  awgSelector,
  parallelChargeSafety,
  type BatteryPackResult,
} from '@/lib/battery-pack'
import {
  CELL_DB,
  LIPO_DB,
  peukertCapacityMah,
  peukertFlightTimeMin,
  type CellFormFactor,
  type LiPoPackSpec,
} from '@/lib/battery-db'

// ── Pack Builder ──────────────────────────────────────────────────────────────

type PackBuilderState = {
  s: number
  p: number
  cellId: string
  formFactor: CellFormFactor | 'all'
  loadCurrentA: number
  customCapacityMah: number
  customNominalV: number
  customMaxA: number
  customRiMOhms: number
  customWeightG: number
}

const BUILDER_DEFAULTS: PackBuilderState = {
  s: 6, p: 1, cellId: 'molicel-p42a', formFactor: 'all', loadCurrentA: 30,
  customCapacityMah: 3000, customNominalV: 3.7, customMaxA: 20,
  customRiMOhms: 20, customWeightG: 65,
}

const FF_TABS: { value: PackBuilderState['formFactor']; label: string }[] = [
  { value: 'all',   label: 'Всі' },
  { value: '18650', label: '18650' },
  { value: '21700', label: '21700' },
]

function PackBuilderCard({ onPackBuilt }: { onPackBuilt: (capacityAh: number, voltageV: number) => void }) {
  const [state, setState] = usePersistedState('batterypack.builder', BUILDER_DEFAULTS)
  const [result, setResult] = useState<BatteryPackResult | null>(null)

  const visibleCells = CELL_DB.filter(
    (c) => c.id === 'custom' || state.formFactor === 'all' || c.formFactor === state.formFactor
  )

  function calculate() {
    const r = batteryPack({
      s: state.s, p: state.p,
      cellId: state.cellId,
      loadCurrentA: state.loadCurrentA,
      customCell: state.cellId === 'custom' ? {
        capacityMah: state.customCapacityMah,
        nominalVoltageV: state.customNominalV,
        maxContinuousA: state.customMaxA,
        riMOhms: state.customRiMOhms,
        weightG: state.customWeightG,
      } : undefined,
    })
    setResult(r)
    if (r) onPackBuilt(r.capacityAh, r.nominalVoltageV)
  }

  const selectedCell = CELL_DB.find((c) => c.id === state.cellId)
  const maxPack = selectedCell ? packMaxCurrent(state.s, state.p, state.cellId) : 0

  // Peukert-corrected capacity at actual load current (per-cell current in parallel)
  const peukertCorrectedMah = selectedCell && result
    ? peukertCapacityMah(
        selectedCell.capacityMah * state.p,
        state.loadCurrentA,
        selectedCell.peukertK ?? 1.05,
      )
    : null
  const peukertFlightTime = selectedCell && result
    ? peukertFlightTimeMin(
        selectedCell.capacityMah * state.p,
        state.loadCurrentA,
        selectedCell.peukertK ?? 1.05,
      )
    : null

  return (
    <ToolCard
      icon={<Battery className="h-4 w-4" />}
      title="Конструктор акумуляторної збірки"
      description="S×P конфігурація, падіння напруги (Закон Ома), тепловтрати (Джоуль–Ленц) та корекція Пекерта."
    >
      {/* Form factor filter tabs */}
      <div className="flex gap-1.5">
        {FF_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setState((s) => ({ ...s, formFactor: tab.value }))}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
              state.formFactor === tab.value
                ? 'bg-ecalc-orange text-white'
                : 'bg-ecalc-orange/10 text-ecalc-orange hover:bg-ecalc-orange/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Field label="Комірка">
        <Select
          title="Комірка" aria-label="Комірка"
          value={state.cellId}
          onChange={(e) => setState((s) => ({ ...s, cellId: e.target.value }))}
        >
          {visibleCells.map((cell) => (
            <option key={cell.id} value={cell.id}>{cell.label}</option>
          ))}
        </Select>
        {selectedCell && (
          <div className="mt-1 text-[10px] text-ecalc-muted leading-relaxed">{selectedCell.notes}</div>
        )}
      </Field>

      {state.cellId === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ємність, мАч">
              <Input type="number" value={state.customCapacityMah} onChange={(e) => setState((s) => ({ ...s, customCapacityMah: Number(e.target.value) }))} />
            </Field>
            <Field label="Номінал, В">
              <Input type="number" step="0.1" value={state.customNominalV} onChange={(e) => setState((s) => ({ ...s, customNominalV: Number(e.target.value) }))} />
            </Field>
            <Field label="Макс. струм, А">
              <Input type="number" value={state.customMaxA} onChange={(e) => setState((s) => ({ ...s, customMaxA: Number(e.target.value) }))} />
            </Field>
            <Field label="Ri, мОм">
              <Input type="number" step="0.5" value={state.customRiMOhms} onChange={(e) => setState((s) => ({ ...s, customRiMOhms: Number(e.target.value) }))} />
            </Field>
            <Field label="Вага, г">
              <Input type="number" value={state.customWeightG} onChange={(e) => setState((s) => ({ ...s, customWeightG: Number(e.target.value) }))} />
            </Field>
          </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Секції (S)" hint="Послідовно">
          <Input type="number" min={1} max={20} value={state.s} onChange={(e) => setState((s) => ({ ...s, s: Number(e.target.value) }))} />
        </Field>
        <Field label="Паралелі (P)" hint="Паралельно">
          <Input type="number" min={1} max={12} value={state.p} onChange={(e) => setState((s) => ({ ...s, p: Number(e.target.value) }))} />
        </Field>
      </div>

      <Field label="Навантаження, А" hint={maxPack > 0 ? `Макс. допустимий: ${maxPack} А` : undefined}>
        <Input type="number" step="0.5" min="0.1" value={state.loadCurrentA} onChange={(e) => setState((s) => ({ ...s, loadCurrentA: Number(e.target.value) }))} />
      </Field>

      <Button onClick={calculate}>Розрахувати</Button>
      {!result && <CalcEmptyState />}
      {result && (
        <div className="space-y-1.5">
          <ResultBox copyValue={formatToolNumber(result.nominalVoltageV, 1)}>
            Напруга (номінал): <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.nominalVoltageV, 1)} В</span>
            <span className="ml-2 text-xs text-ecalc-muted">({formatToolNumber(result.chargedVoltageV, 1)} В заряд / {formatToolNumber(result.cutoffVoltageV, 1)} В відсічка)</span>
          </ResultBox>
          <ResultBox copyValue={formatToolNumber(result.capacityAh, 3)}>
            Ємність (номінал): <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.capacityAh * 1000, 0)} мАч</span>
            {peukertCorrectedMah !== null && (
              <span className="ml-2 text-xs text-ecalc-muted">
                → Пекерт: {formatToolNumber(peukertCorrectedMah, 0)} мАч при {state.loadCurrentA} А
              </span>
            )}
          </ResultBox>
          {peukertFlightTime !== null && peukertFlightTime > 0 && (
            <ResultBox>
              Польотний час (Пекерт, 20% резерв):{' '}
              <span className="font-semibold text-ecalc-navy">{formatToolNumber(peukertFlightTime, 1)} хв</span>
              <span className="ml-2 text-xs text-ecalc-muted">K={selectedCell?.peukertK}</span>
            </ResultBox>
          )}
          <ResultBox copyValue={formatToolNumber(result.energyWh, 2)}>
            Енергія: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.energyWh, 2)} Вт·год</span>
            <span className="ml-2 text-xs text-ecalc-muted">({formatToolNumber(packEnergyDensity(result.energyWh, result.weightG), 0)} Вт·год/кг)</span>
          </ResultBox>
          <ResultBox copyValue={formatToolNumber(result.weightG, 0)}>
            Вага: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.weightG, 0)} г</span>
            <span className="ml-2 text-xs text-ecalc-muted">(з урахуванням +5% кабелів)</span>
          </ResultBox>

          {/* Voltage sag — highlighted red if over-spec */}
          <div className={`rounded-xl border px-3.5 py-2.5 text-sm ${result.loadIsOverSpec ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-ecalc-orange/15 bg-gradient-to-r from-ecalc-orange/6 to-[#161b27] text-ecalc-text'}`}>
            <div className="flex items-center justify-between">
              <span>Падіння напруги під навантаженням:</span>
              <span className="font-semibold">{formatToolNumber(result.voltageSagV, 3)} В</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Напруга під навантаженням:</span>
              <span className="font-semibold">{formatToolNumber(result.voltageUnderLoadV, 2)} В</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Тепловтрати (Джоуль–Ленц):</span>
              <span className="font-semibold">{formatToolNumber(result.powerLossW, 2)} Вт</span>
            </div>
            <div className="flex items-center justify-between">
              <span>C-Rate:</span>
              <span className="font-semibold">{formatToolNumber(cRate(state.loadCurrentA, result.capacityAh), 2)}C</span>
            </div>
            {result.loadIsOverSpec && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <Flame className="h-3 w-3" />
                Струм на комірку ({formatToolNumber(result.currentPerCellA, 1)} А) перевищує допустимий ({selectedCell?.maxContinuousA} А) — перегрів!
              </div>
            )}
          </div>
        </div>
      )}
    </ToolCard>
  )
}

// ── Hover Time Estimator ──────────────────────────────────────────────────────

type HoverState = {
  auwKg: number
  efficiencyGW: number
  packCapacityAh: number
  packVoltageV: number
  dischargeLimit: number
}

const HOVER_DEFAULTS: HoverState = {
  auwKg: 1.5, efficiencyGW: 7.5, packCapacityAh: 4.2, packVoltageV: 22.2, dischargeLimit: 80,
}

function HoverCard({ packSuggestion }: { packSuggestion: { capacityAh: number; voltageV: number } | null }) {
  const [state, setState] = usePersistedState('batterypack.hover', HOVER_DEFAULTS)
  const [result, setResult] = useState<number | null>(null)

  function calculate() {
    setResult(hoverTimeFromPack({
      auwKg: state.auwKg,
      efficiencyGW: state.efficiencyGW,
      packCapacityAh: state.packCapacityAh,
      voltageV: state.packVoltageV,
      dischargeLimit: state.dischargeLimit / 100,
    }))
  }

  return (
    <ToolCard
      icon={<Clock className="h-4 w-4" />}
      title="Час висіння (мультиротор)"
      description="Оцінка часу висіння за моделлю P = AUW / ефективність (г/Вт) та зарядом акумулятора."
    >
      {packSuggestion && (
        <button
          type="button"
          onClick={() => setState((s) => ({ ...s, packCapacityAh: packSuggestion.capacityAh, packVoltageV: packSuggestion.voltageV }))}
          className="w-full rounded-xl border border-ecalc-orange/30 bg-ecalc-orange/8 px-3 py-2 text-left text-xs font-medium text-ecalc-orange transition-colors hover:bg-ecalc-orange/15"
        >
          ← Заповнити з конструктора: {(packSuggestion.capacityAh * 1000).toFixed(0)} mAh · {packSuggestion.voltageV.toFixed(1)} В
        </button>
      )}
      <Field label="Злетна маса (AUW), кг">
        <Input type="number" step="0.05" min="0.01" value={state.auwKg} onChange={(e) => setState((s) => ({ ...s, auwKg: Number(e.target.value) }))} />
      </Field>
      <Field label="Ефективність, г/Вт" hint="Типово: квадрокоптер 6–8, ефективне крило 10–15">
        <Input type="number" step="0.1" min="0.1" value={state.efficiencyGW} onChange={(e) => setState((s) => ({ ...s, efficiencyGW: Number(e.target.value) }))} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ємність, Аг">
          <Input type="number" step="0.1" min="0.01" value={state.packCapacityAh} onChange={(e) => setState((s) => ({ ...s, packCapacityAh: Number(e.target.value) }))} />
        </Field>
        <Field label="Напруга, В">
          <Input type="number" step="0.1" min="0.1" value={state.packVoltageV} onChange={(e) => setState((s) => ({ ...s, packVoltageV: Number(e.target.value) }))} />
        </Field>
      </div>
      <Field label="Ліміт розряду, %" hint="80% = залишаємо 20% резерву">
        <Input type="number" min={50} max={100} value={state.dischargeLimit} onChange={(e) => setState((s) => ({ ...s, dischargeLimit: Number(e.target.value) }))} />
      </Field>
      <Button onClick={calculate}>Розрахувати</Button>
      {result === null && <CalcEmptyState />}
      {result !== null && result > 0 && (
        <>
          <ResultBox copyValue={formatToolNumber(result, 1)}>
            Час висіння: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 1)} хв</span>
          </ResultBox>
          <div className="text-[10px] text-ecalc-muted leading-relaxed">
            Споживання: {formatToolNumber((state.auwKg * 1000) / state.efficiencyGW, 0)} Вт ·{' '}
            Струм при {formatToolNumber(state.packVoltageV, 1)} В: {formatToolNumber(((state.auwKg * 1000) / state.efficiencyGW) / state.packVoltageV, 1)} А
          </div>
        </>
      )}
    </ToolCard>
  )
}

// ── Quick Reference section ───────────────────────────────────────────────────

function CellReferenceCard() {
  const [ff, setFf] = useState<CellFormFactor | 'all'>('all')
  const cells = CELL_DB.filter((c) => c.id !== 'custom' && (ff === 'all' || c.formFactor === ff))

  return (
    <Card className="calc-surface overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 text-[15px]">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-ecalc-orange/10 text-ecalc-orange ring-1 ring-ecalc-orange/15">
            <Zap className="h-4 w-4" />
          </span>
          <span className="leading-snug font-semibold text-ecalc-navy">Довідник Li-Ion комірок</span>
        </CardTitle>
        <CardDescription className="text-[11px] leading-relaxed">
          Параметри з даташитів виробників при кімнатній температурі. K — показник Пекерта.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1.5 mb-3">
          {(['all', '18650', '21700'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFf(v)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                ff === v ? 'bg-ecalc-orange text-white' : 'bg-ecalc-orange/10 text-ecalc-orange hover:bg-ecalc-orange/20'
              }`}
            >
              {v === 'all' ? 'Всі' : v}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-ecalc-border">
                <th className="pb-2 pr-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">Модель</th>
                <th className="pb-2 pr-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">мАч</th>
                <th className="pb-2 pr-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">Макс. А</th>
                <th className="pb-2 pr-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">Ri мОм</th>
                <th className="pb-2 pr-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">K</th>
                <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">Вага</th>
              </tr>
            </thead>
            <tbody>
              {cells.map((cell) => (
                <tr key={cell.id} className="border-b border-ecalc-border/50 last:border-0">
                  <td className="py-2 pr-3 font-medium text-ecalc-navy">{cell.label}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{cell.capacityMah}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{cell.maxContinuousA}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{cell.riMOhms}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-ecalc-muted">{cell.peukertK}</td>
                  <td className="py-2 text-right tabular-nums">{cell.weightG} г</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ── LiPo Quick Select ─────────────────────────────────────────────────────────

function LiPoReferenceCard({ onPackSelected }: { onPackSelected: (capacityAh: number, voltageV: number) => void }) {
  const [selected, setSelected] = useState<LiPoPackSpec | null>(null)
  const nomV = selected ? selected.sCells * 3.7 : 0
  const maxA = selected ? selected.capacityMah / 1000 * selected.continuousC : 0

  return (
    <Card className="calc-surface overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 text-[15px]">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-ecalc-orange/10 text-ecalc-orange ring-1 ring-ecalc-orange/15">
            <Battery className="h-4 w-4" />
          </span>
          <span className="leading-snug font-semibold text-ecalc-navy">Готові LiPo паки</span>
        </CardTitle>
        <CardDescription className="text-[11px] leading-relaxed">
          Виберіть готовий LiPo пак — параметри передаються у калькулятор часу висіння.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-ecalc-border">
                <th className="pb-2 pr-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">Пак</th>
                <th className="pb-2 pr-2 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">S</th>
                <th className="pb-2 pr-2 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">мАч</th>
                <th className="pb-2 pr-2 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">C cont.</th>
                <th className="pb-2 pr-2 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">Ri мОм</th>
                <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">г</th>
              </tr>
            </thead>
            <tbody>
              {LIPO_DB.map((pack) => (
                <tr
                  key={pack.id}
                  onClick={() => setSelected(pack)}
                  className={`cursor-pointer border-b border-ecalc-border/50 last:border-0 transition-colors ${
                    selected?.id === pack.id ? 'bg-ecalc-orange/10' : 'hover:bg-ecalc-orange/5'
                  }`}
                >
                  <td className="py-1.5 pr-2 font-medium text-ecalc-navy leading-tight">{pack.label}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{pack.sCells}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{pack.capacityMah}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{pack.continuousC}C</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{pack.riMOhmsTotal}</td>
                  <td className="py-1.5 text-right tabular-nums">{pack.weightG}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selected && (
          <div className="rounded-xl border border-ecalc-orange/20 bg-ecalc-orange/8 px-3.5 py-2.5 text-xs space-y-1">
            <div className="font-semibold text-ecalc-orange">{selected.label}</div>
            <div className="text-ecalc-muted">{selected.notes}</div>
            <div className="flex gap-4 mt-1 text-ecalc-text">
              <span>Напруга: <span className="font-semibold">{formatToolNumber(nomV, 1)} В</span></span>
              <span>Макс. струм: <span className="font-semibold">{formatToolNumber(maxA, 0)} А</span></span>
              <span>K: <span className="font-semibold">{selected.peukertK}</span></span>
            </div>
            <button
              type="button"
              onClick={() => onPackSelected(selected.capacityMah / 1000, nomV)}
              className="mt-1.5 w-full rounded-lg bg-ecalc-orange/20 px-3 py-1.5 text-xs font-semibold text-ecalc-orange hover:bg-ecalc-orange/30 transition-colors"
            >
              Передати у калькулятор висіння →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── LiPo Storage Voltage ──────────────────────────────────────────────────────

function StorageVoltageCard() {
  const [state, setState] = usePersistedState('batterypack.storage', { currentV: 16.5, sCells: 4, capacityMah: 4000 })
  const [result, setResult] = useState<ReturnType<typeof lipoStorageCharge> | null>(null)

  return (
    <ToolCard
      icon={<Battery className="h-4 w-4" />}
      title="LiPo зберігання (storage voltage)"
      description="Скільки зарядити або розрядити до безпечного зберігання 3.85 В/комірку."
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Поточна напруга, В">
          <Input type="number" step="0.01" min="0.1" value={state.currentV} onChange={(e) => setState((s) => ({ ...s, currentV: Number(e.target.value) }))} />
        </Field>
        <Field label="Кількість S (комірок)">
          <Input type="number" min={1} max={14} value={state.sCells} onChange={(e) => setState((s) => ({ ...s, sCells: Number(e.target.value) }))} />
        </Field>
        <Field label="Ємність, мАч">
          <Input type="number" min={100} value={state.capacityMah} onChange={(e) => setState((s) => ({ ...s, capacityMah: Number(e.target.value) }))} />
        </Field>
      </div>
      <Button onClick={() => setResult(lipoStorageCharge({ currentVoltageV: state.currentV, sCells: state.sCells, capacityMah: state.capacityMah }))}>Розрахувати</Button>
      {!result && <CalcEmptyState />}
      {result && (
        <div className={`rounded-xl border px-3.5 py-2.5 text-sm space-y-1 ${
          result.action === 'ok' ? 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green'
          : result.action === 'charge' ? 'border-ecalc-orange/30 bg-ecalc-orange/8 text-ecalc-text'
          : 'border-blue-500/30 bg-blue-500/10 text-bluealc-text'
        }`}>
          <div className="flex justify-between">
            <span>Цільова напруга:</span>
            <span className="font-semibold">{formatToolNumber(result.targetV, 2)} В ({formatToolNumber(result.targetV / state.sCells, 2)} В/комірку)</span>
          </div>
          <div className="flex justify-between">
            <span>Різниця:</span>
            <span className="font-semibold">{result.diffV >= 0 ? '+' : ''}{formatToolNumber(result.diffV, 2)} В</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Дія:</span>
            <span>{result.action === 'ok' ? '✓ Вже на storage voltage' : result.action === 'charge' ? `↑ Дозарядити ~${formatToolNumber(result.mAhChange, 0)} мАч` : `↓ Розрядити ~${formatToolNumber(result.mAhChange, 0)} мАч`}</span>
          </div>
        </div>
      )}
    </ToolCard>
  )
}

// ── AWG Wire Selector ─────────────────────────────────────────────────────────

function AwgSelectorCard() {
  const [state, setState] = usePersistedState('batterypack.awg', { currentA: 40, lengthM: 0.3, voltageV: 22.2 })
  const [result, setResult] = useState<ReturnType<typeof awgSelector> | null | 'none'>('none')

  function calculate() {
    setResult(awgSelector(state) ?? null)
  }

  return (
    <ToolCard
      icon={<Zap className="h-4 w-4" />}
      title="Вибір перерізу дроту (AWG)"
      description="Мінімальний AWG за струмом, падіння напруги та втрати потужності для силових ланцюгів."
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Струм, А">
          <Input type="number" step="0.5" min="0.1" value={state.currentA} onChange={(e) => setState((s) => ({ ...s, currentA: Number(e.target.value) }))} />
        </Field>
        <Field label="Довжина, м" hint="Один провід">
          <Input type="number" step="0.05" min="0.01" value={state.lengthM} onChange={(e) => setState((s) => ({ ...s, lengthM: Number(e.target.value) }))} />
        </Field>
        <Field label="Напруга лінії, В">
          <Input type="number" step="0.1" min="1" value={state.voltageV} onChange={(e) => setState((s) => ({ ...s, voltageV: Number(e.target.value) }))} />
        </Field>
      </div>
      <Button onClick={calculate}>Підібрати</Button>
      {result === 'none' && <CalcEmptyState />}
      {result === null && <ResultBox>Струм перевищує AWG 8 — використовуйте шину або збільшуйте перетин.</ResultBox>}
      {result && result !== 'none' && (
        <div className="space-y-1.5">
          <ResultBox copyValue={String(result.awg)}>
            Мін. переріз: <span className="font-semibold text-ecalc-navy">AWG {result.awg}</span>
          </ResultBox>
          <ResultBox>
            Падіння напруги: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.dropV, 3)} В</span>
            <span className="ml-2 text-xs text-ecalc-muted">({formatToolNumber(result.dropPct, 1)}% від {formatToolNumber(state.voltageV, 1)} В)</span>
          </ResultBox>
          <ResultBox>
            Втрати потужності: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.dropV * state.currentA, 1)} Вт</span>
            <span className="ml-2 text-xs text-ecalc-muted">опір {formatToolNumber(result.resistance * 1000, 1)} мОм (туди-назад)</span>
          </ResultBox>
        </div>
      )}
    </ToolCard>
  )
}

// ── Parallel Charge Safety ────────────────────────────────────────────────────

function ParallelChargeCard() {
  const [state, setState] = usePersistedState('batterypack.parallel', { v1: 16.5, v2: 15.8, sCells: 4 })
  const [result, setResult] = useState<ReturnType<typeof parallelChargeSafety> | null>(null)

  return (
    <ToolCard
      icon={<ShieldAlert className="h-4 w-4" />}
      title="Паралельна зарядка — перевірка безпеки"
      description="Перевіряє різницю напруг двох акумуляторів перед паралельним з'єднанням. Різниця >0.3 В/комірку — небезпечно."
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Напруга 1-го пака, В">
          <Input type="number" step="0.01" min="0.1" value={state.v1} onChange={(e) => setState((s) => ({ ...s, v1: Number(e.target.value) }))} />
        </Field>
        <Field label="Напруга 2-го пака, В">
          <Input type="number" step="0.01" min="0.1" value={state.v2} onChange={(e) => setState((s) => ({ ...s, v2: Number(e.target.value) }))} />
        </Field>
        <Field label="Кількість S">
          <Input type="number" min={1} max={14} value={state.sCells} onChange={(e) => setState((s) => ({ ...s, sCells: Number(e.target.value) }))} />
        </Field>
      </div>
      <Button onClick={() => setResult(parallelChargeSafety(state))}>Перевірити</Button>
      {!result && <CalcEmptyState />}
      {result && (
        <div className={`rounded-xl border px-3.5 py-2.5 text-sm space-y-1 ${
          result.risk === 'ok' ? 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green'
          : result.risk === 'caution' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}>
          <div className="flex justify-between">
            <span>Різниця:</span>
            <span className="font-semibold">{formatToolNumber(result.diffV, 3)} В ({formatToolNumber(result.diffPerCell, 3)} В/комірку)</span>
          </div>
          <div className="font-semibold">
            {result.risk === 'ok' && '✓ Безпечно — можна з\'єднувати'}
            {result.risk === 'caution' && '⚠ Обережно — вирівняйте напругу перед з\'єднанням'}
            {result.risk === 'danger' && '✗ НЕБЕЗПЕЧНО — великий струм вирівнювання, ризик пожежі'}
          </div>
        </div>
      )}
    </ToolCard>
  )
}

// ── Entry Point ───────────────────────────────────────────────────────────────

export function BatteryPackSuite() {
  const [packSuggestion, setPackSuggestion] = useState<{ capacityAh: number; voltageV: number } | null>(null)

  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle>Акумуляторні збірки (S×P)</CardTitle>
          <CardDescription>
            Конструктор збірок з 13 комірками 18650/21700 та 10 готовими LiPo паками.
            Розраховує падіння напруги (Закон Ома), тепловтрати (Джоуль–Ленц) та корекцію ємності (Пекерт).
            Допустимі відхилення: ±5% на Ri, ±3% на ємність (виробничий розкид).
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <PackBuilderCard onPackBuilt={(capacityAh, voltageV) => setPackSuggestion({ capacityAh, voltageV })} />
        <HoverCard packSuggestion={packSuggestion} />
        <StorageVoltageCard />
        <AwgSelectorCard />
        <ParallelChargeCard />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <CellReferenceCard />
        <LiPoReferenceCard onPackSelected={(capacityAh, voltageV) => setPackSuggestion({ capacityAh, voltageV })} />
      </div>
    </section>
  )
}
