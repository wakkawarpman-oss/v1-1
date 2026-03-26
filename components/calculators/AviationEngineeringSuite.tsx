'use client'

import { useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { Battery, Compass, Cpu, Gauge, Layers3, Plane, Rocket, Search, Wind, Wrench } from 'lucide-react'
import {
  advanceRatio,
  breguetEndurance,
  breguetRange,
  cRate,
  climbAngle,
  clMax,
  dragCoefficient,
  equivalentAirspeed,
  fuelWeight,
  gLoad,
  landingDistance,
  liftDragRatio,
  motorTorque,
  propellerEfficiency,
  rateOfClimb,
  systemEfficiency,
  takeoffDistance,
  thrustAltitude,
  trueAirspeed,
  tsfc,
  wingLoading,
} from '@/lib/aviation-engineering'
import { Field, formatToolNumber, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function TasCard() {
  const [s, setS] = usePersistedState('engineering.tas', { ias: 200, rho: 1, rho0: 1.225 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Gauge className="h-4 w-4" />} title="TAS з IAS" description="True Airspeed через вхідну IAS і щільність повітря на висоті.">
      <Field label="IAS, км/год"><Input type="number" value={s.ias} onChange={(e) => setS((c) => ({ ...c, ias: Number(e.target.value) }))} /></Field>
      <Field label="Щільність на висоті, кг/м³"><Input type="number" step="0.001" value={s.rho} onChange={(e) => setS((c) => ({ ...c, rho: Number(e.target.value) }))} /></Field>
      <Field label="Щільність на рівні моря, кг/м³"><Input type="number" step="0.001" value={s.rho0} onChange={(e) => setS((c) => ({ ...c, rho0: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(trueAirspeed(s.ias, s.rho, s.rho0))}>Розрахувати</Button>
      <ResultBox>TAS: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 1)} км/год</span></ResultBox>
    </ToolCard>
  )
}

function EasCard() {
  const [s, setS] = usePersistedState('engineering.eas', { ias: 200, sigma: 0.82 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Wind className="h-4 w-4" />} title="EAS з IAS" description="Equivalent Airspeed через IAS та sigma = ρ/ρ₀.">
      <Field label="IAS, км/год"><Input type="number" value={s.ias} onChange={(e) => setS((c) => ({ ...c, ias: Number(e.target.value) }))} /></Field>
      <Field label="Sigma = ρ/ρ₀"><Input type="number" step="0.01" value={s.sigma} onChange={(e) => setS((c) => ({ ...c, sigma: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(equivalentAirspeed(s.ias, s.sigma))}>Розрахувати</Button>
      <ResultBox>EAS: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 1)} км/год</span></ResultBox>
    </ToolCard>
  )
}

function ThrustAltitudeCard() {
  const [s, setS] = usePersistedState('engineering.thrust', { thrustSea: 12000, rho: 0.95, rho0: 1.225, exponent: 1.0 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Rocket className="h-4 w-4" />} title="Тяга на висоті" description="Падіння тяги зі зміною щільності. Електро: exp=1.0; гвинтомоторні: exp=0.7; ГТД: exp=1.2.">
      <Field label="Тяга на рівні моря, Н"><Input type="number" value={s.thrustSea} onChange={(e) => setS((c) => ({ ...c, thrustSea: Number(e.target.value) }))} /></Field>
      <Field label="Поточна щільність, кг/м³"><Input type="number" step="0.001" value={s.rho} onChange={(e) => setS((c) => ({ ...c, rho: Number(e.target.value) }))} /></Field>
      <Field label="Щільність рівня моря, кг/м³"><Input type="number" step="0.001" value={s.rho0} onChange={(e) => setS((c) => ({ ...c, rho0: Number(e.target.value) }))} /></Field>
      <Field label="Показник степеня" hint="Електро: 1.0 | Поршень+гвинт: 0.7 | ГТД: 1.2"><Input type="number" step="0.1" value={s.exponent} onChange={(e) => setS((c) => ({ ...c, exponent: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(thrustAltitude(s.thrustSea, s.rho, s.rho0, s.exponent))}>Розрахувати</Button>
      {result !== null && <ResultBox copyValue={formatToolNumber(result, 1)}>Тяга на висоті: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 1)} Н</span></ResultBox>}
    </ToolCard>
  )
}

function TsfcCard() {
  const [s, setS] = usePersistedState('engineering.tsfc', { fuelFlow: 540, thrustKN: 18 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Cpu className="h-4 w-4" />} title="TSFC" description="Питома витрата палива за витратою та тягою двигуна.">
      <Field label="Витрата палива, кг/год"><Input type="number" value={s.fuelFlow} onChange={(e) => setS((c) => ({ ...c, fuelFlow: Number(e.target.value) }))} /></Field>
      <Field label="Тяга, кН"><Input type="number" step="0.1" value={s.thrustKN} onChange={(e) => setS((c) => ({ ...c, thrustKN: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(tsfc(s.fuelFlow, s.thrustKN))}>Розрахувати</Button>
      <ResultBox>TSFC: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 2)} кг/год/кН</span></ResultBox>
    </ToolCard>
  )
}

function BreguetRangeCard() {
  const [s, setS] = usePersistedState('engineering.breguetrange', { speed: 720, tsfcValue: 0.6, liftDrag: 15, initialWeight: 7200, finalWeight: 5900 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Compass className="h-4 w-4" />} title="Дальність Бреге" description="Максимальна дальність за Бреге: R = (V/TSFC)·(L/D)·ln(W0/W1). TSFC в кг/кгс/год: турбофан 0.5–0.8, турбогвинт 0.3–0.5.">
      <Field label="Швидкість, км/год"><Input type="number" value={s.speed} onChange={(e) => setS((c) => ({ ...c, speed: Number(e.target.value) }))} /></Field>
      <Field label="TSFC, кг/кгс/год" hint="Гравітаційні одиниці: 0.5 = турбофан, 0.3 = турбогвинт"><Input type="number" step="0.01" value={s.tsfcValue} onChange={(e) => setS((c) => ({ ...c, tsfcValue: Number(e.target.value) }))} /></Field>
      <Field label="L/D"><Input type="number" step="0.1" value={s.liftDrag} onChange={(e) => setS((c) => ({ ...c, liftDrag: Number(e.target.value) }))} /></Field>
      <Field label="Початкова вага"><Input type="number" value={s.initialWeight} onChange={(e) => setS((c) => ({ ...c, initialWeight: Number(e.target.value) }))} /></Field>
      <Field label="Кінцева вага"><Input type="number" value={s.finalWeight} onChange={(e) => setS((c) => ({ ...c, finalWeight: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(breguetRange(s.speed, s.tsfcValue, s.liftDrag, s.initialWeight, s.finalWeight))}>Розрахувати</Button>
      <ResultBox>Дальність: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 0)} км</span></ResultBox>
    </ToolCard>
  )
}

function BreguetEnduranceCard() {
  const [s, setS] = usePersistedState('engineering.breguetendurance', { tsfcValue: 0.6, liftDrag: 15, initialWeight: 7200, finalWeight: 5900 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Wrench className="h-4 w-4" />} title="Тривалість Бреге" description="Ендюранс за Бреге: E = (1/TSFC)·(L/D)·ln(W0/W1) в годинах. TSFC в кг/кгс/год.">
      <Field label="TSFC, кг/кгс/год" hint="Гравітаційні одиниці: 0.5 = турбофан, 0.3 = турбогвинт"><Input type="number" step="0.01" value={s.tsfcValue} onChange={(e) => setS((c) => ({ ...c, tsfcValue: Number(e.target.value) }))} /></Field>
      <Field label="L/D"><Input type="number" step="0.1" value={s.liftDrag} onChange={(e) => setS((c) => ({ ...c, liftDrag: Number(e.target.value) }))} /></Field>
      <Field label="Початкова вага"><Input type="number" value={s.initialWeight} onChange={(e) => setS((c) => ({ ...c, initialWeight: Number(e.target.value) }))} /></Field>
      <Field label="Кінцева вага"><Input type="number" value={s.finalWeight} onChange={(e) => setS((c) => ({ ...c, finalWeight: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(breguetEndurance(s.tsfcValue, s.liftDrag, s.initialWeight, s.finalWeight))}>Розрахувати</Button>
      <ResultBox>Тривалість: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 2)} год</span></ResultBox>
    </ToolCard>
  )
}

function ClimbAngleCard() {
  const [s, setS] = usePersistedState('engineering.climb', { thrust: 1800, drag: 1250, weight: 4200 })
  const [result, setResult] = useState<{ radians: number; degrees: number } | null>(null)
  return (
    <ToolCard icon={<Plane className="h-4 w-4" />} title="Кут набору" description="Climb angle через різницю тяги, опору й ваги літака.">
      <Field label="Тяга, Н"><Input type="number" value={s.thrust} onChange={(e) => setS((c) => ({ ...c, thrust: Number(e.target.value) }))} /></Field>
      <Field label="Опір, Н"><Input type="number" value={s.drag} onChange={(e) => setS((c) => ({ ...c, drag: Number(e.target.value) }))} /></Field>
      <Field label="Вага, Н"><Input type="number" value={s.weight} onChange={(e) => setS((c) => ({ ...c, weight: Number(e.target.value) }))} /></Field>
      <Button onClick={() => { const r = climbAngle(s.thrust, s.drag, s.weight); setResult({ radians: r, degrees: (r * 180) / Math.PI }) }}>Розрахувати</Button>
      <ResultBox>γ: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result?.degrees, 2)}°</span></ResultBox>
      <ResultBox>γ: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result?.radians, 4)} рад</span></ResultBox>
    </ToolCard>
  )
}

function RateOfClimbCard() {
  const [s, setS] = usePersistedState('engineering.roc', { speed: 42, gammaDeg: 8 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Rocket className="h-4 w-4" />} title="Швидкопідйомність" description="ROC у м/с на основі швидкості польоту та кута набору.">
      <Field label="Швидкість, м/с"><Input type="number" value={s.speed} onChange={(e) => setS((c) => ({ ...c, speed: Number(e.target.value) }))} /></Field>
      <Field label="Кут набору, °"><Input type="number" step="0.1" value={s.gammaDeg} onChange={(e) => setS((c) => ({ ...c, gammaDeg: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(rateOfClimb(s.speed, (s.gammaDeg * Math.PI) / 180))}>Розрахувати</Button>
      <ResultBox>ROC: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 2)} м/с</span></ResultBox>
    </ToolCard>
  )
}

function TakeoffDistanceCard() {
  const [s, setS] = usePersistedState('engineering.takeoff', { weight: 12500, rho: 1.1, area: 16.2, clMaxValue: 1.8, thrust: 3400 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Plane className="h-4 w-4" />} title="Злітна дистанція" description="Спрощена takeoff field length за вагою, площею крила і тягою.">
      <Field label="Вага, Н"><Input type="number" value={s.weight} onChange={(e) => setS((c) => ({ ...c, weight: Number(e.target.value) }))} /></Field>
      <Field label="Щільність, кг/м³"><Input type="number" step="0.001" value={s.rho} onChange={(e) => setS((c) => ({ ...c, rho: Number(e.target.value) }))} /></Field>
      <Field label="Площа крила, м²"><Input type="number" step="0.1" value={s.area} onChange={(e) => setS((c) => ({ ...c, area: Number(e.target.value) }))} /></Field>
      <Field label="CLmax"><Input type="number" step="0.01" value={s.clMaxValue} onChange={(e) => setS((c) => ({ ...c, clMaxValue: Number(e.target.value) }))} /></Field>
      <Field label="Тяга, Н"><Input type="number" value={s.thrust} onChange={(e) => setS((c) => ({ ...c, thrust: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(takeoffDistance(s.weight, s.rho, s.area, s.clMaxValue, s.thrust))}>Розрахувати</Button>
      <ResultBox>TOFL: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 0)} м</span></ResultBox>
    </ToolCard>
  )
}

function LandingDistanceCard() {
  const [s, setS] = usePersistedState('engineering.landing', { weight: 11200, rho: 1.1, area: 16.2, clMaxValue: 2, reverseThrust: 2800 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Plane className="h-4 w-4" />} title="Посадкова дистанція" description="Спрощена landing distance з урахуванням ревесу або гальмівної сили.">
      <Field label="Вага, Н"><Input type="number" value={s.weight} onChange={(e) => setS((c) => ({ ...c, weight: Number(e.target.value) }))} /></Field>
      <Field label="Щільність, кг/м³"><Input type="number" step="0.001" value={s.rho} onChange={(e) => setS((c) => ({ ...c, rho: Number(e.target.value) }))} /></Field>
      <Field label="Площа крила, м²"><Input type="number" step="0.1" value={s.area} onChange={(e) => setS((c) => ({ ...c, area: Number(e.target.value) }))} /></Field>
      <Field label="CLmax"><Input type="number" step="0.01" value={s.clMaxValue} onChange={(e) => setS((c) => ({ ...c, clMaxValue: Number(e.target.value) }))} /></Field>
      <Field label="Еквівалент reverse thrust, Н"><Input type="number" value={s.reverseThrust} onChange={(e) => setS((c) => ({ ...c, reverseThrust: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(landingDistance(s.weight, s.rho, s.area, s.clMaxValue, s.reverseThrust))}>Розрахувати</Button>
      <ResultBox>Landing distance: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 0)} м</span></ResultBox>
    </ToolCard>
  )
}

function FuelWeightCard() {
  const [s, setS] = usePersistedState('engineering.fuel', { initialWeight: 7200, finalWeight: 5900 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Battery className="h-4 w-4" />} title="Маса палива місії" description="Різниця між початковою і фінальною вагою місії.">
      <Field label="Початкова вага"><Input type="number" value={s.initialWeight} onChange={(e) => setS((c) => ({ ...c, initialWeight: Number(e.target.value) }))} /></Field>
      <Field label="Кінцева вага"><Input type="number" value={s.finalWeight} onChange={(e) => setS((c) => ({ ...c, finalWeight: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(fuelWeight(s.initialWeight, s.finalWeight))}>Розрахувати</Button>
      <ResultBox>Маса палива: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 1)}</span></ResultBox>
    </ToolCard>
  )
}

function WingLoadingCard() {
  const [s, setS] = usePersistedState('engineering.wing', { weight: 980, area: 12.4 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Layers3 className="h-4 w-4" />} title="Навантаження на крило" description="Wing loading для грубої класифікації посадкової та крейсерської поведінки.">
      <Field label="Вага, кг або Н"><Input type="number" value={s.weight} onChange={(e) => setS((c) => ({ ...c, weight: Number(e.target.value) }))} /></Field>
      <Field label="Площа крила, м²"><Input type="number" step="0.1" value={s.area} onChange={(e) => setS((c) => ({ ...c, area: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(wingLoading(s.weight, s.area))}>Розрахувати</Button>
      <ResultBox>Wing loading: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 2)}</span> / м²</ResultBox>
    </ToolCard>
  )
}

function ClMaxCard() {
  const [s, setS] = usePersistedState('engineering.clmax', { weight: 4200, rho: 1.225, stallSpeed: 18, area: 14.8 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Search className="h-4 w-4" />} title="CLmax зі швидкості зриву" description="Оцінка максимального коефіцієнта підйомної сили за stall speed.">
      <Field label="Вага, Н"><Input type="number" value={s.weight} onChange={(e) => setS((c) => ({ ...c, weight: Number(e.target.value) }))} /></Field>
      <Field label="Щільність, кг/м³"><Input type="number" step="0.001" value={s.rho} onChange={(e) => setS((c) => ({ ...c, rho: Number(e.target.value) }))} /></Field>
      <Field label="Швидкість зриву, м/с"><Input type="number" step="0.1" value={s.stallSpeed} onChange={(e) => setS((c) => ({ ...c, stallSpeed: Number(e.target.value) }))} /></Field>
      <Field label="Площа крила, м²"><Input type="number" step="0.1" value={s.area} onChange={(e) => setS((c) => ({ ...c, area: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(clMax(s.weight, s.rho, s.stallSpeed, s.area))}>Розрахувати</Button>
      <ResultBox>CLmax: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 3)}</span></ResultBox>
    </ToolCard>
  )
}

function DragCoefficientCard() {
  const [s, setS] = usePersistedState('engineering.drag', { cd0: 0.025, k: 0.045, cl: 0.8 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Wind className="h-4 w-4" />} title="Коефіцієнт опору C_D" description="Параболічна полярна: C_D = C_D0 + k·C_L².">
      <Field label="CD0"><Input type="number" step="0.001" value={s.cd0} onChange={(e) => setS((c) => ({ ...c, cd0: Number(e.target.value) }))} /></Field>
      <Field label="k"><Input type="number" step="0.001" value={s.k} onChange={(e) => setS((c) => ({ ...c, k: Number(e.target.value) }))} /></Field>
      <Field label="CL"><Input type="number" step="0.01" value={s.cl} onChange={(e) => setS((c) => ({ ...c, cl: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(dragCoefficient(s.cd0, s.k, s.cl))}>Розрахувати</Button>
      <ResultBox>CD: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 4)}</span></ResultBox>
    </ToolCard>
  )
}

function LiftDragRatioCard() {
  const [s, setS] = usePersistedState('engineering.ld', { cl: 0.8, cd: 0.054 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Compass className="h-4 w-4" />} title="Аеродинамічна якість L/D" description="Відношення підйомної сили до опору для режиму польоту.">
      <Field label="CL"><Input type="number" step="0.01" value={s.cl} onChange={(e) => setS((c) => ({ ...c, cl: Number(e.target.value) }))} /></Field>
      <Field label="CD"><Input type="number" step="0.001" value={s.cd} onChange={(e) => setS((c) => ({ ...c, cd: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(liftDragRatio(s.cl, s.cd))}>Розрахувати</Button>
      <ResultBox>L/D: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 2)}</span></ResultBox>
    </ToolCard>
  )
}

function PropellerEfficiencyCard() {
  const [s, setS] = usePersistedState('engineering.prop', { speed: 32, rpm: 7800, diameter: 0.3556 })
  const [result, setResult] = useState<{ j: number; eta: number } | null>(null)
  return (
    <ToolCard icon={<Rocket className="h-4 w-4" />} title="ККД пропелера" description="Advance ratio J та спрощений розрахунок η_prop.">
      <Field label="Швидкість, м/с"><Input type="number" step="0.1" value={s.speed} onChange={(e) => setS((c) => ({ ...c, speed: Number(e.target.value) }))} /></Field>
      <Field label="RPM"><Input type="number" value={s.rpm} onChange={(e) => setS((c) => ({ ...c, rpm: Number(e.target.value) }))} /></Field>
      <Field label="Діаметр пропелера, м"><Input type="number" step="0.001" value={s.diameter} onChange={(e) => setS((c) => ({ ...c, diameter: Number(e.target.value) }))} /></Field>
      <Button onClick={() => { const j = advanceRatio(s.speed, s.rpm, s.diameter); setResult({ j, eta: propellerEfficiency(j) }) }}>Розрахувати</Button>
      <ResultBox>J: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result?.j, 3)}</span></ResultBox>
      <ResultBox>ηprop: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result ? result.eta * 100 : null, 1)}%</span></ResultBox>
    </ToolCard>
  )
}

function MotorTorqueCard() {
  const [s, setS] = usePersistedState('engineering.torque', { power: 1850, rpm: 7200 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Cpu className="h-4 w-4" />} title="Крутний момент двигуна" description="Механічний torque за потужністю і обертами валу.">
      <Field label="Потужність, W"><Input type="number" value={s.power} onChange={(e) => setS((c) => ({ ...c, power: Number(e.target.value) }))} /></Field>
      <Field label="RPM"><Input type="number" value={s.rpm} onChange={(e) => setS((c) => ({ ...c, rpm: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(motorTorque(s.power, s.rpm))}>Розрахувати</Button>
      <ResultBox>τ: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 4)} Н·м</span></ResultBox>
    </ToolCard>
  )
}

function SystemEfficiencyCard() {
  const [s, setS] = usePersistedState('engineering.efficiency', { thrust: 48, speed: 28, current: 55, voltage: 22.2 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Battery className="h-4 w-4" />} title="ККД системи" description="Тяга × швидкість / електрична потужність батареї.">
      <Field label="Тяга, Н"><Input type="number" step="0.1" value={s.thrust} onChange={(e) => setS((c) => ({ ...c, thrust: Number(e.target.value) }))} /></Field>
      <Field label="Швидкість, м/с"><Input type="number" step="0.1" value={s.speed} onChange={(e) => setS((c) => ({ ...c, speed: Number(e.target.value) }))} /></Field>
      <Field label="Струм, A"><Input type="number" step="0.1" value={s.current} onChange={(e) => setS((c) => ({ ...c, current: Number(e.target.value) }))} /></Field>
      <Field label="Напруга батареї, V"><Input type="number" step="0.1" value={s.voltage} onChange={(e) => setS((c) => ({ ...c, voltage: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(systemEfficiency(s.thrust, s.speed, s.current, s.voltage))}>Розрахувати</Button>
      <ResultBox>ηsys: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result ? result * 100 : null, 1)}%</span></ResultBox>
    </ToolCard>
  )
}

function GLoadCard() {
  const [s, setS] = usePersistedState('engineering.gload', { force: 6200, mass: 95 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Gauge className="h-4 w-4" />} title="G-навантаження" description="Centrifugal load для перевірки маневрів і кріплень.">
      <Field label="Відцентрова сила, Н"><Input type="number" value={s.force} onChange={(e) => setS((c) => ({ ...c, force: Number(e.target.value) }))} /></Field>
      <Field label="Маса, кг"><Input type="number" step="0.1" value={s.mass} onChange={(e) => setS((c) => ({ ...c, mass: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(gLoad(s.force, s.mass))}>Розрахувати</Button>
      <ResultBox>G-load: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 2)} g</span></ResultBox>
    </ToolCard>
  )
}

function CRateCard() {
  const [s, setS] = usePersistedState('engineering.crate', { current: 42, capacity: 16 })
  const [result, setResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Battery className="h-4 w-4" />} title="Battery C-rate" description="Струм заряду або розряду відносно ємності батареї в Ah.">
      <Field label="Струм, A"><Input type="number" step="0.1" value={s.current} onChange={(e) => setS((c) => ({ ...c, current: Number(e.target.value) }))} /></Field>
      <Field label="Ємність батареї, Ah"><Input type="number" step="0.1" value={s.capacity} onChange={(e) => setS((c) => ({ ...c, capacity: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResult(cRate(s.current, s.capacity))}>Розрахувати</Button>
      <ResultBox>C-rate: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result, 2)}C</span></ResultBox>
    </ToolCard>
  )
}

export function AviationEngineeringSuite() {
  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle>Aviation Engineering Suite</CardTitle>
          <CardDescription>
            20 додаткових інженерних інструментів для швидких оцінок аеродинаміки, злітно-посадкових режимів, тяги, батарей, силової установки та місійних розрахунків.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-ecalc-orange/20 bg-ecalc-orange/5 px-4 py-3 text-sm text-ecalc-text">
            Формули винесені в окремий `lib`-рівень, тому цей модуль лишається UI-обгорткою над прозорими обчисленнями. Значення придатні для engineering sanity-check і попереднього проєктування, але не замінюють сертифіковані аеродинамічні моделі.
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="metric-tile">
              <div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Інструментів</div>
              <div className="mt-1 text-xl font-semibold text-ecalc-navy">20</div>
            </div>
            <div className="metric-tile">
              <div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Покриття</div>
              <div className="mt-1 text-sm font-semibold text-ecalc-navy">Аеродинаміка, місія, propulsion</div>
            </div>
            <div className="metric-tile">
              <div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Призначення</div>
              <div className="mt-1 text-sm font-semibold text-ecalc-navy">Flight planning + system checks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <TasCard />
        <EasCard />
        <ThrustAltitudeCard />
        <TsfcCard />
        <BreguetRangeCard />
        <BreguetEnduranceCard />
        <ClimbAngleCard />
        <RateOfClimbCard />
        <TakeoffDistanceCard />
        <LandingDistanceCard />
        <FuelWeightCard />
        <WingLoadingCard />
        <ClMaxCard />
        <DragCoefficientCard />
        <LiftDragRatioCard />
        <PropellerEfficiencyCard />
        <MotorTorqueCard />
        <SystemEfficiencyCard />
        <GLoadCard />
        <CRateCard />
      </div>
    </section>
  )
}
