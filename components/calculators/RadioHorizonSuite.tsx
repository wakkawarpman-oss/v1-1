'use client'

import { useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { Activity, Compass, Gauge, Globe, Radio, Radar, Ruler, Signal, TowerControl, Waves } from 'lucide-react'
import {
  airGroundRange,
  airToAirRange,
  diffractionRange,
  effectiveEarthRadius,
  freeSpaceLoss,
  horizonElevationAngle,
  linkRangeFull,
  linkRangeSimple,
  minAltitudeForRange,
  nUnits,
  opticalHorizon,
  radarDetectionRange,
  radarMaxRange,
  radioHorizonFeet,
  radioHorizonFull,
  radioHorizonSimple,
  radioHorizonWithSurface,
  rayCurvature,
  refractiveGradient,
  refractiveIndex,
  refractionFactor,
  relativeCurvature,
} from '@/lib/radio-horizon'
import { Field, formatToolNumber, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function OpticalHorizonCard() {
  const [singleHeight, setSingleHeight] = usePersistedState('radiohorizon.singleheight', 120)
  const [opticalResult, setOpticalResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Globe className="h-4 w-4" />} title="Оптичний горизонт" description="Геометричний горизонт без поправки на атмосферу.">
      <Field label="Висота, м"><Input type="number" value={singleHeight} onChange={(e) => setSingleHeight(Number(e.target.value))} /></Field>
      <Button onClick={() => setOpticalResult(opticalHorizon(singleHeight))}>Розрахувати</Button>
      <ResultBox>Оптичний горизонт: <span className="font-semibold text-ecalc-navy">{formatToolNumber(opticalResult ? opticalResult / 1000 : null, 2)} км</span></ResultBox>
    </ToolCard>
  )
}

function RadioHorizonFullCard() {
  const [singleHeight, setSingleHeight] = usePersistedState('radiohorizon.singleheight', 120)
  const [radioFullResult, setRadioFullResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Radio className="h-4 w-4" />} title="Радіогоризонт (повна)" description="Повна формула для однієї антени з ефективним радіусом Землі.">
      <Field label="Висота антени, м"><Input type="number" value={singleHeight} onChange={(e) => setSingleHeight(Number(e.target.value))} /></Field>
      <Button onClick={() => setRadioFullResult(radioHorizonFull(singleHeight))}>Розрахувати</Button>
      <ResultBox>Радіогоризонт: <span className="font-semibold text-ecalc-navy">{formatToolNumber(radioFullResult ? radioFullResult / 1000 : null, 2)} км</span></ResultBox>
    </ToolCard>
  )
}

function RadioHorizonSimpleCard() {
  const [singleHeight, setSingleHeight] = usePersistedState('radiohorizon.singleheight', 120)
  const [radioSimpleResult, setRadioSimpleResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Signal className="h-4 w-4" />} title="Радіогоризонт (4.1√h)" description="Швидка практична формула для висоти в метрах і результату в кілометрах.">
      <Field label="Висота, м"><Input type="number" value={singleHeight} onChange={(e) => setSingleHeight(Number(e.target.value))} /></Field>
      <Button onClick={() => setRadioSimpleResult(radioHorizonSimple(singleHeight))}>Розрахувати</Button>
      <ResultBox>Швидкий horizon: <span className="font-semibold text-ecalc-navy">{formatToolNumber(radioSimpleResult, 2)} км</span></ResultBox>
    </ToolCard>
  )
}

function RadioHorizonFeetCard() {
  const [feetHeight, setFeetHeight] = usePersistedState('radiohorizon.feetheight', 3500)
  const [feetResult, setFeetResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Ruler className="h-4 w-4" />} title="Радіогоризонт у футах" description="Практична авіаційна формула для футів і nautical miles.">
      <Field label="Висота, ft"><Input type="number" value={feetHeight} onChange={(e) => setFeetHeight(Number(e.target.value))} /></Field>
      <Button onClick={() => setFeetResult(radioHorizonFeet(feetHeight))}>Розрахувати</Button>
      <ResultBox>Distance: <span className="font-semibold text-ecalc-navy">{formatToolNumber(feetResult, 2)} NM</span></ResultBox>
    </ToolCard>
  )
}

