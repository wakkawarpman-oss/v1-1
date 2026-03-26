'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { perfCalcPresets } from '@/components/calculators/perfcalc-presets'
import { round } from '@/lib/aero'

type Summary = {
  stallSpeedKmh: number
  pitchSpeed: number
  bestRangeKmh: number
  maxRocMs: number
}

type Props = {
  onApplyPreset: (id: string) => void
  summary: Summary
}

function inRange(value: number, range: string): boolean {
  const parts = range.split('-').map(Number)
  if (parts.length === 2) return value >= parts[0] && value <= parts[1]
  return Math.abs(value - parts[0]) < 1
}

export function PerfTestCases({ onApplyPreset, summary }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)

  function handleApply(id: string) {
    setActiveId(id)
    onApplyPreset(id)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Тестові приклади</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {perfCalcPresets.map((preset) => {
          const isActive = activeId === preset.id
          return (
            <div key={preset.id} className={`rounded-lg border p-4 transition-colors ${isActive ? 'border-ecalc-orange/40 bg-ecalc-orange/5' : 'border-ecalc-border bg-ecalc-lightbg'}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-ecalc-navy">{preset.name}</h4>
                  <p className="mt-1 text-sm text-ecalc-muted">{preset.description}</p>
                  <div className="mt-2 text-xs text-ecalc-muted">
                    Очікувано: Vstall {preset.expected.stallSpeedKmh} · Pitch {preset.expected.pitchSpeedKmh} · Carson {preset.expected.bestRangeKmh} · ROC {preset.expected.maxRocMs} м/с
                  </div>
                  {isActive && (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { label: 'Vstall', actual: round(summary.stallSpeedKmh, 1), expected: preset.expected.stallSpeedKmh, unit: 'км/год' },
                        { label: 'Pitch', actual: round(summary.pitchSpeed, 1), expected: preset.expected.pitchSpeedKmh, unit: 'км/год' },
                        { label: 'Carson', actual: round(summary.bestRangeKmh, 1), expected: preset.expected.bestRangeKmh, unit: 'км/год' },
                        { label: 'ROC', actual: round(summary.maxRocMs, 2), expected: preset.expected.maxRocMs, unit: 'м/с' },
                      ].map(({ label, actual, expected, unit }) => {
                        const ok = inRange(actual, expected)
                        return (
                          <div key={label} className={`rounded px-2 py-1.5 text-xs border ${ok ? 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                            <div className="font-semibold">{label}: {actual} {unit}</div>
                            <div className="opacity-70">очік: {expected}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <Button size="sm" variant={isActive ? 'outline' : 'default'} onClick={() => handleApply(preset.id)}>
                  {isActive ? '✓ Активно' : 'Застосувати'}
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
