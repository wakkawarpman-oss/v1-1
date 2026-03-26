'use client'

import { useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { Compass, Gauge, MapPinned, Navigation, Waves } from 'lucide-react'
import {
  CalcEmptyState,
  Field,
  formatToolNumber,
  ResultBox,
  ToolCard,
} from '@/components/calculators/CalculatorToolPrimitives'
import {
  dynamicPressurePa,
  greatCircle,
  reynoldsNumber,
  rhumbLine,
  windCorrection,
  stallSpeed,
  turningRadius,
  glideDistance,
  propTipSpeedMach,
  antennaTracker,
  type StallSpeedResult,
  type PropTipSpeedResult,
} from '@/lib/aero-navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function ReynoldsNumberCard() {
  const [reynoldsState, setReynoldsState] = usePersistedState('aeronav.reynolds', { speedKmh: 90, chordMm: 220, density: 1.225, viscosity: 1.81e-5 })
  const [reynoldsResult, setReynoldsResult] = useState<number | null>(null)

  function calculateReynolds() {
    setReynoldsResult(
      reynoldsNumber({
        speedMs: reynoldsState.speedKmh / 3.6,
        characteristicLengthM: reynoldsState.chordMm / 1000,
        densityKgM3: reynoldsState.density,
        dynamicViscosityPaS: reynoldsState.viscosity,
      }),
    )
  }

  return (
    <ToolCard icon={<Waves className="h-4 w-4" />} title="Число Рейнольдса" description="Оцінка режиму обтікання за швидкістю, характерним розміром, густиною і в'язкістю.">
      <Field label="Швидкість, км/год"><Input type="number" value={reynoldsState.speedKmh} onChange={(e) => setReynoldsState((current) => ({ ...current, speedKmh: Number(e.target.value) }))} /></Field>
      <Field label="Хорда / характерний розмір, мм"><Input type="number" value={reynoldsState.chordMm} onChange={(e) => setReynoldsState((current) => ({ ...current, chordMm: Number(e.target.value) }))} /></Field>
      <Field label="Щільність, кг/м³" hint="Типове значення біля рівня моря"><Input type="number" step="0.001" value={reynoldsState.density} onChange={(e) => setReynoldsState((current) => ({ ...current, density: Number(e.target.value) }))} /></Field>
      <Field label="Динамічна в'язкість, Па·с" hint="Для повітря часто використовують 1.81e-5"><Input type="number" step="0.000001" value={reynoldsState.viscosity} onChange={(e) => setReynoldsState((current) => ({ ...current, viscosity: Number(e.target.value) }))} /></Field>
      <Button onClick={calculateReynolds}>Розрахувати</Button>
      <ResultBox>Re = <span className="font-semibold text-ecalc-navy">{formatToolNumber(reynoldsResult, 0)}</span></ResultBox>
    </ToolCard>
  )
}

function DynamicPressureCard() {
  const [pressureState, setPressureState] = usePersistedState('aeronav.pressure', { speedKmh: 90, density: 1.225 })
  const [pressureResult, setPressureResult] = useState<number | null>(null)

  function calculateDynamicPressure() {
    setPressureResult(dynamicPressurePa(pressureState.speedKmh / 3.6, pressureState.density))
  }

  return (
    <ToolCard icon={<Gauge className="h-4 w-4" />} title="Динамічний тиск" description="Швидкий перерахунок навантаження потоку для rough checks крила, датчиків і маневрів.">
      <Field label="Швидкість, км/год"><Input type="number" value={pressureState.speedKmh} onChange={(e) => setPressureState((current) => ({ ...current, speedKmh: Number(e.target.value) }))} /></Field>
      <Field label="Щільність, кг/м³"><Input type="number" step="0.001" value={pressureState.density} onChange={(e) => setPressureState((current) => ({ ...current, density: Number(e.target.value) }))} /></Field>
      <Button onClick={calculateDynamicPressure}>Розрахувати</Button>
      <ResultBox>Динамічний тиск: <span className="font-semibold text-ecalc-navy">{formatToolNumber(pressureResult, 1)} Па</span></ResultBox>
    </ToolCard>
  )
}

