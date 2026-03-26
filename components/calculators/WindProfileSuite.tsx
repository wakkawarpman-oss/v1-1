'use client'

import { useMemo } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { windAtAltitude, TerrainRoughness } from '@/lib/wind-profile'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const TERRAIN_OPTIONS: Array<{ label: string; z0: number }> = [
  { label: 'Вода / Море (z₀ = 0.0002 м)',      z0: TerrainRoughness.Water },
  { label: 'Сніг / Тундра (z₀ = 0.002 м)',     z0: TerrainRoughness.SmoothSnow },
  { label: 'Поле / Аеродром (z₀ = 0.03 м)',    z0: TerrainRoughness.OpenGrass },
  { label: 'Посіви / Живоплоти (z₀ = 0.1 м)',  z0: TerrainRoughness.Crops },
  { label: 'Дерева та кущі (z₀ = 0.25 м)',     z0: TerrainRoughness.ScatteredTrees },
  { label: 'Ліс (z₀ = 0.5 м)',                  z0: TerrainRoughness.Forest },
  { label: 'Передмістя (z₀ = 1.0 м)',           z0: TerrainRoughness.Suburbs },
  { label: 'Місто (z₀ = 2.0 м)',                z0: TerrainRoughness.City },
]

type WPState = {
  referenceWindSpeedMs: number
  referenceHeightM: number
  targetAltitudeM: number
  z0: number
}

const DEFAULTS: WPState = {
  referenceWindSpeedMs: 5,
  referenceHeightM:     10,
  targetAltitudeM:      100,
  z0:                   TerrainRoughness.OpenGrass,
}

function Field({ id, label, hint, value, step, onChange }: {
  id: string; label: string; hint?: string
  value: number; step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="text-[11px] text-ecalc-muted">{hint}</p>}
    </div>
  )
}

export function WindProfileSuite() {
  const [inp, setInp] = usePersistedState<WPState>('windprofile.v1', DEFAULTS)

  function set<K extends keyof WPState>(key: K, val: WPState[K]) {
    setInp((prev) => ({ ...prev, [key]: val }))
  }

  const result = useMemo(() => windAtAltitude(inp), [inp])

  return (
    <section className="space-y-6">
      <div className="calc-hero">
        <div className="relative z-10 px-5 py-6 sm:px-6 sm:py-7">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
            Вітровий профіль
          </div>
          <h3 className="display-font mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Логарифмічний профіль вітру
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72">
            Розраховує швидкість вітру на висоті польоту за моделлю ISO 4354. Прогноз погоди (зазвичай на 10 м) перераховується на робочу висоту БПЛА — важливо для оцінки витрат заряду та польотного часу.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Параметри вітру</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="refWind" label="Вітер за прогнозом, м/с" hint="WMO: виміряно на 10 м АГЛ"
                value={inp.referenceWindSpeedMs} step={0.5} onChange={(v) => set('referenceWindSpeedMs', v)} />
              <Field id="refHeight" label="Висота виміру, м АГЛ" hint="Стандарт WMO — 10 м"
                value={inp.referenceHeightM} step={1} onChange={(v) => set('referenceHeightM', v)} />
              <div className="sm:col-span-2">
                <Field id="targetAlt" label="Висота польоту БПЛА, м АГЛ"
                  value={inp.targetAltitudeM} step={10} onChange={(v) => set('targetAltitudeM', v)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="terrain">Тип рельєфу</Label>
              <select
                id="terrain"
                value={inp.z0}
                onChange={(e) => set('z0', Number(e.target.value))}
                className="w-full rounded-md border border-ecalc-border bg-ecalc-lightbg px-3 py-2 text-sm text-ecalc-navy focus:outline-none focus:ring-2 focus:ring-ecalc-orange/40"
              >
                {TERRAIN_OPTIONS.map((opt) => (
                  <option key={opt.z0} value={opt.z0}>{opt.label}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Результати</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-wide text-ecalc-muted">Вітер на висоті</div>
                <div className="mt-2 text-2xl font-bold text-ecalc-navy">{result.windSpeedMs}</div>
                <div className="text-xs text-ecalc-muted">м/с</div>
              </div>
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-wide text-ecalc-muted">Приріст</div>
                <div className="mt-2 text-2xl font-bold text-ecalc-navy">+{result.deltaMs}</div>
                <div className="text-xs text-ecalc-muted">м/с</div>
              </div>
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-wide text-ecalc-muted">Коефіцієнт</div>
                <div className="mt-2 text-2xl font-bold text-ecalc-navy">{result.amplificationFactor}×</div>
                <div className="text-xs text-ecalc-muted">V_alt / V_ref</div>
              </div>
            </div>
            <p className="text-[11px] text-ecalc-muted leading-relaxed">
              Логарифмічний вітровий профіль (нейтральна атмосферна стабільність, ISO 4354). ±15% точність при типових умовах.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
