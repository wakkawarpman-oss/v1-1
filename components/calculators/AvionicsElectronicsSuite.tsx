'use client'

import { useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { Activity, Battery, Cable, Gauge, Radio, Shield, Thermometer, Timer, Waves, Zap } from 'lucide-react'
import {
  backupRuntime,
  calibrationTime,
  dutyCycle,
  electricalFrequency,
  escPowerLoss,
  filterCapacitance,
  freeSpaceRange,
  receiverSensitivity,
  tempRise,
  voltageDrop,
  escThermal,
} from '@/lib/avionics-electronics'
import { Field, formatToolNumber, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function EscPowerLossCard() {
  const [escState, setEscState] = usePersistedState('avionics.esc', { current: 42, rdsOn: 0.0025, mosfets: 12 })
  const [escResult, setEscResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Zap className="h-4 w-4" />} title="Втрати на ESC" description="P = I² × Rds(on) × N для оцінки теплового навантаження силового каскаду.">
      <Field label="Струм, A"><Input type="number" step="0.1" value={escState.current} onChange={(e) => setEscState((s) => ({ ...s, current: Number(e.target.value) }))} /></Field>
      <Field label="Rds(on), Ом"><Input type="number" step="0.0001" value={escState.rdsOn} onChange={(e) => setEscState((s) => ({ ...s, rdsOn: Number(e.target.value) }))} /></Field>
      <Field label="Кількість MOSFET"><Input type="number" value={escState.mosfets} onChange={(e) => setEscState((s) => ({ ...s, mosfets: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setEscResult(escPowerLoss(escState.current, escState.rdsOn, escState.mosfets))}>Розрахувати</Button>
      <ResultBox>Втрати ESC: <span className="font-semibold text-ecalc-navy">{formatToolNumber(escResult, 2)} W</span></ResultBox>
    </ToolCard>
  )
}

function BackupRuntimeCard() {
  const [backupState, setBackupState] = usePersistedState('avionics.backup', { capacity: 4.5, voltage: 24, load: 38 })
  const [backupResult, setBackupResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Battery className="h-4 w-4" />} title="Резервне живлення" description="Час роботи backup battery за енергією пакета й потужністю навантаження.">
      <Field label="Ємність, Ah"><Input type="number" step="0.1" value={backupState.capacity} onChange={(e) => setBackupState((s) => ({ ...s, capacity: Number(e.target.value) }))} /></Field>
      <Field label="Напруга, V"><Input type="number" step="0.1" value={backupState.voltage} onChange={(e) => setBackupState((s) => ({ ...s, voltage: Number(e.target.value) }))} /></Field>
      <Field label="Навантаження, W"><Input type="number" step="0.1" value={backupState.load} onChange={(e) => setBackupState((s) => ({ ...s, load: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setBackupResult(backupRuntime(backupState.capacity, backupState.voltage, backupState.load))}>Розрахувати</Button>
      <ResultBox>Автономність: <span className="font-semibold text-ecalc-navy">{formatToolNumber(backupResult, 2)} год</span></ResultBox>
    </ToolCard>
  )
}

function VoltageDropCard() {
  const [dropState, setDropState] = usePersistedState('avionics.drop', { current: 28, length: 1.6, area: 2.5 })
  const [dropResult, setDropResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Cable className="h-4 w-4" />} title="Падіння напруги в кабелі" description="Voltage drop у двопровідній лінії з мідного кабелю.">
      <Field label="Струм, A"><Input type="number" step="0.1" value={dropState.current} onChange={(e) => setDropState((s) => ({ ...s, current: Number(e.target.value) }))} /></Field>
      <Field label="Довжина тракту, м"><Input type="number" step="0.1" value={dropState.length} onChange={(e) => setDropState((s) => ({ ...s, length: Number(e.target.value) }))} /></Field>
      <Field label="Переріз, мм²"><Input type="number" step="0.1" value={dropState.area} onChange={(e) => setDropState((s) => ({ ...s, area: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setDropResult(voltageDrop(dropState.current, dropState.length, dropState.area))}>Розрахувати</Button>
      <ResultBox>Падіння напруги: <span className="font-semibold text-ecalc-navy">{formatToolNumber(dropResult, 3)} V</span></ResultBox>
    </ToolCard>
  )
}

function FilterCapacitanceCard() {
  const [capState, setCapState] = usePersistedState('avionics.cap', { current: 12, frequency: 24000, ripple: 0.25 })
  const [capResult, setCapResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Waves className="h-4 w-4" />} title="Мінімальна ємність фільтра" description="Оцінка C для придушення ripple у силовому каналі.">
      <Field label="Струм навантаження, A"><Input type="number" step="0.1" value={capState.current} onChange={(e) => setCapState((s) => ({ ...s, current: Number(e.target.value) }))} /></Field>
      <Field label="Частота перемикання, Гц"><Input type="number" value={capState.frequency} onChange={(e) => setCapState((s) => ({ ...s, frequency: Number(e.target.value) }))} /></Field>
      <Field label="Допустима пульсація, V"><Input type="number" step="0.01" value={capState.ripple} onChange={(e) => setCapState((s) => ({ ...s, ripple: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setCapResult(filterCapacitance(capState.current, capState.frequency, capState.ripple))}>Розрахувати</Button>
      <ResultBox>Cmin: <span className="font-semibold text-ecalc-navy">{formatToolNumber(capResult ? capResult * 1e6 : null, 0)} µF</span></ResultBox>
    </ToolCard>
  )
}

function ElectricalFrequencyCard() {
  const [freqState, setFreqState] = usePersistedState('avionics.freq', { rpm: 7200, polePairs: 7 })
  const [freqResult, setFreqResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Activity className="h-4 w-4" />} title="Електрична частота двигуна" description="f_el = RPM × pole pairs / 60 для ESC та комутації.">
      <Field label="RPM"><Input type="number" value={freqState.rpm} onChange={(e) => setFreqState((s) => ({ ...s, rpm: Number(e.target.value) }))} /></Field>
      <Field label="Кількість пар полюсів"><Input type="number" value={freqState.polePairs} onChange={(e) => setFreqState((s) => ({ ...s, polePairs: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setFreqResult(electricalFrequency(freqState.rpm, freqState.polePairs))}>Розрахувати</Button>
      <ResultBox>Electrical frequency: <span className="font-semibold text-ecalc-navy">{formatToolNumber(freqResult, 1)} Гц</span></ResultBox>
    </ToolCard>
  )
}

function ReceiverSensitivityCard() {
  const [sensitivityState, setSensitivityState] = usePersistedState('avionics.sensitivity', { temperature: 290, bandwidth: 250000, noiseFigure: 5 })
  const [sensitivityResult, setSensitivityResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Radio className="h-4 w-4" />} title="Чутливість приймача" description="Noise floor + NF для оцінки межі приймання каналу.">
      <Field label="Температура, K"><Input type="number" value={sensitivityState.temperature} onChange={(e) => setSensitivityState((s) => ({ ...s, temperature: Number(e.target.value) }))} /></Field>
      <Field label="Смуга, Гц"><Input type="number" value={sensitivityState.bandwidth} onChange={(e) => setSensitivityState((s) => ({ ...s, bandwidth: Number(e.target.value) }))} /></Field>
      <Field label="Noise figure, dB"><Input type="number" step="0.1" value={sensitivityState.noiseFigure} onChange={(e) => setSensitivityState((s) => ({ ...s, noiseFigure: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setSensitivityResult(receiverSensitivity(sensitivityState.temperature, sensitivityState.bandwidth, sensitivityState.noiseFigure))}>Розрахувати</Button>
      <ResultBox>Sensitivity: <span className="font-semibold text-ecalc-navy">{formatToolNumber(sensitivityResult, 2)} dBm</span></ResultBox>
    </ToolCard>
  )
}

function FreeSpaceRangeCard() {
  const [rangeState, setRangeState] = usePersistedState('avionics.range', { txPower: 30, txGain: 3, rxGain: 3, systemLoss: 2, rxSensitivity: -96, freqGhz: 2.4 })
  const [rangeResult, setRangeResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Radio className="h-4 w-4" />} title="Free-space range" description="Груба оцінка дальності радіолінії без multipath і атмосферних втрат.">
      <Field label="Ptx, dBm"><Input type="number" value={rangeState.txPower} onChange={(e) => setRangeState((s) => ({ ...s, txPower: Number(e.target.value) }))} /></Field>
      <Field label="Gtx, dBi"><Input type="number" step="0.1" value={rangeState.txGain} onChange={(e) => setRangeState((s) => ({ ...s, txGain: Number(e.target.value) }))} /></Field>
      <Field label="Grx, dBi"><Input type="number" step="0.1" value={rangeState.rxGain} onChange={(e) => setRangeState((s) => ({ ...s, rxGain: Number(e.target.value) }))} /></Field>
      <Field label="System loss, dB"><Input type="number" step="0.1" value={rangeState.systemLoss} onChange={(e) => setRangeState((s) => ({ ...s, systemLoss: Number(e.target.value) }))} /></Field>
      <Field label="Rx sensitivity, dBm"><Input type="number" step="0.1" value={rangeState.rxSensitivity} onChange={(e) => setRangeState((s) => ({ ...s, rxSensitivity: Number(e.target.value) }))} /></Field>
      <Field label="Частота, ГГц"><Input type="number" step="0.1" value={rangeState.freqGhz} onChange={(e) => setRangeState((s) => ({ ...s, freqGhz: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setRangeResult(freeSpaceRange(rangeState.txPower, rangeState.txGain, rangeState.rxGain, rangeState.systemLoss, rangeState.rxSensitivity, rangeState.freqGhz))}>Розрахувати</Button>
      <ResultBox>Дальність: <span className="font-semibold text-ecalc-navy">{formatToolNumber(rangeResult, 2)} км</span></ResultBox>
    </ToolCard>
  )
}

function DutyCycleCard() {
  const [dutyState, setDutyState] = usePersistedState('avionics.duty', { motorVoltage: 18, batteryVoltage: 25.2 })
  const [dutyResult, setDutyResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Gauge className="h-4 w-4" />} title="PWM duty cycle" description="Відношення еквівалентної напруги двигуна до напруги батареї.">
      <Field label="Vmotor, V"><Input type="number" step="0.1" value={dutyState.motorVoltage} onChange={(e) => setDutyState((s) => ({ ...s, motorVoltage: Number(e.target.value) }))} /></Field>
      <Field label="Vbat, V"><Input type="number" step="0.1" value={dutyState.batteryVoltage} onChange={(e) => setDutyState((s) => ({ ...s, batteryVoltage: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setDutyResult(dutyCycle(dutyState.motorVoltage, dutyState.batteryVoltage))}>Розрахувати</Button>
      <ResultBox>Duty cycle: <span className="font-semibold text-ecalc-navy">{formatToolNumber(dutyResult ? dutyResult * 100 : null, 1)}%</span></ResultBox>
    </ToolCard>
  )
}

function TempRiseCard() {
  const [thermalState, setThermalState] = usePersistedState('avionics.thermal', { powerLoss: 6.4, thermalResistance: 18 })
  const [thermalResult, setThermalResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Thermometer className="h-4 w-4" />} title="Перегрів компонента" description="ΔT = P_loss × RθJA для мікросхем, ESC і DC/DC модулів.">
      <Field label="Втрати, W"><Input type="number" step="0.1" value={thermalState.powerLoss} onChange={(e) => setThermalState((s) => ({ ...s, powerLoss: Number(e.target.value) }))} /></Field>
      <Field label="RθJA, °C/W"><Input type="number" step="0.1" value={thermalState.thermalResistance} onChange={(e) => setThermalState((s) => ({ ...s, thermalResistance: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setThermalResult(tempRise(thermalState.powerLoss, thermalState.thermalResistance))}>Розрахувати</Button>
      <ResultBox>ΔT: <span className="font-semibold text-ecalc-navy">{formatToolNumber(thermalResult, 1)} °C</span></ResultBox>
    </ToolCard>
  )
}

function CalibrationTimeCard() {
  const [calibrationState, setCalibrationState] = usePersistedState('avionics.calibration', { bandwidth: 40 })
  const [calibrationResult, setCalibrationResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Shield className="h-4 w-4" />} title="Час калібрування IMU" description="Груба оцінка тривалості стабілізації для гіроскопа або акселерометра.">
      <Field label="Bandwidth, Гц"><Input type="number" step="0.1" value={calibrationState.bandwidth} onChange={(e) => setCalibrationState({ bandwidth: Number(e.target.value) })} /></Field>
      <Button onClick={() => setCalibrationResult(calibrationTime(calibrationState.bandwidth))}>Розрахувати</Button>
      <ResultBox>Calibration time: <span className="font-semibold text-ecalc-navy">{formatToolNumber(calibrationResult, 3)} с</span></ResultBox>
    </ToolCard>
  )
}

function EscThermalCard() {
  const [escThermalState, setEscThermalState] = usePersistedState('avionics.escthermal2', {
    currentA: 40, rdsOnMOhm: 2.5, mosfetPairs: 1,
    switchingFreqKhz: 24, chargeNCoulombs: 12, voltageV: 22.2,
    thetaJaCPerW: 15, ambientC: 25,
  })
  const [escThermalResult, setEscThermalResult] = useState<ReturnType<typeof escThermal> | null>(null)
  return (
    <ToolCard icon={<Thermometer className="h-4 w-4" />} title="ESC / BLDC тепловий розрахунок" description="Втрати провідності (I²·Rds) і комутації (Qg·V·f) → температура p-n переходу MOSFET.">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Струм фази, А"><Input type="number" step="0.5" min="0.1" value={escThermalState.currentA} onChange={(e) => setEscThermalState((s) => ({ ...s, currentA: Number(e.target.value) }))} /></Field>
        <Field label="Rds(on), мОм"><Input type="number" step="0.1" min="0.1" value={escThermalState.rdsOnMOhm} onChange={(e) => setEscThermalState((s) => ({ ...s, rdsOnMOhm: Number(e.target.value) }))} /></Field>
        <Field label="Паралельних MOSFET на ключ" hint="1 = стандарт; 2+ = для ESC з паралельними транзисторами"><Input type="number" min={1} max={12} value={escThermalState.mosfetPairs} onChange={(e) => setEscThermalState((s) => ({ ...s, mosfetPairs: Number(e.target.value) }))} /></Field>
        <Field label="Частота комутації, кГц"><Input type="number" step="1" min="1" value={escThermalState.switchingFreqKhz} onChange={(e) => setEscThermalState((s) => ({ ...s, switchingFreqKhz: Number(e.target.value) }))} /></Field>
        <Field label="Заряд затвора Qg, нКл"><Input type="number" step="1" min="1" value={escThermalState.chargeNCoulombs} onChange={(e) => setEscThermalState((s) => ({ ...s, chargeNCoulombs: Number(e.target.value) }))} /></Field>
        <Field label="Напруга шини, В"><Input type="number" step="0.1" min="1" value={escThermalState.voltageV} onChange={(e) => setEscThermalState((s) => ({ ...s, voltageV: Number(e.target.value) }))} /></Field>
        <Field label="θJA, °C/Вт"><Input type="number" step="0.5" min="1" value={escThermalState.thetaJaCPerW} onChange={(e) => setEscThermalState((s) => ({ ...s, thetaJaCPerW: Number(e.target.value) }))} /></Field>
        <Field label="Температура середовища, °C"><Input type="number" step="1" value={escThermalState.ambientC} onChange={(e) => setEscThermalState((s) => ({ ...s, ambientC: Number(e.target.value) }))} /></Field>
      </div>
      <Button onClick={() => setEscThermalResult(escThermal(escThermalState))}>Розрахувати</Button>
      {escThermalResult && (
        <div className="space-y-1.5">
          <ResultBox>Провідн. втрати: <span className="font-semibold text-ecalc-navy">{formatToolNumber(escThermalResult.conductionW, 2)} Вт</span></ResultBox>
          <ResultBox>Комутац. втрати: <span className="font-semibold text-ecalc-navy">{formatToolNumber(escThermalResult.switchingW, 2)} Вт</span></ResultBox>
          <ResultBox>Сумарні втрати: <span className="font-semibold text-ecalc-navy">{formatToolNumber(escThermalResult.totalW, 2)} Вт</span></ResultBox>
          {!Number.isFinite(escThermalResult.junctionC) ? (
            <div className="rounded-xl border border-ecalc-border bg-white/5 px-3.5 py-2.5 text-sm text-ecalc-muted">
              Температура переходу: — (перевірте вхідні дані)
            </div>
          ) : (
            <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium ${escThermalResult.junctionC > 150 ? 'border-red-500/30 bg-red-500/10 text-red-400' : escThermalResult.junctionC > 120 ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green'}`}>
              Температура переходу: <strong>{formatToolNumber(escThermalResult.junctionC, 1)} °C</strong>
              {escThermalResult.junctionC > 150 && ' — ПЕРЕГРІВ, ризик виходу з ладу'}
              {escThermalResult.junctionC > 120 && escThermalResult.junctionC <= 150 && ' — обережно, близько до межі'}
              {escThermalResult.junctionC <= 120 && ' — норма'}
            </div>
          )}
        </div>
      )}
    </ToolCard>
  )
}

export function AvionicsElectronicsSuite() {
  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle>Avionics + Electronics Suite</CardTitle>
          <CardDescription>
            10 інструментів для ESC, живлення, проводки, датчиків, радіоканалу, теплових режимів і calibration-time у бортовій електроніці.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-ecalc-orange/20 bg-ecalc-orange/5 px-4 py-3 text-sm text-ecalc-text">
            Цей модуль закриває power budget, cable loss, PWM/electrical frequency, receiver sensitivity і thermal sanity-check для авіоніки та propulsion electronics.
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Інструментів</div><div className="mt-1 text-xl font-semibold text-ecalc-navy">10</div></div>
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Фокус</div><div className="mt-1 text-sm font-semibold text-ecalc-navy">Power, RF, thermals</div></div>
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Тип</div><div className="mt-1 text-sm font-semibold text-ecalc-navy">Avionics sanity-check</div></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <EscPowerLossCard />
        <BackupRuntimeCard />
        <VoltageDropCard />
        <FilterCapacitanceCard />
        <ElectricalFrequencyCard />
        <ReceiverSensitivityCard />
        <FreeSpaceRangeCard />
        <DutyCycleCard />
        <TempRiseCard />
        <CalibrationTimeCard />
        <EscThermalCard />
      </div>
    </section>
  )
}
