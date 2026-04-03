'use client'

import { useState } from 'react'
import { Navigation } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePersistedState } from '@/hooks/usePersistedState'
import { calculateInterception } from '@/lib/interception'
import { calculateGlideFootprint } from '@/lib/glide-footprint'
import {
  mapInterceptDraftToInput,
  mapGlideDraftToInput,
  mergeDraftNumber,
  type InterceptDraft,
  type GlideDraft,
} from '@/lib/autopilot-contracts'
import { InterceptionCardView } from '@/components/calculators/InterceptionCard'
import { GlideCardView } from '@/components/calculators/GlideCard'
import {
  TimeOnTargetCard,
  BatteryRemainingCard,
  LoiterBudgetCard,
  WindAdjustedPNRCard,
  MultiLegFeasibilityCard,
} from '@/components/calculators/mission/MissionSupportCards'
import {
  PNRCard,
  EnduranceCard,
  RouteBatteryBudgetCard,
  TacticalRadiusCard,
} from '@/components/calculators/mission/MissionCoreCards'
import { ToolCard } from '@/components/calculators/CalculatorToolPrimitives'

// ── Interception Kinematics ────────────────────────────────────────────────────

type InterceptState = InterceptDraft

const INTERCEPT_DEFAULTS: InterceptState = {
  targetDistanceM: 2000,
  targetSpeedMs: 20,
  targetHeadingDeg: 90,
  interceptorSpeedMs: 50,
  maxFlightTimeS: 300,
}

const INTERCEPT_PRESETS: ReadonlyArray<{ id: string; label: string; input: InterceptState }> = [
  { id: 'balanced', label: 'Баланс', input: INTERCEPT_DEFAULTS },
  { id: 'fast-target', label: 'Швидка ціль', input: { targetDistanceM: 1800, targetSpeedMs: 28, targetHeadingDeg: 75, interceptorSpeedMs: 52, maxFlightTimeS: 260 } },
  { id: 'long-range', label: 'Дальня дистанція', input: { targetDistanceM: 3500, targetSpeedMs: 18, targetHeadingDeg: 110, interceptorSpeedMs: 60, maxFlightTimeS: 420 } },
]

function InterceptionCardContainer() {
  const [draft, setDraft] = usePersistedState<InterceptState>('mission.intercept', INTERCEPT_DEFAULTS)
  const [result, setResult] = useState<ReturnType<typeof calculateInterception> | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleApplyPreset(input: InterceptState) {
    const mapped = mapInterceptDraftToInput(input, INTERCEPT_DEFAULTS)
    setDraft({ ...mapped })
    setResult(null)
    setError(null)
  }

  function handleUpdate<K extends keyof InterceptState>(key: K, value: number) {
    setDraft((prev) => {
      const candidate = mergeDraftNumber(prev, key, value)
      const mapped = mapInterceptDraftToInput(candidate, INTERCEPT_DEFAULTS)
      return { ...mapped }
    })
    setResult(null)
    setError(null)
  }

  function handleCalculate() {
    const mapped = mapInterceptDraftToInput(draft, INTERCEPT_DEFAULTS)
    const next = calculateInterception(mapped)
    setResult(next)
    setError(next.isPossible ? null : 'Перехоплення неможливе — перевірте швидкості та кут.')
  }

  return (
    <InterceptionCardView
      draft={draft}
      result={result}
      error={error}
      presets={INTERCEPT_PRESETS}
      onApplyPreset={handleApplyPreset}
      onUpdate={handleUpdate}
      onCalculate={handleCalculate}
    />
  )
}

// ── Emergency Glide Footprint ─────────────────────────────────────────────────

type GlideState = GlideDraft

const GLIDE_DEFAULTS: GlideState = {
  altitudeAglM: 150,
  bestGlideSpeedMs: 18,
  maxLdRatio: 12,
  windSpeedMs: 5,
}

const GLIDE_PRESETS: ReadonlyArray<{ id: string; label: string; input: GlideState }> = [
  { id: 'standard', label: 'Стандарт', input: GLIDE_DEFAULTS },
  { id: 'high-wind', label: 'Сильний вітер', input: { altitudeAglM: 180, bestGlideSpeedMs: 20, maxLdRatio: 11, windSpeedMs: 14 } },
  { id: 'high-alt', label: 'Велика висота', input: { altitudeAglM: 320, bestGlideSpeedMs: 19, maxLdRatio: 13, windSpeedMs: 6 } },
]

function GlideCardContainer() {
  const [draft, setDraft] = usePersistedState<GlideState>('mission.glide', GLIDE_DEFAULTS)
  const [result, setResult] = useState<ReturnType<typeof calculateGlideFootprint> | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleApplyPreset(input: GlideState) {
    const mapped = mapGlideDraftToInput(input, GLIDE_DEFAULTS)
    setDraft({ ...mapped })
    setResult(null)
    setError(null)
  }

  function handleUpdate<K extends keyof GlideState>(key: K, value: number) {
    setDraft((prev) => {
      const candidate = mergeDraftNumber(prev, key, value)
      const mapped = mapGlideDraftToInput(candidate, GLIDE_DEFAULTS)
      return { ...mapped }
    })
    setResult(null)
    setError(null)
  }

  function handleCalculate() {
    try {
      const mapped = mapGlideDraftToInput(draft, GLIDE_DEFAULTS)
      setResult(calculateGlideFootprint(mapped))
      setError(null)
    } catch {
      setResult(null)
      setError('Розрахунок неможливий — перевірте вхідні параметри планування.')
    }
  }

  return (
    <GlideCardView
      draft={draft}
      result={result}
      error={error}
      presets={GLIDE_PRESETS}
      onApplyPreset={handleApplyPreset}
      onUpdate={handleUpdate}
      onCalculate={handleCalculate}
    />
  )
}

export function MissionPlanningSuite() {
  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ecalc-orange/10 text-ecalc-orange">
              <Navigation className="h-4 w-4" />
            </span>
            Центр планування місії
          </CardTitle>
          <CardDescription>
            Розрахунок ендюрансу, тактичного радіусу та бюджету батареї для конкретного маршруту.
            Враховує резерв на повернення та зависання над ціллю.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Розраховує ендюранс', value: 'час + дальність' },
              { label: 'Тактичний радіус', value: 'туди + назад' },
              { label: 'Маршрутний бюджет', value: 'чи вистачить' },
            ].map((item) => (
              <div key={item.label} className="metric-tile text-center">
                <div className="text-xs text-ecalc-muted">{item.label}</div>
                <div className="mt-1 text-sm font-semibold text-ecalc-navy">{item.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <EnduranceCard />
        <RouteBatteryBudgetCard />
        <TacticalRadiusCard />
        <TimeOnTargetCard />
        <BatteryRemainingCard />
        <LoiterBudgetCard />
        <PNRCard />
        <WindAdjustedPNRCard />
        <MultiLegFeasibilityCard />
        <InterceptionCardContainer />
        <GlideCardContainer />
      </div>
    </section>
  )
}
