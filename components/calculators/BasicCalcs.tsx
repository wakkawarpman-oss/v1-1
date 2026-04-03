'use client'

import { useEffect, useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { DRONE_PREFILL_KEY, type DronePrefill } from '@/lib/drone-db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { round } from '@/lib/aero'
import { PropulsionCalcContainer } from '@/components/calculators/propulsion/PropulsionCalcContainer'

export function PropCalcBasic() {
  return (
    <BasicCalcShell
      title="propCalc — Мотор + Пропелер"
      description="Sprint-4: Propulsion Contracts + Passive View. Розрахунок тяги централізовано в propulsion-physics."
    >
      <PropulsionCalcContainer />
    </BasicCalcShell>
  )
}

export function XcopterCalcBasic() {
  const [auw, setAuw] = usePersistedState('xcoptercalc.auw', 2800)
  const [rotors, setRotors] = usePersistedState('xcoptercalc.rotors', 4)
  const [capacity, setCapacity] = usePersistedState('xcoptercalc.capacity', 5200)
  const [avgCurrent, setAvgCurrent] = usePersistedState('xcoptercalc.avgcurrent', 42)
  const [thrustPerMotor, setThrustPerMotor] = usePersistedState('xcoptercalc.thrust', 1400)
  const [prefill, setPrefill] = useState<DronePrefill | null>(null)

  useEffect(() => {
    const raw = globalThis.localStorage?.getItem(DRONE_PREFILL_KEY)
    if (!raw) return
    try { setPrefill(JSON.parse(raw) as DronePrefill) } catch { /* ignore */ }
  }, [])

  function applyPrefill() {
    if (!prefill) return
    setAuw(prefill.auwG)
    setCapacity(prefill.capacityMah)
    setRotors(prefill.rotors)
    globalThis.localStorage?.removeItem(DRONE_PREFILL_KEY)
    setPrefill(null)
  }

  const hoverThrust = auw / rotors
  const thrustToWeight = (thrustPerMotor * rotors) / auw
  const flightTime = capacity / 1000 / avgCurrent * 60 * 0.85
  const payload = Math.max(0, thrustPerMotor * rotors - auw)

  return (
    <BasicCalcShell title="xcopterCalc — Мультиротор" description="Оцінка зависання, польотного часу, запасу тяги та корисного навантаження.">
      {prefill && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-ecalc-orange/30 bg-ecalc-orange/8 px-4 py-2.5 text-sm">
          <span className="text-ecalc-text">📦 <span className="font-semibold text-ecalc-orange">{prefill.name}</span> — завантажити параметри з бази дронів?</span>
          <button type="button" onClick={applyPrefill} className="shrink-0 rounded-lg bg-ecalc-orange px-3 py-1 text-xs font-semibold text-white hover:bg-ecalc-orangelt transition-colors">
            Завантажити
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="AUW, г"><Input type="number" min="1" value={auw} onChange={(e) => setAuw(Number(e.target.value))} /></Field>
        <Field label="Кількість роторів"><Select title="Кількість роторів" value={String(rotors)} onChange={(e) => setRotors(Number(e.target.value))}><option value="4">4</option><option value="6">6</option><option value="8">8</option></Select></Field>
        <Field label="Ємність, mAh"><Input type="number" min="1" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} /></Field>
        <Field label="Середній струм, A"><Input type="number" min="0.1" value={avgCurrent} onChange={(e) => setAvgCurrent(Number(e.target.value))} /></Field>
        <Field label="Тяга одного мотора, г"><Input type="number" min="1" value={thrustPerMotor} onChange={(e) => setThrustPerMotor(Number(e.target.value))} /></Field>
      </div>
      <MetricGrid items={[
        ['Тяга на мотор у висінні', `${round(hoverThrust, 0)} г`],
        ['Час польоту', `${round(flightTime, 1)} хв`],
        ['T/W', `${round(thrustToWeight, 2)} : 1`],
        ['Оцінка корисного навантаження', `${round(payload, 0)} г`],
      ]} />
    </BasicCalcShell>
  )
}

export function CGCalcBasic() {
  const [noseWeight, setNoseWeight] = usePersistedState('cgcalc.noseweight', 620)
  const [noseArm, setNoseArm] = usePersistedState('cgcalc.nosearm', 110)
  const [batteryWeight, setBatteryWeight] = usePersistedState('cgcalc.batteryweight', 420)
  const [batteryArm, setBatteryArm] = usePersistedState('cgcalc.batteryarm', 280)
  const [tailWeight, setTailWeight] = usePersistedState('cgcalc.tailweight', 160)
  const [tailArm, setTailArm] = usePersistedState('cgcalc.tailarm', 790)

  const totalWeight = noseWeight + batteryWeight + tailWeight
  const cg = (noseWeight * noseArm + batteryWeight * batteryArm + tailWeight * tailArm) / totalWeight

  return (
    <BasicCalcShell title="cgCalc — Центр ваги" description="Обчислення центру ваги через зважене середнє положень компонентів.">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Field label="Носовий вузол, г"><Input type="number" value={noseWeight} onChange={(e) => setNoseWeight(Number(e.target.value))} /></Field>
        <Field label="Плече носового вузла, мм"><Input type="number" value={noseArm} onChange={(e) => setNoseArm(Number(e.target.value))} /></Field>
        <Field label="Акумулятор, г"><Input type="number" value={batteryWeight} onChange={(e) => setBatteryWeight(Number(e.target.value))} /></Field>
        <Field label="Плече акумулятора, мм"><Input type="number" value={batteryArm} onChange={(e) => setBatteryArm(Number(e.target.value))} /></Field>
        <Field label="Хвіст, г"><Input type="number" value={tailWeight} onChange={(e) => setTailWeight(Number(e.target.value))} /></Field>
        <Field label="Плече хвоста, мм"><Input type="number" value={tailArm} onChange={(e) => setTailArm(Number(e.target.value))} /></Field>
      </div>
      <MetricGrid items={[
        ['Сумарна маса', `${round(totalWeight, 0)} г`],
        ['Поточний CG', `${round(cg, 1)} мм`],
      ]} />
    </BasicCalcShell>
  )
}

export function PlaceholderCalc({ title, description, metrics }: { title: string; description: string; metrics: Array<[string, string]> }) {
  return (
    <BasicCalcShell title={title} description={description}>
      <MetricGrid items={metrics} />
      <div className="rounded-lg border border-dashed border-ecalc-border p-4 text-sm text-ecalc-muted">
        Базова інтерактивна версія для цього калькулятора додана як частина suite. Повна фізична модель може бути розширена окремим кроком так само, як perfCalc.
      </div>
    </BasicCalcShell>
  )
}

function BasicCalcShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

function MetricGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-ecalc-border bg-ecalc-lightbg p-3">
          <div className="text-[11px] uppercase tracking-wide text-ecalc-muted">{label}</div>
          <div className="mt-1 text-base font-semibold text-ecalc-navy">{value}</div>
        </div>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}