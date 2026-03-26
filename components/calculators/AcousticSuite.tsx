'use client'

import { useMemo } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { estimatePropellerNoise, sumPropellerNoise, type PropAcousticInput } from '@/lib/acoustic-signature'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type AcousticState = PropAcousticInput & { motorCount: number }

const DEFAULTS: AcousticState = {
  diameterM:    0.254,   // 10"
  rpm:          6000,
  blades:       2,
  shaftPowerW:  200,
  distanceM:    10,
  temperatureC: 20,
  motorCount:   1,
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

export function AcousticSuite() {
  const [inp, setInp] = usePersistedState<AcousticState>('acoustic.v1', DEFAULTS)

  function set<K extends keyof AcousticState>(key: K, val: number) {
    setInp((prev) => ({ ...prev, [key]: val }))
  }

  const singleResult = useMemo(() => estimatePropellerNoise(inp), [inp])
  const totalOaspl   = useMemo(() => {
    const count = Math.max(1, inp.motorCount)
    return count > 1
      ? sumPropellerNoise(Array.from({ length: count }, () => singleResult.oasplDba))
      : singleResult.oasplDba
  }, [singleResult.oasplDba, inp.motorCount])

  return (
    <section className="space-y-6">
      <div className="calc-hero">
        <div className="relative z-10 px-5 py-6 sm:px-6 sm:py-7">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
            Акустика
          </div>
          <h3 className="display-font mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Акустичний підпис пропелера — OASPL
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72">
            Оцінює загальний рівень звукового тиску (дБ(A)) від пропелера БПЛА на заданій відстані. Враховує кількість лопатей, число Маха на кінці лопаті та кількість моторів (сумування по енергії). Точність ±5–8 дБ.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Параметри пропелера</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="diameter" label="Діаметр пропелера, м" hint='10" = 0.254 м · 12" = 0.305 м'
                value={inp.diameterM} step={0.01} onChange={(v) => set('diameterM', v)} />
              <Field id="blades" label="Кількість лопатей"
                value={inp.blades} step={1} onChange={(v) => set('blades', v)} />
              <Field id="rpm" label="Оберти, RPM"
                value={inp.rpm} step={100} onChange={(v) => set('rpm', v)} />
              <Field id="shaftPower" label="Потужність на валу, Вт"
                value={inp.shaftPowerW} step={10} onChange={(v) => set('shaftPowerW', v)} />
              <Field id="distance" label="Відстань до спостерігача, м"
                value={inp.distanceM} step={1} onChange={(v) => set('distanceM', v)} />
              <Field id="tempC" label="Температура повітря, °C"
                value={inp.temperatureC ?? 15} step={1} onChange={(v) => set('temperatureC', v)} />
              <div className="sm:col-span-2">
                <Field id="motorCount" label="Кількість моторів" hint="Мультиротор: 4–8 · FW: 1–2"
                  value={inp.motorCount} step={1} onChange={(v) => set('motorCount', v)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Акустичні характеристики</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="metric-tile col-span-2">
                <div className="text-xs uppercase tracking-wide text-ecalc-muted">
                  {inp.motorCount > 1 ? `Сумарний OASPL (${inp.motorCount} моторів)` : 'OASPL на відстані'}
                </div>
                <div className="mt-2 text-3xl font-bold text-ecalc-navy">
                  {totalOaspl} <span className="text-lg font-normal">дБ(A)</span>
                </div>
                {inp.motorCount > 1 && (
                  <div className="text-xs text-ecalc-muted mt-1">1 мотор: {singleResult.oasplDba} дБ(A)</div>
                )}
              </div>
              <div className="metric-tile">
                <div className="text-xs uppercase tracking-wide text-ecalc-muted">BPF (основна)</div>
                <div className="mt-2 font-bold text-ecalc-navy">{singleResult.bpfHz} Гц</div>
              </div>
              <div className={`metric-tile ${singleResult.highMachWarning ? 'border-amber-500/40 bg-amber-500/5' : ''}`}>
                <div className="text-xs uppercase tracking-wide text-ecalc-muted">Число Маха (кінець)</div>
                <div className={`mt-2 font-bold ${singleResult.highMachWarning ? 'text-amber-500' : 'text-ecalc-navy'}`}>
                  M = {singleResult.machTip}
                </div>
              </div>
            </div>
            {singleResult.highMachWarning && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] text-ecalc-text">
                <span className="font-semibold text-amber-500">Увага:</span> M ≥ 0.65 — трансзвуковий режим. Фактичний шум значно вищий за розрахунок.
              </div>
            )}
            <p className="text-[11px] text-ecalc-muted leading-relaxed">
              ±5–8 дБ точність (Intaratep et al., AIAA 2016-2962). Не враховує тональний характер шуму та ефекти відбиття від поверхні.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
