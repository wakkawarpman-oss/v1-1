'use client'

import { Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { type InterceptDraft } from '@/lib/autopilot-contracts'
import { type InterceptResult } from '@/lib/interception'

type Preset = Readonly<{ id: string; label: string; input: InterceptDraft }>

type Props = Readonly<{
  draft: InterceptDraft
  result: InterceptResult | null
  error: string | null
  presets: ReadonlyArray<Preset>
  onApplyPreset: (input: InterceptDraft) => void
  onUpdate: <K extends keyof InterceptDraft>(key: K, value: number) => void
  onCalculate: () => void
}>

export function InterceptionCardView({
  draft,
  result,
  error,
  presets,
  onApplyPreset,
  onUpdate,
  onCalculate,
}: Props) {
  const showEmpty = !result && !error
  const showPossible = Boolean(result?.isPossible)
  const showImpossible = Boolean(result && !result.isPossible)
  const resourceClass = result?.batterySufficient
    ? 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green'
    : 'border-red-500/30 bg-red-500/10 text-red-400'
  const resourceLabel = result?.batterySufficient ? '✓ Ресурс достатній' : '✗ Не вистачить ресурсу'

  return (
    <ToolCard
      icon={<Crosshair className="h-4 w-4" />}
      title="Перехоплення рухомої цілі"
      description="Кінематика collision-course: кут упередження, час і дальність перехоплення."
    >
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button key={preset.id} type="button" variant="outline" size="sm" onClick={() => onApplyPreset(preset.input)}>
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Дистанція до цілі, м">
          <Input type="number" min="1" value={draft.targetDistanceM} onChange={(e) => onUpdate('targetDistanceM', Number(e.target.value))} />
        </Field>
        <Field label="Швидкість цілі, м/с">
          <Input type="number" min="0" step="0.5" value={draft.targetSpeedMs} onChange={(e) => onUpdate('targetSpeedMs', Number(e.target.value))} />
        </Field>
        <Field label="Курс цілі відн. LOS, °">
          <Input type="number" min="0" max="180" value={draft.targetHeadingDeg} onChange={(e) => onUpdate('targetHeadingDeg', Number(e.target.value))} />
        </Field>
        <Field label="Швидкість перехоплювача, м/с">
          <Input type="number" min="1" step="0.5" value={draft.interceptorSpeedMs} onChange={(e) => onUpdate('interceptorSpeedMs', Number(e.target.value))} />
        </Field>
        <Field label="Ресурс польоту, с">
          <Input type="number" min="1" value={draft.maxFlightTimeS} onChange={(e) => onUpdate('maxFlightTimeS', Number(e.target.value))} />
        </Field>
      </div>

      <Button onClick={onCalculate}>Розрахувати</Button>

      {showEmpty && <div className="text-xs text-ecalc-muted">Введіть параметри та натисніть «Розрахувати»</div>}
      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">{error}</div>}
      {showImpossible && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
          ✗ Перехоплення неможливе — перевірте швидкості та кут.
        </div>
      )}

      {showPossible && result && (
        <>
          <ResultBox copyValue={String(result.leadAngleDeg)}>
            Кут упередження φ: <span className="font-semibold text-ecalc-navy">{result.leadAngleDeg}°</span>
          </ResultBox>
          <ResultBox copyValue={String(result.timeToInterceptS)}>
            Час перехоплення: <span className="font-semibold text-ecalc-navy">{result.timeToInterceptS} с</span>
          </ResultBox>
          <ResultBox copyValue={String(result.interceptDistanceM)}>
            Дистанція перехоплювача: <span className="font-semibold text-ecalc-navy">{result.interceptDistanceM} м</span>
          </ResultBox>
          <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${resourceClass}`}>{resourceLabel}</div>
        </>
      )}
    </ToolCard>
  )
}
