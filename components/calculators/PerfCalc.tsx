'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePersistedState } from '@/hooks/usePersistedState'
import { AirframeForm } from '@/components/calculators/AirframeForm'
import { EnvironmentForm } from '@/components/calculators/EnvironmentForm'
import { PerfResultsPanel } from '@/components/calculators/PerfResultsPanel'
import { PerfTestCases } from '@/components/calculators/PerfTestCases'
import { PropulsionForm } from '@/components/calculators/PropulsionForm'

const PowerCurveChart = dynamic(
  () => import('@/components/calculators/PowerCurveChart').then((m) => m.PowerCurveChart),
  { ssr: false, loading: () => <div className="h-[380px] rounded-xl border border-ecalc-border bg-[#161b27] animate-pulse" /> },
)

const PerfCalcDownloadButton = dynamic(
  () => import('@/components/calculators/PerfCalcDownloadButton').then((m) => m.PerfCalcDownloadButton),
  { ssr: false, loading: () => null },
)

import { defaultPerfCalcInput, perfCalcPresets } from '@/components/calculators/perfcalc-presets'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { perfSummary, type PerfCalcInput, round, airDensity, propCtStatic, staticThrustFromCt } from '@/lib/aero'

// Fields that are optional activators — must be undefined (not 0) to disable the sub-model.
// Keep in sync with PerfCalcInput optional fields. TypeScript verifies each string is a valid key.
const OPTIONAL_PARAM_KEYS = [
  'motorKv', 'motorRi', 'motorI0',
  'batteryRiMohm', 'peukertK',
  'ctStaticOverride', 'cpStaticOverride',
] as const satisfies ReadonlyArray<keyof PerfCalcInput>

export function PerfCalc() {
  const [input, setInput] = usePersistedState<PerfCalcInput>('perfcalc.input', defaultPerfCalcInput)
  const [debouncedInput, setDebouncedInput] = useState<PerfCalcInput>(defaultPerfCalcInput)

  useEffect(() => {
    const density = airDensity(input.elevationM, input.temperatureC)
    const ct = input.ctStaticOverride ?? propCtStatic(input.propDiameterIn, input.propPitchIn, input.bladeCount)
    const nextStaticThrust = staticThrustFromCt(ct, density, input.rpm, input.propDiameterIn) * input.motorCount

    const normalized = { ...input, staticThrustG: nextStaticThrust }
    const timer = globalThis.setTimeout(() => setDebouncedInput(normalized), 180)
    return () => globalThis.clearTimeout(timer)
  }, [input])

  const summary = useMemo(() => perfSummary(debouncedInput), [debouncedInput])

  function updateField(key: keyof PerfCalcInput, value: number) {
    setInput((current) => ({
      ...current,
      [key]: (OPTIONAL_PARAM_KEYS as ReadonlyArray<string>).includes(key)
        ? (Number.isFinite(value) && value > 0 ? value : undefined)
        : (Number.isFinite(value) ? value : 0),
    }))
  }

  function forceCalculate() {
    const density = airDensity(input.elevationM, input.temperatureC)
    const ct = input.ctStaticOverride ?? propCtStatic(input.propDiameterIn, input.propPitchIn, input.bladeCount)
    const nextStaticThrust = staticThrustFromCt(ct, density, input.rpm, input.propDiameterIn) * input.motorCount
    setDebouncedInput({ ...input, staticThrustG: nextStaticThrust })
  }

  function applyPreset(id: string) {
    const preset = perfCalcPresets.find((item) => item.id === id)
    if (preset) {
      setInput(preset.input)
      setDebouncedInput(preset.input)
    }
  }

  function reset() {
    setInput(defaultPerfCalcInput)
    setDebouncedInput(defaultPerfCalcInput)
  }

  return (
    <section id="perfcalc" className="space-y-6">
      <div className="calc-hero">
        <div className="relative z-10 px-5 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                Primary Calculator
              </div>
              <h3 className="display-font mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                perfCalc — Продуктивність літака
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72 sm:text-base">
                Розраховує льотні характеристики фіксованокрилих БПЛА: швидкість зриву, Carson speed, мінімальну потужність, максимальну швидкість горизонтального польоту, швидкопідйомність та тягоозброєність. При заданих Kv / Rᵢ / I₀ активується модель Altmann — точніший розрахунок тяги і потужності мотора з урахуванням back-EMF та advance ratio.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[420px]">
              <div className="metric-tile-dark">
                <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">Vstall</div>
                <div className="mt-1 text-xl font-semibold text-white">{round(summary.stallSpeedKmh, 1)}</div>
                <div className="text-xs text-white/55">км/год</div>
              </div>
              <div className="metric-tile-dark">
                <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">Carson</div>
                <div className="mt-1 text-xl font-semibold text-white">{round(summary.bestRangeKmh, 1)}</div>
                <div className="text-xs text-white/55">км/год</div>
              </div>
              <div className="metric-tile-dark">
                <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">ROC max</div>
                <div className="mt-1 text-xl font-semibold text-white">{round(summary.maxRocMs, 2)}</div>
                <div className="text-xs text-white/55">м/с</div>
              </div>
              <div className="metric-tile-dark">
                <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">T/W</div>
                <div className="mt-1 text-xl font-semibold text-white">{round(summary.thrustToWeight, 2)}</div>
                <div className="text-xs text-white/55">: 1</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button className="bg-white text-ecalc-navy hover:bg-white/90" onClick={forceCalculate}>Розрахувати</Button>
            <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white" onClick={reset}>Скинути</Button>
            <PerfCalcDownloadButton input={debouncedInput} summary={summary} />
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/70">
              Інженерне наближення. Валідуйте на реальних вимірах.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,0.9fr] gap-6">
        <div className="space-y-4">
          <EnvironmentForm values={input} density={summary.density} onChange={updateField} />
          <AirframeForm values={input} onChange={updateField} />
          <PropulsionForm values={input} onChange={updateField} />
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 self-start">
          <PerfResultsPanel summary={summary} />
        </div>
      </div>

      <PowerCurveChart
        points={summary.points}
        minPowerSpeedKmh={summary.minPowerSpeedKmh}
        minPowerW={summary.minPowerW}
        carsonSpeedKmh={summary.bestRangeKmh}
        maxSpeedKmh={summary.levelMaxSpeedKmh}
        stallSpeedKmh={summary.stallSpeedKmh}
      />

      <Card className="calc-surface">
        <CardHeader>
          <CardTitle>Деталі розрахунку</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="metric-tile">
            <div className="text-xs uppercase tracking-wide text-ecalc-muted">Модель зриву</div>
            <div className="mt-2 text-sm text-ecalc-text">Vstall = sqrt(2W / (ρ·S·CLmax))</div>
          </div>
          <div className="metric-tile">
            <div className="text-xs uppercase tracking-wide text-ecalc-muted">Потрібна потужність</div>
            <div className="mt-2 text-sm text-ecalc-text">Preq = Pparasite + Pinduced</div>
          </div>
          <div className="metric-tile">
            <div className="text-xs uppercase tracking-wide text-ecalc-muted">Carson speed</div>
            <div className="mt-2 text-sm text-ecalc-text">Vcarson ≈ 1.316 × VminPower</div>
          </div>
          <div className="metric-tile">
            <div className="text-xs uppercase tracking-wide text-ecalc-muted">Набір висоти</div>
            <div className="mt-2 text-sm text-ecalc-text">ROC = (Pavail - Preq) / W</div>
          </div>
        </CardContent>
      </Card>

      <PerfTestCases onApplyPreset={applyPreset} summary={summary} />
    </section>
  )
}