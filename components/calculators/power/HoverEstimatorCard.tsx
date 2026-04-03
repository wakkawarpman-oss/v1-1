'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CalcEmptyState, Field, ResultBox, ToolCard, formatToolNumber } from '@/components/calculators/CalculatorToolPrimitives'
import { usePersistedState } from '@/hooks/usePersistedState'
import { hoverTimeFromPack } from '@/lib/battery-pack'

type HoverState = {
  auwKg: number
  efficiencyGW: number
  packCapacityAh: number
  packVoltageV: number
  dischargeLimit: number
}

const HOVER_DEFAULTS: HoverState = {
  auwKg: 1.5,
  efficiencyGW: 7.5,
  packCapacityAh: 4.2,
  packVoltageV: 22.2,
  dischargeLimit: 80,
}

export function HoverEstimatorCard({ packSuggestion }: { packSuggestion: { capacityAh: number; voltageV: number } | null }) {
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
      <Field label="Ефективність, г/Вт" hint="Типово: квадрокоптер 6-8, ефективне крило 10-15">
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
          <div className="text-[10px] leading-relaxed text-ecalc-muted">
            Споживання: {formatToolNumber((state.auwKg * 1000) / state.efficiencyGW, 0)} Вт ·{' '}
            Струм при {formatToolNumber(state.packVoltageV, 1)} В: {formatToolNumber(((state.auwKg * 1000) / state.efficiencyGW) / state.packVoltageV, 1)} А
          </div>
        </>
      )}
    </ToolCard>
  )
}
