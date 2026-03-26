'use client'

import { useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { Activity, AudioWaveform, Gauge, Radio, Repeat, SlidersHorizontal, Wifi, Zap } from 'lucide-react'
import {
  bandDesignation,
  dopplerShift,
  frequencyConvert,
  lcResonance,
  pwmFrequency,
  pwmPeriod,
  propellerSoundFreq,
  rcCutoff,
  shannonCapacity,
  wifiChannelFreq24GHz,
  wavelengthFromFreq,
  type FrequencyUnit,
  freqFromWavelength,
  intermodulation,
} from '@/lib/frequency-tools'
import { Field, formatToolNumber, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

function FrequencyToWavelengthCard() {
  const [freqHz, setFreqHz] = usePersistedState('frequency.freqhz', 2400e6)
  const [wavelengthResult, setWavelengthResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Radio className="h-4 w-4" />} title="Частота → довжина хвилі" description="Розрахунок λ для заданої частоти сигналу.">
      <Field label="Частота, Гц"><Input type="number" value={freqHz} onChange={(e) => setFreqHz(Number(e.target.value))} /></Field>
      <Button onClick={() => setWavelengthResult(wavelengthFromFreq(freqHz))}>Розрахувати</Button>
      <ResultBox>λ: <span className="font-semibold text-ecalc-navy">{formatToolNumber(wavelengthResult, 4)} м</span></ResultBox>
      <ResultBox>Band: <span className="font-semibold text-ecalc-navy">{bandDesignation(freqHz)}</span></ResultBox>
    </ToolCard>
  )
}

function WavelengthToFrequencyCard() {
  const [wavelengthState, setWavelengthState] = usePersistedState('frequency.wavelength', 0.125)
  const [freqFromLambdaResult, setFreqFromLambdaResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Radio className="h-4 w-4" />} title="Довжина хвилі → частота" description="Обернене перетворення з λ у f.">
      <Field label="λ, м"><Input type="number" step="0.0001" value={wavelengthState} onChange={(e) => setWavelengthState(Number(e.target.value))} /></Field>
      <Button onClick={() => setFreqFromLambdaResult(freqFromWavelength(wavelengthState))}>Розрахувати</Button>
      <ResultBox>f: <span className="font-semibold text-ecalc-navy">{formatToolNumber((freqFromLambdaResult ?? 0) / 1e6, 3)} МГц</span></ResultBox>
    </ToolCard>
  )
}

function FrequencyConverterCard() {
  const [convertState, setConvertState] = usePersistedState('frequency.convert', { value: 100, from: 'MHz' as FrequencyUnit, to: 'GHz' as FrequencyUnit })
  const [convertResult, setConvertResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Repeat className="h-4 w-4" />} title="Конвертер частот" description="Hz, kHz, MHz, GHz, THz між собою.">
      <Field label="Значення"><Input type="number" value={convertState.value} onChange={(e) => setConvertState((s) => ({ ...s, value: Number(e.target.value) }))} /></Field>
      <Field label="З"><Select title="З одиниці" value={convertState.from} onChange={(e) => setConvertState((s) => ({ ...s, from: e.target.value as FrequencyUnit }))}><option value="Hz">Hz</option><option value="kHz">kHz</option><option value="MHz">MHz</option><option value="GHz">GHz</option><option value="THz">THz</option></Select></Field>
      <Field label="У"><Select title="У одиниці" value={convertState.to} onChange={(e) => setConvertState((s) => ({ ...s, to: e.target.value as FrequencyUnit }))}><option value="Hz">Hz</option><option value="kHz">kHz</option><option value="MHz">MHz</option><option value="GHz">GHz</option><option value="THz">THz</option></Select></Field>
      <Button onClick={() => setConvertResult(frequencyConvert(convertState.value, convertState.from, convertState.to))}>Конвертувати</Button>
      <ResultBox>Result: <span className="font-semibold text-ecalc-navy">{formatToolNumber(convertResult, 6)} {convertState.to}</span></ResultBox>
    </ToolCard>
  )
}

function WifiChannelCard() {
  const [wifiChannel, setWifiChannel] = usePersistedState('frequency.wifichannel', 6)
  const [wifiResult, setWifiResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Wifi className="h-4 w-4" />} title="Wi-Fi канал 2.4 ГГц" description="Центральна частота для каналу 1-14.">
      <Field label="Канал"><Input type="number" value={wifiChannel} onChange={(e) => setWifiChannel(Number(e.target.value))} /></Field>
      <Button onClick={() => setWifiResult(wifiChannelFreq24GHz(wifiChannel))}>Розрахувати</Button>
      <ResultBox>Center freq: <span className="font-semibold text-ecalc-navy">{formatToolNumber(wifiResult, 0)} МГц</span></ResultBox>
    </ToolCard>
  )
}

