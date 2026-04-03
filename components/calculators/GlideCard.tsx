'use client'

import { Wind } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { type GlideDraft } from '@/lib/autopilot-contracts'
import { type GlideFootprint } from '@/lib/glide-footprint'

type Preset = Readonly<{ id: string; label: string; input: GlideDraft }>

type Props = Readonly<{
  draft: GlideDraft
  result: GlideFootprint | null
  error: string | null
  presets: ReadonlyArray<Preset>
  onApplyPreset: (input: GlideDraft) => void
  onUpdate: <K extends keyof GlideDraft>(key: K, value: number) => void
  onCalculate: () => void
}>

export function GlideCardView({
  draft,
  result,
  error,
  presets,
  onApplyPreset,
  onUpdate,
  onCalculate,
}: Props) {
  const showEmpty = !result && !error
  const showResults = Boolean(result)
  const upwindValue = result ? Math.max(0, result.maxDistanceUpwindM) : 0
  const upwindLabel = result && result.maxDistanceUpwindM > 0 ? `${result.maxDistanceUpwindM} м` : '— зноситься'
  const holdClass = result?.canHoldPosition
    ? 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green'
    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
  const holdLabel = result?.canHoldPosition
    ? '✓ Може утримувати позицію проти вітру'
    : '⚠ Повністю зноситься вітром'

  return (
    <ToolCard
      icon={<Wind className="h-4 w-4" />}
      title="Аварійне планування (відмова двигуна)"
      description="Площа досяжності при відмові двигуна: радіус планування з вітром і проти вітру."
    >
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button key={preset.id} type="button" variant="outline" size="sm" onClick={() => onApplyPreset(preset.input)}>
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Висота AGL, м">
          <Input type="number" min="1" value={draft.altitudeAglM} onChange={(e) => onUpdate('altitudeAglM', Number(e.target.value))} />
        </Field>
        <Field label="Швидкість планування V_bg, м/с">
          <Input type="number" min="1" step="0.5" value={draft.bestGlideSpeedMs} onChange={(e) => onUpdate('bestGlideSpeedMs', Number(e.target.value))} />
        </Field>
        <Field label="Аеродинамічна якість L/D">
          <Input type="number" min="1" step="0.5" value={draft.maxLdRatio} onChange={(e) => onUpdate('maxLdRatio', Number(e.target.value))} />
        </Field>
        <Field label="Швидкість вітру, м/с">
          <Input type="number" min="0" step="0.5" value={draft.windSpeedMs} onChange={(e) => onUpdate('windSpeedMs', Number(e.target.value))} />
        </Field>
      </div>

      <Button onClick={onCalculate}>Розрахувати</Button>

      {showEmpty && <div className="text-xs text-ecalc-muted">Введіть параметри та натисніть «Розрахувати»</div>}
      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">{error}</div>}

      {showResults && result && (
        <>
          <ResultBox copyValue={String(result.radiusNoWindM)}>
            Радіус (без вітру): <span className="font-semibold text-ecalc-navy">{result.radiusNoWindM} м</span>
          </ResultBox>
          <ResultBox copyValue={String(result.maxDistanceDownwindM)}>
            Дальність за вітром: <span className="font-semibold text-ecalc-navy">{result.maxDistanceDownwindM} м</span>
          </ResultBox>
          <ResultBox copyValue={String(upwindValue)}>
            Дальність проти вітру: <span className="font-semibold text-ecalc-navy">{upwindLabel}</span>
          </ResultBox>
          <ResultBox copyValue={String(result.maxTimeAloftS)}>
            Час до землі: <span className="font-semibold text-ecalc-navy">{result.maxTimeAloftS} с</span>
          </ResultBox>
          <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${holdClass}`}>{holdLabel}</div>
        </>
      )}
    </ToolCard>
  )
}