function GreatCircleCard() {
  const [greatCircleState, setGreatCircleState] = usePersistedState('aeronav.greatcircle', { fromLat: 50.45, fromLon: 30.52, toLat: 49.84, toLon: 24.03 })
  const [greatCircleResult, setGreatCircleResult] = useState<{ distanceKm: number; bearingDeg: number } | null>(null)

  function calculateGreatCircle() {
    const result = greatCircle({
      fromLatDeg: greatCircleState.fromLat,
      fromLonDeg: greatCircleState.fromLon,
      toLatDeg: greatCircleState.toLat,
      toLonDeg: greatCircleState.toLon,
    })
    setGreatCircleResult({ distanceKm: result.distanceKm, bearingDeg: result.initialBearingDeg })
  }

  return (
    <ToolCard icon={<MapPinned className="h-4 w-4" />} title="Ортодромія" description="Найкоротша відстань по великому колу між двома координатами плюс початковий курс.">
      <Field label="Широта старту, °"><Input type="number" step="0.0001" value={greatCircleState.fromLat} onChange={(e) => setGreatCircleState((current) => ({ ...current, fromLat: Number(e.target.value) }))} /></Field>
      <Field label="Довгота старту, °"><Input type="number" step="0.0001" value={greatCircleState.fromLon} onChange={(e) => setGreatCircleState((current) => ({ ...current, fromLon: Number(e.target.value) }))} /></Field>
      <Field label="Широта фінішу, °"><Input type="number" step="0.0001" value={greatCircleState.toLat} onChange={(e) => setGreatCircleState((current) => ({ ...current, toLat: Number(e.target.value) }))} /></Field>
      <Field label="Довгота фінішу, °"><Input type="number" step="0.0001" value={greatCircleState.toLon} onChange={(e) => setGreatCircleState((current) => ({ ...current, toLon: Number(e.target.value) }))} /></Field>
      <Button onClick={calculateGreatCircle}>Розрахувати</Button>
      <ResultBox>Відстань: <span className="font-semibold text-ecalc-navy">{formatToolNumber(greatCircleResult?.distanceKm)} км</span></ResultBox>
      <ResultBox>Початковий курс: <span className="font-semibold text-ecalc-navy">{formatToolNumber(greatCircleResult?.bearingDeg)}°</span></ResultBox>
    </ToolCard>
  )
}

function RhumbLineCard() {
  const [rhumbState, setRhumbState] = usePersistedState('aeronav.rhumb', { fromLat: 50.45, fromLon: 30.52, toLat: 49.84, toLon: 24.03 })
  const [rhumbResult, setRhumbResult] = useState<{ distanceKm: number; bearingDeg: number } | null>(null)

  function calculateRhumbLine() {
    setRhumbResult(
      rhumbLine({
        fromLatDeg: rhumbState.fromLat,
        fromLonDeg: rhumbState.fromLon,
        toLatDeg: rhumbState.toLat,
        toLonDeg: rhumbState.toLon,
      }),
    )
  }

  return (
    <ToolCard icon={<Compass className="h-4 w-4" />} title="Локсодромія" description="Маршрут із постійним курсом для простого планування та порівняння з ортодромією.">
      <Field label="Широта старту, °"><Input type="number" step="0.0001" value={rhumbState.fromLat} onChange={(e) => setRhumbState((current) => ({ ...current, fromLat: Number(e.target.value) }))} /></Field>
      <Field label="Довгота старту, °"><Input type="number" step="0.0001" value={rhumbState.fromLon} onChange={(e) => setRhumbState((current) => ({ ...current, fromLon: Number(e.target.value) }))} /></Field>
      <Field label="Широта фінішу, °"><Input type="number" step="0.0001" value={rhumbState.toLat} onChange={(e) => setRhumbState((current) => ({ ...current, toLat: Number(e.target.value) }))} /></Field>
      <Field label="Довгота фінішу, °"><Input type="number" step="0.0001" value={rhumbState.toLon} onChange={(e) => setRhumbState((current) => ({ ...current, toLon: Number(e.target.value) }))} /></Field>
      <Button onClick={calculateRhumbLine}>Розрахувати</Button>
      <ResultBox>Відстань: <span className="font-semibold text-ecalc-navy">{formatToolNumber(rhumbResult?.distanceKm)} км</span></ResultBox>
      <ResultBox>Курс: <span className="font-semibold text-ecalc-navy">{formatToolNumber(rhumbResult?.bearingDeg)}°</span></ResultBox>
    </ToolCard>
  )
}