function PropellerSoundFreqCard() {
  const [propState, setPropState] = usePersistedState('frequency.prop', { rpm: 6000, blades: 2 })
  const [propResult, setPropResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<AudioWaveform className="h-4 w-4" />} title="Частота тону пропелера" description="Blade pass frequency для шуму та резонансу.">
      <Field label="RPM"><Input type="number" value={propState.rpm} onChange={(e) => setPropState((s) => ({ ...s, rpm: Number(e.target.value) }))} /></Field>
      <Field label="Лопаті"><Input type="number" value={propState.blades} onChange={(e) => setPropState((s) => ({ ...s, blades: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setPropResult(propellerSoundFreq(propState.rpm, propState.blades))}>Розрахувати</Button>
      <ResultBox>Sound frequency: <span className="font-semibold text-ecalc-navy">{formatToolNumber(propResult, 1)} Гц</span></ResultBox>
    </ToolCard>
  )
}

function PwmCard() {
  const [pwmState, setPwmState] = usePersistedState('frequency.pwm', { period: 0.00005, frequency: 20000 })
  const [pwmFreqResult, setPwmFreqResult] = useState<number | null>(null)
  const [pwmPeriodResult, setPwmPeriodResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<SlidersHorizontal className="h-4 w-4" />} title="PWM частота і період" description="Взаємне перетворення між періодом імпульсу і частотою PWM.">
      <Field label="Період, с"><Input type="number" step="0.000001" value={pwmState.period} onChange={(e) => setPwmState((s) => ({ ...s, period: Number(e.target.value) }))} /></Field>
      <Field label="Частота, Гц"><Input type="number" value={pwmState.frequency} onChange={(e) => setPwmState((s) => ({ ...s, frequency: Number(e.target.value) }))} /></Field>
      <Button onClick={() => {
        setPwmFreqResult(pwmFrequency(pwmState.period))
        setPwmPeriodResult(pwmPeriod(pwmState.frequency))
      }}>Розрахувати</Button>
      <ResultBox>fPWM: <span className="font-semibold text-ecalc-navy">{formatToolNumber(pwmFreqResult, 1)} Гц</span></ResultBox>
      <ResultBox>Period: <span className="font-semibold text-ecalc-navy">{formatToolNumber(pwmPeriodResult, 7)} с</span></ResultBox>
    </ToolCard>
  )
}

function DopplerShiftCard() {
  const [dopplerState, setDopplerState] = usePersistedState('frequency.doppler', { f0: 2400e6, speed: 50 })
  const [dopplerResult, setDopplerResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Activity className="h-4 w-4" />} title="Доплерівський зсув" description="Δf для заданої відносної швидкості між джерелом та приймачем.">
      <Field label="f0, Гц"><Input type="number" value={dopplerState.f0} onChange={(e) => setDopplerState((s) => ({ ...s, f0: Number(e.target.value) }))} /></Field>
      <Field label="Vrel, м/с"><Input type="number" step="0.1" value={dopplerState.speed} onChange={(e) => setDopplerState((s) => ({ ...s, speed: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setDopplerResult(dopplerShift(dopplerState.f0, dopplerState.speed))}>Розрахувати</Button>
      <ResultBox>Δf: <span className="font-semibold text-ecalc-navy">{formatToolNumber(dopplerResult, 3)} Гц</span></ResultBox>
    </ToolCard>
  )
}

function LcResonanceCard() {
  const [lcState, setLcState] = usePersistedState('frequency.lc', { inductance: 1e-6, capacitance: 1e-12 })
  const [lcResult, setLcResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Zap className="h-4 w-4" />} title="LC-резонанс" description="Резонансна частота LC-контуру для фільтрів та matching.">
      <Field label="L, H"><Input type="number" step="0.0000001" value={lcState.inductance} onChange={(e) => setLcState((s) => ({ ...s, inductance: Number(e.target.value) }))} /></Field>
      <Field label="C, F"><Input type="number" step="0.000000000001" value={lcState.capacitance} onChange={(e) => setLcState((s) => ({ ...s, capacitance: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setLcResult(lcResonance(lcState.inductance, lcState.capacitance))}>Розрахувати</Button>
      <ResultBox>fres: <span className="font-semibold text-ecalc-navy">{formatToolNumber((lcResult ?? 0) / 1e6, 3)} МГц</span></ResultBox>
    </ToolCard>
  )
}

function RcCutoffCard() {
  const [rcState, setRcState] = usePersistedState('frequency.rc', { resistance: 1000, capacitance: 10e-6 })
  const [rcResult, setRcResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Gauge className="h-4 w-4" />} title="RC cutoff" description="Частота зрізу RC-фільтра для сигналу чи живлення.">
      <Field label="R, Ω"><Input type="number" value={rcState.resistance} onChange={(e) => setRcState((s) => ({ ...s, resistance: Number(e.target.value) }))} /></Field>
      <Field label="C, F"><Input type="number" step="0.000001" value={rcState.capacitance} onChange={(e) => setRcState((s) => ({ ...s, capacitance: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setRcResult(rcCutoff(rcState.resistance, rcState.capacitance))}>Розрахувати</Button>
      <ResultBox>fc: <span className="font-semibold text-ecalc-navy">{formatToolNumber(rcResult, 1)} Гц</span></ResultBox>
    </ToolCard>
  )
}

function ShannonCapacityCard() {
  const [shannonState, setShannonState] = usePersistedState('frequency.shannon', { bandwidth: 20e6, snr: 10 })
  const [shannonResult, setShannonResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Wifi className="h-4 w-4" />} title="Shannon capacity" description="Максимальна теоретична швидкість каналу за смугою і SNR.">
      <Field label="Bandwidth, Hz"><Input type="number" value={shannonState.bandwidth} onChange={(e) => setShannonState((s) => ({ ...s, bandwidth: Number(e.target.value) }))} /></Field>
      <Field label="SNR, linear"><Input type="number" step="0.1" value={shannonState.snr} onChange={(e) => setShannonState((s) => ({ ...s, snr: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setShannonResult(shannonCapacity(shannonState.bandwidth, shannonState.snr))}>Розрахувати</Button>
      <ResultBox>Capacity: <span className="font-semibold text-ecalc-navy">{formatToolNumber((shannonResult ?? 0) / 1e6, 2)} Мбіт/с</span></ResultBox>
    </ToolCard>
  )
}

function IntermodulationCard() {
  const [imdState, setImdState] = usePersistedState('frequency.imd', { f1: 2400e6, f2: 2410e6, m: 2, n: 1 })
  const [imdResult, setImdResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Repeat className="h-4 w-4" />} title="Інтермодуляція" description="Продукти нелінійного змішування між двома частотами.">
      <Field label="f1, Hz"><Input type="number" value={imdState.f1} onChange={(e) => setImdState((s) => ({ ...s, f1: Number(e.target.value) }))} /></Field>
      <Field label="f2, Hz"><Input type="number" value={imdState.f2} onChange={(e) => setImdState((s) => ({ ...s, f2: Number(e.target.value) }))} /></Field>
      <Field label="m"><Input type="number" value={imdState.m} onChange={(e) => setImdState((s) => ({ ...s, m: Number(e.target.value) }))} /></Field>
      <Field label="n"><Input type="number" value={imdState.n} onChange={(e) => setImdState((s) => ({ ...s, n: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setImdResult(intermodulation(imdState.f1, imdState.f2, { m: imdState.m, n: imdState.n }))}>Розрахувати</Button>
      <ResultBox>IMD product: <span className="font-semibold text-ecalc-navy">{formatToolNumber((imdResult ?? 0) / 1e6, 3)} МГц</span></ResultBox>
    </ToolCard>
  )
}

export function FrequencyToolsSuite() {
  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle>Frequency Tools Suite</CardTitle>
          <CardDescription>
            10 інструментів для хвиль, радіоканалів, пропелерного тону, PWM, фільтрів, Shannon-capacity та інтермодуляції.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-ecalc-orange/20 bg-ecalc-orange/5 px-4 py-3 text-sm text-ecalc-text">
            Модуль закриває базові частотні оцінки для RF, телеметрії, відеолінку, електроніки ESC і шумових характеристик силової установки.
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Інструментів</div><div className="mt-1 text-xl font-semibold text-ecalc-navy">10</div></div>
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Фокус</div><div className="mt-1 text-sm font-semibold text-ecalc-navy">RF + signal chains</div></div>
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Тип</div><div className="mt-1 text-sm font-semibold text-ecalc-navy">Frequency sanity-check</div></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <FrequencyToWavelengthCard />
        <WavelengthToFrequencyCard />
        <FrequencyConverterCard />
        <WifiChannelCard />
        <PropellerSoundFreqCard />
        <PwmCard />
        <DopplerShiftCard />
        <LcResonanceCard />
        <RcCutoffCard />
        <ShannonCapacityCard />
        <IntermodulationCard />
      </div>
    </section>
  )
}