function LinkRangeFullCard() {
  const [linkState, setLinkState] = usePersistedState('radiohorizon.link', { h1: 120, h2: 15 })
  const [linkFullResult, setLinkFullResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<TowerControl className="h-4 w-4" />} title="Дальність зв'язку (повна)" description="Сума радіогоризонтів двох антен за повною формулою.">
      <Field label="h1, м"><Input type="number" value={linkState.h1} onChange={(e) => setLinkState((s) => ({ ...s, h1: Number(e.target.value) }))} /></Field>
      <Field label="h2, м"><Input type="number" value={linkState.h2} onChange={(e) => setLinkState((s) => ({ ...s, h2: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setLinkFullResult(linkRangeFull(linkState.h1, linkState.h2))}>Розрахувати</Button>
      <ResultBox>Link range: <span className="font-semibold text-ecalc-navy">{formatToolNumber(linkFullResult ? linkFullResult / 1000 : null, 2)} км</span></ResultBox>
    </ToolCard>
  )
}

function LinkRangeSimpleCard() {
  const [linkState, setLinkState] = usePersistedState('radiohorizon.link', { h1: 120, h2: 15 })
  const [linkSimpleResult, setLinkSimpleResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<TowerControl className="h-4 w-4" />} title="Дальність зв'язку (спрощена)" description="Швидка формула 4.1×(√h1 + √h2) для польових оцінок.">
      <Field label="h1, м"><Input type="number" value={linkState.h1} onChange={(e) => setLinkState((s) => ({ ...s, h1: Number(e.target.value) }))} /></Field>
      <Field label="h2, м"><Input type="number" value={linkState.h2} onChange={(e) => setLinkState((s) => ({ ...s, h2: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setLinkSimpleResult(linkRangeSimple(linkState.h1, linkState.h2))}>Розрахувати</Button>
      <ResultBox>Quick link range: <span className="font-semibold text-ecalc-navy">{formatToolNumber(linkSimpleResult, 2)} км</span></ResultBox>
    </ToolCard>
  )
}

function EffectiveEarthRadiusCard() {
  const [kState, setKState] = usePersistedState('radiohorizon.k', 1.333)
  const [effectiveRadiusResult, setEffectiveRadiusResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Globe className="h-4 w-4" />} title="Ефективний радіус Землі" description="Re = R × k для заданого коефіцієнта рефракції.">
      <Field label="k-factor"><Input type="number" step="0.01" value={kState} onChange={(e) => setKState(Number(e.target.value))} /></Field>
      <Button onClick={() => setEffectiveRadiusResult(effectiveEarthRadius(kState))}>Розрахувати</Button>
      <ResultBox>Effective Earth radius: <span className="font-semibold text-ecalc-navy">{formatToolNumber(effectiveRadiusResult ? effectiveRadiusResult / 1000 : null, 0)} км</span></ResultBox>
    </ToolCard>
  )
}

function KFactorFromGradientCard() {
  const [gradientState, setGradientState] = usePersistedState('radiohorizon.gradient', { deltaN: 40, deltaH: 1000 })
  const [gradientResult, setGradientResult] = useState<number | null>(null)
  const [kFromGradientResult, setKFromGradientResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Waves className="h-4 w-4" />} title="k-factor з градієнта" description="Оцінка коефіцієнта рефракції через dn/dh.">
      <Field label="ΔN"><Input type="number" step="1" value={gradientState.deltaN} onChange={(e) => setGradientState((s) => ({ ...s, deltaN: Number(e.target.value) }))} /></Field>
      <Field label="ΔH, м"><Input type="number" step="1" value={gradientState.deltaH} onChange={(e) => setGradientState((s) => ({ ...s, deltaH: Number(e.target.value) }))} /></Field>
      <Button onClick={() => {
        const gradient = refractiveGradient(gradientState.deltaN, gradientState.deltaH)
        setGradientResult(gradient)
        setKFromGradientResult(refractionFactor(gradient))
      }}>Розрахувати</Button>
      <ResultBox>dn/dh: <span className="font-semibold text-ecalc-navy">{formatToolNumber(gradientResult, 12)}</span></ResultBox>
      <ResultBox>k-factor: <span className="font-semibold text-ecalc-navy">{formatToolNumber(kFromGradientResult, 3)}</span></ResultBox>
    </ToolCard>
  )
}

function NUnitsCard() {
  const [nState, setNState] = usePersistedState('radiohorizon.n', 320)
  const [refractiveIndexResult, setRefractiveIndexResult] = useState<number | null>(null)
  const [nUnitsResult, setNUnitsResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Activity className="h-4 w-4" />} title="N-units та n" description="Перевід між refractivity N і показником заломлення n.">
      <Field label="N-units"><Input type="number" step="1" value={nState} onChange={(e) => setNState(Number(e.target.value))} /></Field>
      <Button onClick={() => {
        setRefractiveIndexResult(refractiveIndex(nState))
        setNUnitsResult(nUnits(refractiveIndex(nState)))
      }}>Розрахувати</Button>
      <ResultBox>n: <span className="font-semibold text-ecalc-navy">{formatToolNumber(refractiveIndexResult, 6)}</span></ResultBox>
      <ResultBox>N back-check: <span className="font-semibold text-ecalc-navy">{formatToolNumber(nUnitsResult, 1)}</span></ResultBox>
    </ToolCard>
  )
}

function RayCurvatureCard() {
  const [curvatureState, setCurvatureState] = usePersistedState('radiohorizon.curvature', { dnDh: -40e-9, theta: 0 })
  const [curvatureResult, setCurvatureResult] = useState<number | null>(null)
  const [relativeCurvatureResult, setRelativeCurvatureResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Compass className="h-4 w-4" />} title="Кривизна променя" description="1/ρ через dn/dh і кут траєкторії променя.">
      <Field label="dn/dh"><Input type="number" step="0.000000001" value={curvatureState.dnDh} onChange={(e) => setCurvatureState((s) => ({ ...s, dnDh: Number(e.target.value) }))} /></Field>
      <Field label="θ, °"><Input type="number" step="0.1" value={curvatureState.theta} onChange={(e) => setCurvatureState((s) => ({ ...s, theta: Number(e.target.value) }))} /></Field>
      <Button onClick={() => {
        setCurvatureResult(rayCurvature(curvatureState.dnDh, curvatureState.theta))
        setRelativeCurvatureResult(relativeCurvature(curvatureState.dnDh))
      }}>Розрахувати</Button>
      <ResultBox>1/ρ: <span className="font-semibold text-ecalc-navy">{formatToolNumber(curvatureResult, 12)}</span></ResultBox>
      <ResultBox>ρ/R relation: <span className="font-semibold text-ecalc-navy">{formatToolNumber(relativeCurvatureResult, 3)}</span></ResultBox>
    </ToolCard>
  )
}