function WindCorrectionCard() {
  const [windState, setWindState] = usePersistedState('aeronav.wind', { tasKmh: 95, trackDeg: 270, windFromDeg: 320, windSpeedKmh: 24 })
  const [windResult, setWindResult] = useState<{
    headingDeg: number
    driftDeg: number
    groundSpeedKmh: number
    crosswindKmh: number
    headwindKmh: number
  } | null>(null)

  function calculateWindCorrection() {
    setWindResult(
      windCorrection({
        trueAirspeedKmh: windState.tasKmh,
        desiredTrackDeg: windState.trackDeg,
        windFromDeg: windState.windFromDeg,
        windSpeedKmh: windState.windSpeedKmh,
      }),
    )
  }

  return (
    <ToolCard icon={<Navigation className="h-4 w-4" />} title="Поправка на вітер" description="Розрахунок heading, drift і ground speed для утримання потрібного track.">
      <Field label="True airspeed, км/год"><Input type="number" value={windState.tasKmh} onChange={(e) => setWindState((current) => ({ ...current, tasKmh: Number(e.target.value) }))} /></Field>
      <Field label="Бажаний track, °"><Input type="number" value={windState.trackDeg} onChange={(e) => setWindState((current) => ({ ...current, trackDeg: Number(e.target.value) }))} /></Field>
      <Field label="Вітер звідки, °"><Input type="number" value={windState.windFromDeg} onChange={(e) => setWindState((current) => ({ ...current, windFromDeg: Number(e.target.value) }))} /></Field>
      <Field label="Швидкість вітру, км/год"><Input type="number" value={windState.windSpeedKmh} onChange={(e) => setWindState((current) => ({ ...current, windSpeedKmh: Number(e.target.value) }))} /></Field>
      <Button onClick={calculateWindCorrection}>Розрахувати</Button>
      <ResultBox>Потрібний heading: <span className="font-semibold text-ecalc-navy">{formatToolNumber(windResult?.headingDeg)}°</span></ResultBox>
      <ResultBox>Кут зносу: <span className="font-semibold text-ecalc-navy">{formatToolNumber(windResult?.driftDeg)}°</span></ResultBox>
      <ResultBox>Ground speed: <span className="font-semibold text-ecalc-navy">{formatToolNumber(windResult?.groundSpeedKmh)} км/год</span></ResultBox>
      <ResultBox>Crosswind / headwind: <span className="font-semibold text-ecalc-navy">{formatToolNumber(windResult?.crosswindKmh)} / {formatToolNumber(windResult?.headwindKmh)} км/год</span></ResultBox>
    </ToolCard>
  )
}

