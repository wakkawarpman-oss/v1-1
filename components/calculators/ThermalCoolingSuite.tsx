'use client'

import { useMemo } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { requiredDuctArea, type ThermalCoolingInput } from '@/lib/thermal-cooling'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const DEFAULTS: ThermalCoolingInput = {
  inputPowerW:    100,
  efficiency:     0.92,
  velocityMs:     20,
  density:        1.225,
  ambientTempC:   25,
  maxTempC:       85,
  ductEfficiency: 0.6,
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

export function ThermalCoolingSuite() {
  const [inp, setInp] = usePersistedState<ThermalCoolingInput>('thermal-cooling.v1', DEFAULTS)

  function set<K extends keyof ThermalCoolingInput>(key: K, val: number) {
    setInp((prev) => ({ ...prev, [key]: val }))
  }

  const result = useMemo(() => {
    try {
      return { ok: true as const, data: requiredDuctArea(inp) }
    } catch (e) {
      return { ok: false as const, error: (e as Error).message }
    }
  }, [inp])

  return (
    <section className="space-y-6">
      <div className="calc-hero">
        <div className="relative z-10 px-5 py-6 sm:px-6 sm:py-7">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
            Теплове охолодження
          </div>
          <h3 className="display-font mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ram-Air охолодження ESC / Мотора
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72">
            Розраховує мінімальну площу відкриття повітрозабірника NACA для відведення тепла від ESC або мотора під час крейсерського польоту. Враховує потужність втрат, швидкість набігаючого потоку та температурний запас.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Компонент та умови польоту</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="inputPower" label="Вхідна потужність, Вт" hint="ESC: 50–500 · FPV TX: 2–25"
                value={inp.inputPowerW} step={5} onChange={(v) => set('inputPowerW', v)} />
              <Field id="efficiency" label="ККД компонента (0–1)" hint="ESC: 0.94 · Мотор: 0.87 · FPV TX: 0.50"
                value={inp.efficiency} step={0.01} onChange={(v) => set('efficiency', v)} />
              <Field id="velocity" label="Швидкість польоту, м/с"
                value={inp.velocityMs} step={1} onChange={(v) => set('velocityMs', v)} />
              <Field id="density" label="Щільність повітря, кг/м³" hint="ISA SL: 1.225"
                value={inp.density} step={0.001} onChange={(v) => set('density', v)} />
              <Field id="ambientTemp" label="Температура повітря, °C"
                value={inp.ambientTempC} step={1} onChange={(v) => set('ambientTempC', v)} />
              <Field id="maxTemp" label="Макс. темп. компонента, °C" hint="ESC: 85 · Мотор: 100"
                value={inp.maxTempC} step={5} onChange={(v) => set('maxTempC', v)} />
              <div className="sm:col-span-2">
                <Field id="ductEta" label="ККД повітрозабірника (0–1)" hint="NACA duct: 0.5–0.7 · Пряма труба: 0.9"
                  value={inp.ductEfficiency ?? 0.6} step={0.05} onChange={(v) => set('ductEfficiency', v)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Результати охолодження</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.ok ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="metric-tile col-span-2">
                    <div className="text-xs uppercase tracking-wide text-ecalc-muted">Потрібна площа повітрозабірника</div>
                    <div className="mt-2 text-3xl font-bold text-ecalc-navy">
                      {result.data.ductAreaCm2} <span className="text-lg font-normal">см²</span>
                    </div>
                    <div className="text-xs text-ecalc-muted mt-1 font-mono">{result.data.ductAreaM2.toExponential(2)} м²</div>
                  </div>
                  <div className="metric-tile">
                    <div className="text-xs uppercase tracking-wide text-ecalc-muted">Тепло до відведення</div>
                    <div className="mt-2 font-bold text-ecalc-navy">{result.data.heatW} Вт</div>
                  </div>
                  <div className="metric-tile">
                    <div className="text-xs uppercase tracking-wide text-ecalc-muted">ΔT повітря</div>
                    <div className="mt-2 font-bold text-ecalc-navy">{result.data.deltaTempC} °C</div>
                  </div>
                  <div className="metric-tile col-span-2">
                    <div className="text-xs uppercase tracking-wide text-ecalc-muted">Масовий потік повітря</div>
                    <div className="mt-2 font-mono text-sm text-ecalc-navy">{result.data.massFlowKgS.toFixed(5)} кг/с</div>
                  </div>
                </div>
                <p className="text-[11px] text-ecalc-muted leading-relaxed">
                  Примусова конвекція (Incropera &amp; DeWitt, §7.1). Не враховує радіаційні та кондуктивні втрати. Перевіряйте на реальних вимірах температури.
                </p>
              </>
            ) : (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {result.error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