function RadioHorizonWithSurfaceCard() {
  const [surfaceState, setSurfaceState] = usePersistedState('radiohorizon.surface', { height: 500, surface: 120 })
  const [surfaceResult, setSurfaceResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Globe className="h-4 w-4" />} title="Горизонт над поверхнею" description="Радіогоризонт з урахуванням локального підйому поверхні.">
      <Field label="Висота платформи, м"><Input type="number" value={surfaceState.height} onChange={(e) => setSurfaceState((s) => ({ ...s, height: Number(e.target.value) }))} /></Field>
      <Field label="Висота поверхні, м"><Input type="number" value={surfaceState.surface} onChange={(e) => setSurfaceState((s) => ({ ...s, surface: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setSurfaceResult(radioHorizonWithSurface(surfaceState.height, surfaceState.surface))}>Розрахувати</Button>
      <ResultBox>Adjusted horizon: <span className="font-semibold text-ecalc-navy">{formatToolNumber(surfaceResult ? surfaceResult / 1000 : null, 2)} км</span></ResultBox>
    </ToolCard>
  )
}

function HorizonElevationAngleCard() {
  const [singleHeight, setSingleHeight] = usePersistedState('radiohorizon.singleheight', 120)
  const [angleResult, setAngleResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Gauge className="h-4 w-4" />} title="Кут місця горизонту" description="Кут зникнення прямої видимості для даної висоти.">
      <Field label="Висота, м"><Input type="number" value={singleHeight} onChange={(e) => setSingleHeight(Number(e.target.value))} /></Field>
      <Button onClick={() => setAngleResult(horizonElevationAngle(singleHeight))}>Розрахувати</Button>
      <ResultBox>Angle: <span className="font-semibold text-ecalc-navy">{formatToolNumber(angleResult ? (angleResult * 180) / Math.PI : null, 4)}°</span></ResultBox>
    </ToolCard>
  )
}

function DiffractionRangeCard() {
  const [diffractionState, setDiffractionState] = usePersistedState('radiohorizon.diffraction', { radioDistance: 45, freq: 5.8 })
  const [diffractionResult, setDiffractionResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Signal className="h-4 w-4" />} title="Дальність з дифракцією" description="Емпіричне розширення horizon за частотою сигналу.">
      <Field label="Radio horizon, км"><Input type="number" step="0.1" value={diffractionState.radioDistance} onChange={(e) => setDiffractionState((s) => ({ ...s, radioDistance: Number(e.target.value) }))} /></Field>
      <Field label="Частота, ГГц"><Input type="number" step="0.1" value={diffractionState.freq} onChange={(e) => setDiffractionState((s) => ({ ...s, freq: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setDiffractionResult(diffractionRange(diffractionState.radioDistance, diffractionState.freq))}>Розрахувати</Button>
      <ResultBox>Diffraction range: <span className="font-semibold text-ecalc-navy">{formatToolNumber(diffractionResult, 2)} км</span></ResultBox>
    </ToolCard>
  )
}

function FreeSpaceLossCard() {
  const [lossState, setLossState] = usePersistedState('radiohorizon.loss', { distance: 45, freq: 5800 })
  const [lossResult, setLossResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Signal className="h-4 w-4" />} title="Втрати у вільному просторі" description="Free-space path loss для відстані й частоти.">
      <Field label="Distance, км"><Input type="number" step="0.1" value={lossState.distance} onChange={(e) => setLossState((s) => ({ ...s, distance: Number(e.target.value) }))} /></Field>
      <Field label="Frequency, МГц"><Input type="number" step="1" value={lossState.freq} onChange={(e) => setLossState((s) => ({ ...s, freq: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setLossResult(freeSpaceLoss(lossState.distance, lossState.freq))}>Розрахувати</Button>
      <ResultBox>FSPL: <span className="font-semibold text-ecalc-navy">{formatToolNumber(lossResult, 2)} dB</span></ResultBox>
    </ToolCard>
  )
}

function AirGroundRangeCard() {
  const [airGroundState, setAirGroundState] = usePersistedState('radiohorizon.airground', { aircraft: 1200, ground: 12 })
  const [airGroundResult, setAirGroundResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<TowerControl className="h-4 w-4" />} title="Борт-земля" description="Практична дальність зв'язку aircraft to ground station.">
      <Field label="Висота борту, м"><Input type="number" value={airGroundState.aircraft} onChange={(e) => setAirGroundState((s) => ({ ...s, aircraft: Number(e.target.value) }))} /></Field>
      <Field label="Висота G/S, м"><Input type="number" value={airGroundState.ground} onChange={(e) => setAirGroundState((s) => ({ ...s, ground: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setAirGroundResult(airGroundRange(airGroundState.aircraft, airGroundState.ground))}>Розрахувати</Button>
      <ResultBox>Air-ground range: <span className="font-semibold text-ecalc-navy">{formatToolNumber(airGroundResult, 2)} км</span></ResultBox>
    </ToolCard>
  )
}

function AirToAirRangeCard() {
  const [airAirState, setAirAirState] = usePersistedState('radiohorizon.airair', { alt1: 1200, alt2: 2300 })
  const [airAirResult, setAirAirResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Radio className="h-4 w-4" />} title="Борт-борт" description="Дальність прямої видимості між двома повітряними суднами.">
      <Field label="Alt 1, м"><Input type="number" value={airAirState.alt1} onChange={(e) => setAirAirState((s) => ({ ...s, alt1: Number(e.target.value) }))} /></Field>
      <Field label="Alt 2, м"><Input type="number" value={airAirState.alt2} onChange={(e) => setAirAirState((s) => ({ ...s, alt2: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setAirAirResult(airToAirRange(airAirState.alt1, airAirState.alt2))}>Розрахувати</Button>
      <ResultBox>Air-air range: <span className="font-semibold text-ecalc-navy">{formatToolNumber(airAirResult, 2)} км</span></ResultBox>
    </ToolCard>
  )
}

function MinAltitudeForRangeCard() {
  const [minAltitudeState, setMinAltitudeState] = usePersistedState('radiohorizon.minalt', { distance: 95, ground: 15 })
  const [minAltitudeResult, setMinAltitudeResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Gauge className="h-4 w-4" />} title="Мінімальна висота для зв'язку" description="Необхідна висота платформи для заданої дальності до земної станції.">
      <Field label="Бажана дальність, км"><Input type="number" value={minAltitudeState.distance} onChange={(e) => setMinAltitudeState((s) => ({ ...s, distance: Number(e.target.value) }))} /></Field>
      <Field label="Висота G/S, м"><Input type="number" value={minAltitudeState.ground} onChange={(e) => setMinAltitudeState((s) => ({ ...s, ground: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setMinAltitudeResult(minAltitudeForRange(minAltitudeState.distance, minAltitudeState.ground))}>Розрахувати</Button>
      <ResultBox>Required altitude: <span className="font-semibold text-ecalc-navy">{formatToolNumber(minAltitudeResult, 0)} м</span></ResultBox>
    </ToolCard>
  )
}

function RadarMaxRangeCard() {
  const [radarState, setRadarState] = usePersistedState('radiohorizon.radar', { radar: 40, target: 1200 })
  const [radarResult, setRadarResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Radar className="h-4 w-4" />} title="Максимальна дальність РЛС" description="Горизонт радіолокаційного виявлення для радара і цілі.">
      <Field label="Radar altitude, м"><Input type="number" value={radarState.radar} onChange={(e) => setRadarState((s) => ({ ...s, radar: Number(e.target.value) }))} /></Field>
      <Field label="Target altitude, м"><Input type="number" value={radarState.target} onChange={(e) => setRadarState((s) => ({ ...s, target: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setRadarResult(radarMaxRange(radarState.radar, radarState.target))}>Розрахувати</Button>
      <ResultBox>Radar range: <span className="font-semibold text-ecalc-navy">{formatToolNumber(radarResult, 2)} км</span></ResultBox>
    </ToolCard>
  )
}

function RadarDetectionRangeCard() {
  const [detectionState, setDetectionState] = usePersistedState('radiohorizon.detection', { powerW: 100, gainDbi: 30, freqGhz: 9.5, rcsDm2: 0.01, lossDb: 3, snrDb: 13, tempK: 290, bwHz: 1e6 })
  const [detectionResult, setDetectionResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Signal className="h-4 w-4" />} title="Виявлення дрона радаром" description="Дальність виявлення за radar range equation. RCS малого дрона — 0.001–0.1 дм².">
      <Field label="Пікова потужність, Вт"><Input type="number" value={detectionState.powerW} onChange={(e) => setDetectionState((s) => ({ ...s, powerW: Number(e.target.value) }))} /></Field>
      <Field label="Підсилення антени, дБі"><Input type="number" value={detectionState.gainDbi} onChange={(e) => setDetectionState((s) => ({ ...s, gainDbi: Number(e.target.value) }))} /></Field>
      <Field label="Частота, ГГц"><Input type="number" step="0.1" value={detectionState.freqGhz} onChange={(e) => setDetectionState((s) => ({ ...s, freqGhz: Number(e.target.value) }))} /></Field>
      <Field label="RCS цілі, дм²" hint="Малий FPV дрон: ~0.01 дм²"><Input type="number" step="0.001" value={detectionState.rcsDm2} onChange={(e) => setDetectionState((s) => ({ ...s, rcsDm2: Number(e.target.value) }))} /></Field>
      <Field label="Системні втрати, дБ"><Input type="number" value={detectionState.lossDb} onChange={(e) => setDetectionState((s) => ({ ...s, lossDb: Number(e.target.value) }))} /></Field>
      <Field label="Мін. S/N, дБ"><Input type="number" value={detectionState.snrDb} onChange={(e) => setDetectionState((s) => ({ ...s, snrDb: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setDetectionResult(radarDetectionRange({ peakPowerW: detectionState.powerW, antennaGainDbi: detectionState.gainDbi, wavelengthM: 0.3 / detectionState.freqGhz, rcsDm2: detectionState.rcsDm2, systemLossDb: detectionState.lossDb, minSnrDb: detectionState.snrDb, tempK: detectionState.tempK, bandwidthHz: detectionState.bwHz }))}>Розрахувати</Button>
      <ResultBox copyValue={detectionResult !== null ? formatToolNumber(detectionResult, 2) : undefined}>
        Дальність: <span className="font-semibold text-ecalc-navy">{formatToolNumber(detectionResult, 2)} км</span>
      </ResultBox>
    </ToolCard>
  )
}

export function RadioHorizonSuite() {
  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle>Radio Horizon + Refraction Suite</CardTitle>
          <CardDescription>
            20 інструментів для оптичного горизонту, радіогоризонту, ефективного радіуса Землі, рефракції, трасових втрат і авіаційного RF planning.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-ecalc-orange/20 bg-ecalc-orange/5 px-4 py-3 text-sm text-ecalc-text">
            Модуль відокремлює геометрію прямої видимості від атмосферної рефракції. Для стандартної атмосфери використовується ефективний радіус Землі з k≈4/3, тому радіогоризонт перевищує оптичний.
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Інструментів</div><div className="mt-1 text-xl font-semibold text-ecalc-navy">20</div></div>
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Фокус</div><div className="mt-1 text-sm font-semibold text-ecalc-navy">Horizon, k-factor, RF LOS</div></div>
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Тип</div><div className="mt-1 text-sm font-semibold text-ecalc-navy">Radio planning</div></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <OpticalHorizonCard />
        <RadioHorizonFullCard />
        <RadioHorizonSimpleCard />
        <RadioHorizonFeetCard />
        <LinkRangeFullCard />
        <LinkRangeSimpleCard />
        <EffectiveEarthRadiusCard />
        <KFactorFromGradientCard />
        <NUnitsCard />
        <RayCurvatureCard />
        <RadioHorizonWithSurfaceCard />
        <HorizonElevationAngleCard />
        <DiffractionRangeCard />
        <FreeSpaceLossCard />
        <AirGroundRangeCard />
        <AirToAirRangeCard />
        <MinAltitudeForRangeCard />
        <RadarMaxRangeCard />
        <RadarDetectionRangeCard />
      </div>
    </section>
  )
}