function StallSpeedCard() {
  const [stallState, setStallState] = usePersistedState('aeronav.stall', { weightKg: 2.5, wingAreaM2: 0.35, clMax: 1.4, bankAngleDeg: 0, densityKgM3: 1.225 })
  const [stallResult, setStallResult] = useState<StallSpeedResult | null>(null)
  return (
    <ToolCard icon={<Gauge className="h-4 w-4" />} title="Швидкість звалювання" description="Мінімальна швидкість польоту при заданому CLmax, масі та куті крену. У розвороті навантаження збільшується.">
      <Field label="Маса, кг"><Input type="number" step="0.1" value={stallState.weightKg} onChange={(e) => setStallState((s) => ({ ...s, weightKg: Number(e.target.value) }))} /></Field>
      <Field label="Площа крила, м²"><Input type="number" step="0.01" value={stallState.wingAreaM2} onChange={(e) => setStallState((s) => ({ ...s, wingAreaM2: Number(e.target.value) }))} /></Field>
      <Field label="CLmax" hint="Прямое крило ~1.2–1.5"><Input type="number" step="0.05" value={stallState.clMax} onChange={(e) => setStallState((s) => ({ ...s, clMax: Number(e.target.value) }))} /></Field>
      <Field label="Кут крену, °" hint="0 = прямолінійний політ"><Input type="number" value={stallState.bankAngleDeg} onChange={(e) => setStallState((s) => ({ ...s, bankAngleDeg: Number(e.target.value) }))} /></Field>
      <Field label="Щільність, кг/м³"><Input type="number" step="0.001" value={stallState.densityKgM3} onChange={(e) => setStallState((s) => ({ ...s, densityKgM3: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setStallResult(stallSpeed(stallState))}>Розрахувати</Button>
      {stallResult && <>
        <ResultBox copyValue={formatToolNumber(stallResult.stallSpeedKmh, 1)}>Vs: <span className="font-semibold text-ecalc-navy">{formatToolNumber(stallResult.stallSpeedMs, 2)} м/с</span> <span className="text-xs text-ecalc-muted">({formatToolNumber(stallResult.stallSpeedKmh, 1)} км/год)</span></ResultBox>
        <ResultBox copyValue={formatToolNumber(stallResult.loadFactor, 2)}>Коефіцієнт навантаження n: <span className="font-semibold text-ecalc-navy">{formatToolNumber(stallResult.loadFactor, 2)}</span></ResultBox>
      </>}
    </ToolCard>
  )
}

function TurningRadiusCard() {
  const [turnState, setTurnState] = usePersistedState('aeronav.turn', { speedKmh: 80, bankAngleDeg: 30 })
  const [turnResult, setTurnResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Compass className="h-4 w-4" />} title="Радіус розвороту" description="Мінімальний радіус горизонтального розвороту — R = V²/(g·tan(φ)).">
      <Field label="Швидкість, км/год"><Input type="number" value={turnState.speedKmh} onChange={(e) => setTurnState((s) => ({ ...s, speedKmh: Number(e.target.value) }))} /></Field>
      <Field label="Кут крену, °"><Input type="number" min="1" max="89" value={turnState.bankAngleDeg} onChange={(e) => setTurnState((s) => ({ ...s, bankAngleDeg: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setTurnResult(turningRadius(turnState))}>Розрахувати</Button>
      {turnResult !== null && (
        <ResultBox copyValue={formatToolNumber(turnResult, 1)}>Радіус: <span className="font-semibold text-ecalc-navy">{formatToolNumber(turnResult, 1)} м</span></ResultBox>
      )}
    </ToolCard>
  )
}

function GlideDistanceCard() {
  const [glideState, setGlideState] = usePersistedState('aeronav.glide', { altitudeM: 150, liftToDragRatio: 8 })
  const [glideResult, setGlideResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Navigation className="h-4 w-4" />} title="Дальність планування" description="Скільки метрів/км пролетить планер або БПЛА без тяги з заданої висоти при відомому аеродинамічній якості.">
      <Field label="Висота, м"><Input type="number" value={glideState.altitudeM} onChange={(e) => setGlideState((s) => ({ ...s, altitudeM: Number(e.target.value) }))} /></Field>
      <Field label="Аеродинамічна якість L/D" hint="Малий БПЛА ~6–10"><Input type="number" step="0.5" value={glideState.liftToDragRatio} onChange={(e) => setGlideState((s) => ({ ...s, liftToDragRatio: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setGlideResult(glideDistance(glideState))}>Розрахувати</Button>
      {glideResult !== null && (
        <ResultBox copyValue={formatToolNumber(glideResult, 0)}>Дальність: <span className="font-semibold text-ecalc-navy">{formatToolNumber(glideResult, 0)} м</span> <span className="text-xs text-ecalc-muted">({formatToolNumber(glideResult / 1000, 2)} км)</span></ResultBox>
      )}
    </ToolCard>
  )
}

function PropTipSpeedCard() {
  const [tipState, setTipState] = usePersistedState('aeronav.tip', { diameterInches: 10, motorKv: 920, batteryVoltage: 22.2, loadEfficiencyPct: 70 })
  const [tipResult, setTipResult] = useState<PropTipSpeedResult | null>(null)
  return (
    <ToolCard icon={<Waves className="h-4 w-4" />} title="Швидкість кінців лопатей (Mach)" description="Перевірка, чи не перевищують кінці пропелера 0.85 Mach — поріг трансзвукових втрат (SPEED_OF_SOUND = 343.4 м/с).">
      <Field label="Діаметр пропелера, дюйми"><Input type="number" step="0.5" value={tipState.diameterInches} onChange={(e) => setTipState((s) => ({ ...s, diameterInches: Number(e.target.value) }))} /></Field>
      <Field label="KV мотора (об/хв/В)"><Input type="number" value={tipState.motorKv} onChange={(e) => setTipState((s) => ({ ...s, motorKv: Number(e.target.value) }))} /></Field>
      <Field label="Напруга батареї, В"><Input type="number" step="0.1" value={tipState.batteryVoltage} onChange={(e) => setTipState((s) => ({ ...s, batteryVoltage: Number(e.target.value) }))} /></Field>
      <Field label="ККД навантаження, %" hint="RPM під навантаженням = KV × V × (eff/100)"><Input type="number" min="1" max="100" value={tipState.loadEfficiencyPct} onChange={(e) => setTipState((s) => ({ ...s, loadEfficiencyPct: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setTipResult(propTipSpeedMach(tipState))}>Розрахувати</Button>
      {tipResult && <>
        <ResultBox copyValue={formatToolNumber(tipResult.machNumber, 3)}>Mach: <span className="font-semibold text-ecalc-navy">{formatToolNumber(tipResult.machNumber, 3)}</span> <span className="text-xs text-ecalc-muted">({formatToolNumber(tipResult.tipSpeedMs, 1)} м/с)</span></ResultBox>
        <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium ${tipResult.isOverLimit ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green'}`}>
          {tipResult.isOverLimit ? '⚠ Понад 0.85 Mach — трансзвукові втрати, розгляньте менший діаметр або KV' : '✓ Нижче 0.85 Mach — нормально'}
        </div>
      </>}
    </ToolCard>
  )
}

function AntennaTrackerCard() {
  const [trackerState, setTrackerState] = usePersistedState('aeronav.tracker', {
    gcsLat: 50.45, gcsLng: 30.52, gcsAltM: 120,
    droneLat: 50.47, droneLng: 30.60, droneAltM: 250,
  })
  const [trackerResult, setTrackerResult] = useState<ReturnType<typeof antennaTracker> | null>(null)
  return (
    <ToolCard icon={<MapPinned className="h-4 w-4" />} title="Антенний трекер" description="Азимут і кут елевації антени GCS за координатами наземної станції та дрона. Критично для FPV на дальніх дистанціях.">
      <div className="grid grid-cols-2 gap-3">
        <Field label="GCS широта, °"><Input type="number" step="0.0001" value={trackerState.gcsLat} onChange={(e) => setTrackerState((s) => ({ ...s, gcsLat: Number(e.target.value) }))} /></Field>
        <Field label="GCS довгота, °"><Input type="number" step="0.0001" value={trackerState.gcsLng} onChange={(e) => setTrackerState((s) => ({ ...s, gcsLng: Number(e.target.value) }))} /></Field>
        <Field label="GCS висота, м"><Input type="number" value={trackerState.gcsAltM} onChange={(e) => setTrackerState((s) => ({ ...s, gcsAltM: Number(e.target.value) }))} /></Field>
        <Field label="Дрон широта, °"><Input type="number" step="0.0001" value={trackerState.droneLat} onChange={(e) => setTrackerState((s) => ({ ...s, droneLat: Number(e.target.value) }))} /></Field>
        <Field label="Дрон довгота, °"><Input type="number" step="0.0001" value={trackerState.droneLng} onChange={(e) => setTrackerState((s) => ({ ...s, droneLng: Number(e.target.value) }))} /></Field>
        <Field label="Дрон висота, м"><Input type="number" value={trackerState.droneAltM} onChange={(e) => setTrackerState((s) => ({ ...s, droneAltM: Number(e.target.value) }))} /></Field>
      </div>
      <Button onClick={() => setTrackerResult(antennaTracker(trackerState))}>Розрахувати</Button>
      {!trackerResult && <CalcEmptyState />}
      {trackerResult && <>
        <ResultBox copyValue={formatToolNumber(trackerResult.azimuthDeg, 1)}>Азимут: <span className="font-semibold text-ecalc-navy">{formatToolNumber(trackerResult.azimuthDeg, 1)}°</span></ResultBox>
        <ResultBox copyValue={formatToolNumber(trackerResult.elevationDeg, 1)}>Кут елевації: <span className="font-semibold text-ecalc-navy">{formatToolNumber(trackerResult.elevationDeg, 1)}°</span></ResultBox>
        <ResultBox>Відстань: <span className="font-semibold text-ecalc-navy">{formatToolNumber(trackerResult.slantRangeM / 1000, 2)} км</span> <span className="text-xs text-ecalc-muted">(по землі: {formatToolNumber(trackerResult.groundRangeM / 1000, 2)} км)</span></ResultBox>
      </>}
    </ToolCard>
  )
}

export function AeroNavigationSuite() {
  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle>Aero + Navigation Suite</CardTitle>
          <CardDescription>
            Базові аеродинамічні й навігаційні розрахунки для крил, маршових ділянок і передпольотних оцінок. Формули локальні й прозорі, без зовнішнього API.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="metric-tile">
            <div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Інструментів</div>
            <div className="mt-1 text-xl font-semibold text-ecalc-navy">5</div>
          </div>
          <div className="metric-tile">
            <div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Покриття</div>
            <div className="mt-1 text-sm font-semibold text-ecalc-navy">Аеродинаміка + маршрут</div>
          </div>
          <div className="metric-tile">
            <div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Призначення</div>
            <div className="mt-1 text-sm font-semibold text-ecalc-navy">Передполітна оцінка й інженерний sanity-check</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <ReynoldsNumberCard />
        <DynamicPressureCard />
        <GreatCircleCard />
        <RhumbLineCard />
        <WindCorrectionCard />
        <StallSpeedCard />
        <TurningRadiusCard />
        <GlideDistanceCard />
        <PropTipSpeedCard />
        <AntennaTrackerCard />
      </div>
    </section>
  )
}
