'use client'

import { useState } from 'react'
import { Battery, ShieldAlert, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CalcEmptyState, Field, ResultBox, ToolCard, formatToolNumber } from '@/components/calculators/CalculatorToolPrimitives'
import { usePersistedState } from '@/hooks/usePersistedState'
import { awgSelector, lipoStorageCharge, parallelChargeSafety } from '@/lib/battery-pack'

export function StorageVoltageCard() {
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
        <div className={`space-y-1 rounded-xl border px-3.5 py-2.5 text-sm ${
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

export function AwgSelectorCard() {
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
      {result === null && <ResultBox>Струм перевищує AWG 8 - використовуйте шину або збільшуйте перетин.</ResultBox>}
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

export function ParallelChargeCard() {
  const [state, setState] = usePersistedState('batterypack.parallel', { v1: 16.5, v2: 15.8, sCells: 4 })
  const [result, setResult] = useState<ReturnType<typeof parallelChargeSafety> | null>(null)

  return (
    <ToolCard
      icon={<ShieldAlert className="h-4 w-4" />}
      title="Паралельна зарядка - перевірка безпеки"
      description="Перевіряє різницю напруг двох акумуляторів перед паралельним з'єднанням. Різниця >0.3 В/комірку - небезпечно."
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
        <div className={`space-y-1 rounded-xl border px-3.5 py-2.5 text-sm ${
          result.risk === 'ok' ? 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green'
          : result.risk === 'caution' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}>
          <div className="flex justify-between">
            <span>Різниця:</span>
            <span className="font-semibold">{formatToolNumber(result.diffV, 3)} В ({formatToolNumber(result.diffPerCell, 3)} В/комірку)</span>
          </div>
          <div className="font-semibold">
            {result.risk === 'ok' && '✓ Безпечно - можна з\'єднувати'}
            {result.risk === 'caution' && '⚠ Обережно - вирівняйте напругу перед з\'єднанням'}
            {result.risk === 'danger' && '✗ НЕБЕЗПЕЧНО - великий струм вирівнювання, ризик пожежі'}
          </div>
        </div>
      )}
    </ToolCard>
  )
}
