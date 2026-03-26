'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PerfCalcInput, round, airDensity, propCtStatic, staticThrustFromCt } from '@/lib/aero'
import { MOTORS, searchMotors, type MotorSpec } from '@/lib/motor-db'
import { PROPS, PROP_BRANDS, getPropsByBrand } from '@/lib/prop-db'

type Props = Readonly<{
  values: PerfCalcInput
  onChange: (key: keyof PerfCalcInput, value: number) => void
}>

export function PropulsionForm({ values, onChange }: Props) {
  const [motorQuery, setMotorQuery] = useState('')
  const [motorResults, setMotorResults] = useState<MotorSpec[]>([])
  const [propBrand, setPropBrand] = useState('')

  const estimatedThrust = staticThrustFromCt(
    values.ctStaticOverride ?? propCtStatic(values.propDiameterIn, values.propPitchIn, values.bladeCount),
    airDensity(values.elevationM, values.temperatureC),
    values.rpm,
    values.propDiameterIn,
  ) * values.motorCount

  function handleMotorInput(q: string) {
    setMotorQuery(q)
    setMotorResults(searchMotors(q))
  }

  function applyMotor(m: MotorSpec) {
    onChange('motorKv', m.kv)
    onChange('motorRi', m.ri)
    onChange('motorI0', m.i0)
    setMotorQuery(`${m.brand} ${m.name}`)
    setMotorResults([])
  }

  function applyProp(id: string) {
    const p = PROPS.find((x) => x.id === id)
    if (!p) return
    onChange('propDiameterIn', p.diameterIn)
    onChange('propPitchIn', p.pitchIn)
    onChange('bladeCount', p.blades)
    onChange('ctStaticOverride', p.ct)
    onChange('cpStaticOverride', p.cp)
  }

  const propUsingDb = (values.ctStaticOverride ?? 0) > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Привід і живлення</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="rpm">Оберти пропелера, rpm</Label>
            <Input id="rpm" type="number" value={values.rpm} onChange={(e) => onChange('rpm', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="drivePowerW">Вхідна потужність, W</Label>
            <Input id="drivePowerW" type="number" value={values.drivePowerW} onChange={(e) => onChange('drivePowerW', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="propDiameterIn">Діаметр пропелера, inch</Label>
            <Input id="propDiameterIn" type="number" step="0.1" value={values.propDiameterIn} onChange={(e) => { onChange('propDiameterIn', Number(e.target.value)); onChange('ctStaticOverride', 0); onChange('cpStaticOverride', 0) }} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="propPitchIn">Крок пропелера, inch</Label>
            <Input id="propPitchIn" type="number" step="0.1" value={values.propPitchIn} onChange={(e) => { onChange('propPitchIn', Number(e.target.value)); onChange('ctStaticOverride', 0); onChange('cpStaticOverride', 0) }} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bladeCount">Кількість лопатей</Label>
            <Select title="Кількість лопатей" id="bladeCount" value={String(values.bladeCount)} onChange={(e) => onChange('bladeCount', Number(e.target.value))}>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="motorCount">Кількість моторів</Label>
            <Select title="Кількість моторів" id="motorCount" value={String(values.motorCount)} onChange={(e) => onChange('motorCount', Number(e.target.value))}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="4">4</option>
            </Select>
          </div>
        </div>

        {/* ── Prop database ── */}
        <div className="rounded-lg border border-ecalc-border bg-ecalc-lightbg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ecalc-navy uppercase tracking-[0.14em]">База пропелерів</span>
            {propUsingDb
              ? <span className="rounded-full bg-green-100 border border-green-300 px-2 py-0.5 text-[10px] font-semibold text-green-700">● UIUC Ct/Cp</span>
              : <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] text-gray-400">формула</span>
            }
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select title="Бренд пропелера" value={propBrand} onChange={(e) => setPropBrand(e.target.value)}>
              <option value="">Бренд…</option>
              {PROP_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </Select>
            <Select title="Модель пропелера" value="" onChange={(e) => applyProp(e.target.value)} disabled={!propBrand}>
              <option value="">Модель…</option>
              {getPropsByBrand(propBrand).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div className="text-[11px] text-ecalc-muted">
            {propUsingDb
              ? `Ct=${values.ctStaticOverride?.toFixed(4)}, Cp=${values.cpStaticOverride?.toFixed(4)} (UIUC)`
              : 'Вибір заповнює діаметр/крок і підставляє реальні Ct/Cp з бази UIUC замість формули.'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="batteryCells">LiPo елементи, S</Label>
            <Input id="batteryCells" type="number" value={values.batteryCells} onChange={(e) => onChange('batteryCells', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="batteryVoltagePerCell">Напруга на елемент, V</Label>
            <Input id="batteryVoltagePerCell" type="number" step="0.01" value={values.batteryVoltagePerCell} onChange={(e) => onChange('batteryVoltagePerCell', Number(e.target.value))} />
            {values.batteryVoltagePerCell > 4.0 && (
              <p className="text-[11px] text-amber-400">
                ⚠ Напруга заряду ({values.batteryVoltagePerCell} V/ел). Для розрахунку часу польоту рекомендується середня розрядна напруга ~3.85 V/ел.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="batteryCapacityMah">Ємність, mAh</Label>
            <Input id="batteryCapacityMah" type="number" value={values.batteryCapacityMah} onChange={(e) => onChange('batteryCapacityMah', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="averageCurrentA">Середній струм, A</Label>
            <Input id="averageCurrentA" type="number" step="0.1" value={values.averageCurrentA} onChange={(e) => onChange('averageCurrentA', Number(e.target.value))} />
          </div>
        </div>

        <div className="rounded-lg border border-ecalc-border bg-ecalc-lightbg p-3 text-sm text-ecalc-muted">
          Оцінка статичної тяги за емпіричною моделлю: <span className="font-semibold text-ecalc-navy">{round(estimatedThrust, 0)} г</span>
        </div>

        {/* ── Altmann Motor Model ── */}
        <div className="rounded-lg border border-ecalc-orange/20 bg-ecalc-orange/5 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ecalc-orange">Altmann Motor Model</span>
            {values.motorKv && values.motorRi && values.motorI0
              ? <span className="rounded-full bg-green-500/20 border border-green-500/40 px-2 py-0.5 text-[10px] font-semibold text-green-400">● Активний</span>
              : <span className="rounded-full bg-white/8 border border-white/15 px-2 py-0.5 text-[10px] text-white/40">Неактивний</span>
            }
          </div>

          {/* Motor search */}
          <div className="space-y-1.5 relative">
            <Label htmlFor="motorSearch">Пошук мотора ({MOTORS.length} в базі)</Label>
            <Input
              id="motorSearch"
              type="text"
              placeholder="напр. Hacker A30 або T-Motor U5…"
              value={motorQuery}
              onChange={(e) => handleMotorInput(e.target.value)}
              autoComplete="off"
            />
            {motorResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-ecalc-border bg-ecalc-darksurf shadow-xl">
                {motorResults.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs hover:bg-white/8 transition-colors"
                    onClick={() => applyMotor(m)}
                  >
                    <span className="font-semibold text-white/90">{m.brand} {m.name}</span>
                    <span className="ml-2 text-white/45">Kv={m.kv} · Rᵢ={m.ri}Ω · I₀={m.i0}A</span>
                    {m.maxW && <span className="ml-2 text-white/30">{m.maxW}W max</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="motorKv">Kv, об/хв/В</Label>
              <Input id="motorKv" type="number" step="10" placeholder="напр. 760" value={values.motorKv ?? ''} onChange={(e) => { onChange('motorKv', Number(e.target.value)); setMotorQuery('') }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="motorRi">Rᵢ, Ом</Label>
              <Input id="motorRi" type="number" step="0.001" placeholder="напр. 0.048" value={values.motorRi ?? ''} onChange={(e) => { onChange('motorRi', Number(e.target.value)); setMotorQuery('') }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="motorI0">I₀, А</Label>
              <Input id="motorI0" type="number" step="0.1" placeholder="напр. 1.1" value={values.motorI0 ?? ''} onChange={(e) => { onChange('motorI0', Number(e.target.value)); setMotorQuery('') }} />
            </div>
          </div>
          <div className="text-[11px] text-ecalc-muted">
            Kv, Rᵢ, I₀ — з datasheet мотора або пошуку вище. Активує back-EMF + advance ratio.
          </div>
        </div>

        {/* ── Peukert + Voltage Sag ── */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">Peukert + Voltage Sag</span>
            {(values.batteryRiMohm ?? 0) > 0 && (values.peukertK ?? 0) > 0
              ? <span className="rounded-full bg-green-500/20 border border-green-500/40 px-2 py-0.5 text-[10px] font-semibold text-green-400">● Активний</span>
              : <span className="rounded-full bg-white/8 border border-white/15 px-2 py-0.5 text-[10px] text-white/40">Неактивний</span>
            }
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="batteryRiMohm">Rᵢ акб, мОм</Label>
              <Input id="batteryRiMohm" type="number" step="1" placeholder="напр. 25" value={values.batteryRiMohm ?? ''} onChange={(e) => onChange('batteryRiMohm', Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="peukertK">Показник Пейкерта k</Label>
              <Input id="peukertK" type="number" step="0.01" placeholder="напр. 1.08" value={values.peukertK ?? ''} onChange={(e) => onChange('peukertK', Number(e.target.value))} />
            </div>
          </div>
          <div className="text-[11px] text-ecalc-muted">
            Rᵢ акб: сумарний опір пакету (типово 15–80 мОм). k: 1.05–1.10 для LiPo.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
