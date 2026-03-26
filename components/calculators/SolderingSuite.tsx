'use client'

import { useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { Flame, Gauge, Heater, Layers3, Scaling, SlidersHorizontal, Thermometer, Waves, Wrench, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field, formatToolNumber, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import {
  apertureAreaRatio,
  apertureSize,
  heaterResistance,
  heaterResistanceFromCurrent,
  pidCoefficients,
  pwmFrequencyFromPeriod,
  pwmPeriodFromFrequency,
  reflowProfile,
  requiredPower,
  solderingHeatInput,
  solderPasteVolume,
  tipModelParams,
  type SolderPasteType,
  type SolderingTipModel,
} from '@/lib/soldering-tools'

function HeatInputCard() {
  const [heatState, setHeatState] = usePersistedState('solder.heat', { voltage: 24, current: 3, time: 2, speed: 50 })
  const [heatResult, setHeatResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Flame className="h-4 w-4" />} title="Тепловкладення паяльника" description="Оцінка переданої енергії на довжину шва або проходу.">
      <Field label="Напруга, В"><Input type="number" value={heatState.voltage} onChange={(e) => setHeatState((s) => ({ ...s, voltage: Number(e.target.value) }))} /></Field>
      <Field label="Струм, А"><Input type="number" step="0.1" value={heatState.current} onChange={(e) => setHeatState((s) => ({ ...s, current: Number(e.target.value) }))} /></Field>
      <Field label="Час контакту, с"><Input type="number" step="0.1" value={heatState.time} onChange={(e) => setHeatState((s) => ({ ...s, time: Number(e.target.value) }))} /></Field>
      <Field label="Швидкість, мм/хв"><Input type="number" value={heatState.speed} onChange={(e) => setHeatState((s) => ({ ...s, speed: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setHeatResult(solderingHeatInput(heatState.voltage, heatState.current, heatState.time, heatState.speed))}>Розрахувати</Button>
      <ResultBox>Heat input: <span className="font-semibold text-ecalc-navy">{formatToolNumber(heatResult, 3)} Дж/мм</span></ResultBox>
    </ToolCard>
  )
}

function RequiredPowerCard() {
  const [powerState, setPowerState] = usePersistedState('solder.power', { massG: 10, deltaT: 300, heatupTime: 10, specificHeat: 385 })
  const [powerResult, setPowerResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Thermometer className="h-4 w-4" />} title="Потужність паяльника" description="Мінімальна потужність для розігріву маси наконечника до робочої температури.">
      <Field label="Маса наконечника, г"><Input type="number" value={powerState.massG} onChange={(e) => setPowerState((s) => ({ ...s, massG: Number(e.target.value) }))} /></Field>
      <Field label="ΔT, K"><Input type="number" value={powerState.deltaT} onChange={(e) => setPowerState((s) => ({ ...s, deltaT: Number(e.target.value) }))} /></Field>
      <Field label="Час нагріву, с"><Input type="number" step="0.1" value={powerState.heatupTime} onChange={(e) => setPowerState((s) => ({ ...s, heatupTime: Number(e.target.value) }))} /></Field>
      <Field label="Питома теплоємність, Дж/(кг·K)" hint="385 для міді"><Input type="number" value={powerState.specificHeat} onChange={(e) => setPowerState((s) => ({ ...s, specificHeat: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setPowerResult(requiredPower(powerState.massG / 1000, powerState.deltaT, powerState.heatupTime, powerState.specificHeat))}>Розрахувати</Button>
      <ResultBox>Required power: <span className="font-semibold text-ecalc-navy">{formatToolNumber(powerResult, 1)} Вт</span></ResultBox>
    </ToolCard>
  )
}

function HeaterResistanceCard() {
  const [resistanceState, setResistanceState] = usePersistedState('solder.resistance', { voltage: 24, power: 72, current: 3 })
  const [resistanceResult, setResistanceResult] = useState<{ byPower: number; byCurrent: number } | null>(null)
  return (
    <ToolCard icon={<Heater className="h-4 w-4" />} title="Опір нагрівача" description="Перевірка нагрівального елемента за відомою потужністю або струмом.">
      <Field label="Напруга, В"><Input type="number" value={resistanceState.voltage} onChange={(e) => setResistanceState((s) => ({ ...s, voltage: Number(e.target.value) }))} /></Field>
      <Field label="Потужність, Вт"><Input type="number" value={resistanceState.power} onChange={(e) => setResistanceState((s) => ({ ...s, power: Number(e.target.value) }))} /></Field>
      <Field label="Струм, А"><Input type="number" step="0.1" value={resistanceState.current} onChange={(e) => setResistanceState((s) => ({ ...s, current: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setResistanceResult({ byPower: heaterResistance(resistanceState.voltage, resistanceState.power), byCurrent: heaterResistanceFromCurrent(resistanceState.voltage, resistanceState.current) })}>Розрахувати</Button>
      <ResultBox>R = U²/P: <span className="font-semibold text-ecalc-navy">{formatToolNumber(resistanceResult?.byPower, 2)} Ом</span></ResultBox>
      <ResultBox>R = U/I: <span className="font-semibold text-ecalc-navy">{formatToolNumber(resistanceResult?.byCurrent, 2)} Ом</span></ResultBox>
    </ToolCard>
  )
}

function PidCoefficientsCard() {
  const [pidState, setPidState] = usePersistedState('solder.pid', { ku: 1.5, tu: 2 })
  const [pidResult, setPidResult] = useState<{ Kp: number; Ki: number; Kd: number } | null>(null)
  return (
    <ToolCard icon={<SlidersHorizontal className="h-4 w-4" />} title="PID коефіцієнти" description="Стартові Kp, Ki, Kd за Ziegler-Nichols для термоконтролера.">
      <Field label="Ku"><Input type="number" step="0.01" value={pidState.ku} onChange={(e) => setPidState((s) => ({ ...s, ku: Number(e.target.value) }))} /></Field>
      <Field label="Tu, с"><Input type="number" step="0.01" value={pidState.tu} onChange={(e) => setPidState((s) => ({ ...s, tu: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setPidResult(pidCoefficients(pidState.ku, pidState.tu))}>Розрахувати</Button>
      <ResultBox>Kp: <span className="font-semibold text-ecalc-navy">{formatToolNumber(pidResult?.Kp, 3)}</span></ResultBox>
      <ResultBox>Ki: <span className="font-semibold text-ecalc-navy">{formatToolNumber(pidResult?.Ki, 3)}</span></ResultBox>
      <ResultBox>Kd: <span className="font-semibold text-ecalc-navy">{formatToolNumber(pidResult?.Kd, 3)}</span></ResultBox>
    </ToolCard>
  )
}

function TipModelCard() {
  const [tipModel, setTipModel] = usePersistedState<SolderingTipModel>('solder.tip', 'TS100_BC2')
  const [tipResult, setTipResult] = useState<{ gain: number; thermalMass: number; family: string } | null>(null)
  return (
    <ToolCard icon={<Wrench className="h-4 w-4" />} title="Конвертер наконечників" description="Типові параметри gain і thermal mass для популярних наконечників.">
      <Field label="Модель наконечника"><Select title="Модель наконечника" value={tipModel} onChange={(e) => setTipModel(e.target.value as SolderingTipModel)}><option value="TS100_BC2">TS100_BC2</option><option value="TS100_TSK">TS100_TSK</option><option value="T12_BC2">T12_BC2</option><option value="T12_ILS">T12_ILS</option><option value="C210">C210</option></Select></Field>
      <Button onClick={() => setTipResult(tipModelParams(tipModel))}>Підібрати</Button>
      <ResultBox>Family: <span className="font-semibold text-ecalc-navy">{tipResult?.family ?? '—'}</span></ResultBox>
      <ResultBox>Gain: <span className="font-semibold text-ecalc-navy">{formatToolNumber(tipResult?.gain, 2)}</span></ResultBox>
      <ResultBox>Thermal mass: <span className="font-semibold text-ecalc-navy">{formatToolNumber(tipResult?.thermalMass, 2)}</span></ResultBox>
    </ToolCard>
  )
}

function ReflowProfileCard() {
  const [pasteType, setPasteType] = usePersistedState<SolderPasteType>('solder.paste', 'SAC305')
  const [reflowResult, setReflowResult] = useState<{ preheat: number; soak: number; peak: number; cool: number } | null>(null)
  return (
    <ToolCard icon={<Gauge className="h-4 w-4" />} title="Профіль опікання" description="Типові температурні точки для lead-free і SnPb-паст.">
      <Field label="Тип пасти"><Select title="Тип пасти" value={pasteType} onChange={(e) => setPasteType(e.target.value as SolderPasteType)}><option value="SAC305">SAC305</option><option value="SnPb63">SnPb63</option><option value="lead_free">lead_free</option></Select></Field>
      <Button onClick={() => setReflowResult(reflowProfile(pasteType))}>Розрахувати</Button>
      <ResultBox>Preheat: <span className="font-semibold text-ecalc-navy">{formatToolNumber(reflowResult?.preheat, 0)} °C</span></ResultBox>
      <ResultBox>Soak: <span className="font-semibold text-ecalc-navy">{formatToolNumber(reflowResult?.soak, 0)} °C</span></ResultBox>
      <ResultBox>Peak: <span className="font-semibold text-ecalc-navy">{formatToolNumber(reflowResult?.peak, 0)} °C</span></ResultBox>
      <ResultBox>Cool-down target: <span className="font-semibold text-ecalc-navy">{formatToolNumber(reflowResult?.cool, 0)} °C</span></ResultBox>
    </ToolCard>
  )
}

function ApertureSizeCard() {
  const [apertureState, setApertureState] = usePersistedState('solder.aperture', { padWidth: 0.5, padLength: 1, pitch: 0.5 })
  const [apertureResult, setApertureResult] = useState<{ width: number; length: number; reduction: number } | null>(null)
  return (
    <ToolCard icon={<Scaling className="h-4 w-4" />} title="Розмір апертури" description="Рекомендоване зменшення апертури трафарету для fine-pitch монтажу.">
      <Field label="Ширина пада, мм"><Input type="number" step="0.01" value={apertureState.padWidth} onChange={(e) => setApertureState((s) => ({ ...s, padWidth: Number(e.target.value) }))} /></Field>
      <Field label="Довжина пада, мм"><Input type="number" step="0.01" value={apertureState.padLength} onChange={(e) => setApertureState((s) => ({ ...s, padLength: Number(e.target.value) }))} /></Field>
      <Field label="Pitch, мм"><Input type="number" step="0.01" value={apertureState.pitch} onChange={(e) => setApertureState((s) => ({ ...s, pitch: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setApertureResult(apertureSize(apertureState.padWidth, apertureState.padLength, apertureState.pitch))}>Розрахувати</Button>
      <ResultBox>Aperture: <span className="font-semibold text-ecalc-navy">{formatToolNumber(apertureResult?.width, 3)} × {formatToolNumber(apertureResult?.length, 3)} мм</span></ResultBox>
      <ResultBox>Reduction factor: <span className="font-semibold text-ecalc-navy">{formatToolNumber(apertureResult?.reduction, 2)}</span></ResultBox>
    </ToolCard>
  )
}

function ApertureAreaRatioCard() {
  const [ratioState, setRatioState] = usePersistedState('solder.ratio', { width: 0.4, length: 0.8, thickness: 0.12 })
  const [ratioResult, setRatioResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Layers3 className="h-4 w-4" />} title="Area ratio апертури" description="Перевірка release quality за IPC-подібним критерієм.">
      <Field label="Ширина апертури, мм"><Input type="number" step="0.01" value={ratioState.width} onChange={(e) => setRatioState((s) => ({ ...s, width: Number(e.target.value) }))} /></Field>
      <Field label="Довжина апертури, мм"><Input type="number" step="0.01" value={ratioState.length} onChange={(e) => setRatioState((s) => ({ ...s, length: Number(e.target.value) }))} /></Field>
      <Field label="Товщина трафарету, мм"><Input type="number" step="0.01" value={ratioState.thickness} onChange={(e) => setRatioState((s) => ({ ...s, thickness: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setRatioResult(apertureAreaRatio(ratioState.width, ratioState.length, ratioState.thickness))}>Розрахувати</Button>
      <ResultBox>Area ratio: <span className="font-semibold text-ecalc-navy">{formatToolNumber(ratioResult, 3)}</span></ResultBox>
      <ResultBox>Guideline: <span className="font-semibold text-ecalc-navy">&gt; 0.66</span></ResultBox>
    </ToolCard>
  )
}

function PasteVolumeCard() {
  const [pasteVolumeState, setPasteVolumeState] = usePersistedState('solder.volume', { area: 0.32, thickness: 0.12 })
  const [pasteVolumeResult, setPasteVolumeResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Waves className="h-4 w-4" />} title="Об'єм паяльної пасти" description="Оцінка об'єму пасти на один aperture або pad-group.">
      <Field label="Площа апертури, мм²"><Input type="number" step="0.001" value={pasteVolumeState.area} onChange={(e) => setPasteVolumeState((s) => ({ ...s, area: Number(e.target.value) }))} /></Field>
      <Field label="Товщина трафарету, мм"><Input type="number" step="0.01" value={pasteVolumeState.thickness} onChange={(e) => setPasteVolumeState((s) => ({ ...s, thickness: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setPasteVolumeResult(solderPasteVolume(pasteVolumeState.area, pasteVolumeState.thickness))}>Розрахувати</Button>
      <ResultBox>Paste volume: <span className="font-semibold text-ecalc-navy">{formatToolNumber(pasteVolumeResult, 3)} мм³</span></ResultBox>
    </ToolCard>
  )
}

function PwmSolderingCard() {
  const [pwmState, setPwmState] = usePersistedState('solder.pwm', { periodUs: 1000, freqHz: 1000 })
  const [pwmResult, setPwmResult] = useState<{ freq: number; period: number } | null>(null)
  return (
    <ToolCard icon={<Zap className="h-4 w-4" />} title="Частота ШІМ паяльника" description="Перетворення між періодом і частотою PWM для heater control.">
      <Field label="Період, мкс"><Input type="number" value={pwmState.periodUs} onChange={(e) => setPwmState((s) => ({ ...s, periodUs: Number(e.target.value) }))} /></Field>
      <Field label="Частота, Гц"><Input type="number" value={pwmState.freqHz} onChange={(e) => setPwmState((s) => ({ ...s, freqHz: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setPwmResult({ freq: pwmFrequencyFromPeriod(pwmState.periodUs), period: pwmPeriodFromFrequency(pwmState.freqHz) })}>Розрахувати</Button>
      <ResultBox>fPWM: <span className="font-semibold text-ecalc-navy">{formatToolNumber(pwmResult?.freq, 1)} Гц</span></ResultBox>
      <ResultBox>Period: <span className="font-semibold text-ecalc-navy">{formatToolNumber(pwmResult?.period, 1)} мкс</span></ResultBox>
    </ToolCard>
  )
}

export function SolderingSuite() {
  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle>Soldering Tools Suite</CardTitle>
          <CardDescription>
            10 інструментів для ручного паяння, PID-налаштування, reflow-профілю, stencil design і оцінки PWM-керування нагрівачем.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-ecalc-orange/20 bg-ecalc-orange/5 px-4 py-3 text-sm text-ecalc-text">
            Це інженерні наближення для пайки й reflow. Вони корисні для sanity-check, вибору режимів і первинного sizing, але не заміняють термопрофілювання реальної плати.
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Інструментів</div><div className="mt-1 text-xl font-semibold text-ecalc-navy">10</div></div>
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Фокус</div><div className="mt-1 text-sm font-semibold text-ecalc-navy">Soldering + reflow</div></div>
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Сценарій</div><div className="mt-1 text-sm font-semibold text-ecalc-navy">Bench process setup</div></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <HeatInputCard />
        <RequiredPowerCard />
        <HeaterResistanceCard />
        <PidCoefficientsCard />
        <TipModelCard />
        <ReflowProfileCard />
        <ApertureSizeCard />
        <ApertureAreaRatioCard />
        <PasteVolumeCard />
        <PwmSolderingCard />
      </div>
    </section>
  )
}
