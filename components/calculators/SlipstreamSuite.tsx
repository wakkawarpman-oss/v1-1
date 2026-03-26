'use client'

import { useMemo } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { slipstreamDrag, airDensity, round } from '@/lib/aero'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SSState = {
  thrustG: number
  propDiameterIn: number
  flightSpeedKmh: number
  altitudeM: number
  temperatureC: number
  bodyAreaCm2: number
  bodyCd: number
}

const DEFAULTS: SSState = {
  thrustG:        800,
  propDiameterIn: 10,
  flightSpeedKmh: 60,
  altitudeM:      0,
  temperatureC:   15,
  bodyAreaCm2:    40,
  bodyCd:         0.5,
}

function Field({ id, label, hint, value, step, min, onChange }: {
  id: string; label: string; hint?: string
  value: number; step: number; min?: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="text-[11px] text-ecalc-muted">{hint}</p>}
    </div>
  )
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="metric-tile">
      <div className="text-xs uppercase tracking-wide text-ecalc-muted">{label}</div>
      <div className="mt-2 text-2xl font-bold text-ecalc-navy">{value}</div>
      <div className="text-xs text-ecalc-muted">{unit}</div>
    </div>
  )
}

export function SlipstreamSuite() {
  const [inp, setInp] = usePersistedState<SSState>('slipstream.v1', DEFAULTS)

  function set<K extends keyof SSState>(key: K, val: SSState[K]) {
    setInp((prev) => ({ ...prev, [key]: val }))
  }

  const result = useMemo(() => {
    const thrustN      = inp.thrustG / 101.97
    const propDiam     = inp.propDiameterIn * 0.0254
    const speedMs      = inp.flightSpeedKmh / 3.6
    const density      = airDensity(inp.altitudeM, inp.temperatureC)
    const bodyAreaM2   = inp.bodyAreaCm2 / 10000

    return slipstreamDrag({
      thrustN,
      propDiameterM: propDiam,
      flightSpeedMs: speedMs,
      density,
      bodyAreaM2,
      bodyCd: inp.bodyCd,
    })
  }, [inp])

  const etaPct = isNaN(result.propulsiveEfficiency)
    ? '—'
    : `${round(result.propulsiveEfficiency * 100, 1)}`

  return (
    <section className="space-y-6">
      <div className="calc-hero">
        <div className="relative z-10 px-5 py-6 sm:px-6 sm:py-7">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
            Аеродинаміка
          </div>
          <h3 className="display-font mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Slipstream Drag
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72">
            Actuator disk — індукована швидкість пропвошу, динамічний тиск в сліді та
            додатковий аеродинамічний опір на тілах в зоні слипстриму. Модель Ренкіна–Фруда.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Привід</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="thrustG"  label="Тяга на мотор, г"          step={10}  min={1}  value={inp.thrustG}         onChange={(v) => set('thrustG', v)} />
                <Field id="propDiam" label="Діаметр пропелера, inch"    step={0.5} min={1}  value={inp.propDiameterIn}  onChange={(v) => set('propDiameterIn', v)} />
                <Field id="speed"    label="Швидкість польоту, км/год"  step={5}   min={0}  value={inp.flightSpeedKmh}  onChange={(v) => set('flightSpeedKmh', v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Середовище</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="alt"   label="Висота, м"       step={100} min={0}    value={inp.altitudeM}    onChange={(v) => set('altitudeM', v)} />
                <Field id="temp"  label="Температура, °C" step={1}   min={-40}  value={inp.temperatureC} onChange={(v) => set('temperatureC', v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Тіло в зоні слипстриму</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="bodyArea" label="Фронтальна площа, см²" hint="ESC, фюзеляж, вузол кріплення" step={1} min={0} value={inp.bodyAreaCm2} onChange={(v) => set('bodyAreaCm2', v)} />
                <Field id="bodyCd"   label="Cd тіла"                hint="Плоска пластина ≈ 1.2; тупе тіло ≈ 0.5" step={0.05} min={0} value={inp.bodyCd} onChange={(v) => set('bodyCd', v)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Actuator Disk</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Індукована v_i"    value={round(result.inducedVelocityMs, 2).toFixed(2)}  unit="м/с" />
                <Metric label="Швидкість в сліді" value={round(result.wakeVelocityMs, 2).toFixed(2)}     unit="м/с (2·v_i)" />
                <Metric label="Радіус диска"      value={round(result.diskRadiusM * 100, 1).toFixed(1)}  unit="см" />
                <Metric label="Радіус сліду"      value={round(result.wakeRadiusM * 100, 1).toFixed(1)} unit="см (√0.5·r)" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Динамічний тиск</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="q∞ (вільний потік)"  value={round(result.qFreestream, 2).toFixed(2)} unit="Па" />
                <Metric label="q_wake (у сліді)"    value={round(result.qWake, 2).toFixed(2)}       unit="Па" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Опір та ефективність</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Metric label="Додатковий опір" value={round(result.slipstreamDragG, 1).toFixed(1)} unit="г" />
                <Metric label="Опір, Н"         value={round(result.slipstreamDragN, 4).toFixed(4)} unit="Н" />
                <Metric label="Індукована P"    value={round(result.inducedPowerW, 1).toFixed(1)}   unit="Вт (T·v_i)" />
                <Metric
                  label="η пропульсивна"
                  value={etaPct}
                  unit={isNaN(result.propulsiveEfficiency) ? 'hover: V=0' : '%'}
                />
              </div>
              {isNaN(result.propulsiveEfficiency) && (
                <p className="text-[11px] text-ecalc-muted">
                  При V = 0 (зависання) пропульсивна ефективність → 0 за визначенням (η = V / (V + v_i)).
                </p>
              )}
              <p className="text-[11px] text-ecalc-muted leading-relaxed">
                Модель Ренкіна–Фруда (actuator disk). Ідеальна (без профільних втрат пропелера). Точність ±10–20 % при типових J &lt; 0.8.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
