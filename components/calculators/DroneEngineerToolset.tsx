'use client'

import { useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { Battery, Compass, Gauge, Layers3, Mountain, MoveDiagonal2, RefreshCw, Rocket, Ruler, Wind } from 'lucide-react'
import {
  Field,
  formatToolNumber,
  ResultBox,
  ToolCard,
} from '@/components/calculators/CalculatorToolPrimitives'
import {
  batteryC,
  batteryEnergyWh,
  convertUnit,
  densityAndThrustFactor,
  estimateChargeTimeMinutes,
  estimateFlightTimeMinutes,
  estimatePayloadKg,
  estimateRangeKm,
  estimateStaticThrustKg,
  frameDiagonalMm,
  imuVibration,
  isaAtAltitude,
  machFromTemperatureAndSpeed,
  motorKvToRpm,
  servoThrow,
  type ConverterUnit,
} from '@/lib/drone-tools'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function DroneEngineerToolset() {
  const [flight, setFlight] = usePersistedState('dronetools.flight', { cap: 4000, voltage: 22.2, current: 25, eff: 0.85 })
  const [flightMinutes, setFlightMinutes] = useState<number | null>(null)

  const [range, setRange] = usePersistedState('dronetools.range', { speed: 60, time: 25 })
  const [rangeKm, setRangeKm] = useState<number | null>(null)

  const [payload, setPayload] = usePersistedState('dronetools.payload', { thrust: 12, dryWeight: 3.5, margin: 25 })
  const [payloadKg, setPayloadKg] = useState<number | null>(null)

  const [density, setDensity] = usePersistedState('dronetools.density', { altitude: 0, temperature: 15 })
  const [densityResult, setDensityResult] = useState<{ rho: number; thrustFactor: number } | null>(null)

  const [windState, setWindState] = usePersistedState('dronetools.wind', { airspeed: 50, windspeed: 20, angleDeg: 45 })
  const [windResult, setWindResult] = useState<{ groundSpeed: number; driftDeg: number } | null>(null)

  const [isaAltitude, setIsaAltitude] = usePersistedState('dronetools.isaalt', 1000)
  const [isaResult, setIsaResult] = useState<{ pressure: number; density: number; temperature: number } | null>(null)

  const [machState, setMachState] = usePersistedState('dronetools.mach', { temperature: 20, speedKmh: 180 })
  const [machResult, setMachResult] = useState<{ soundMs: number; mach: number } | null>(null)

  const [thrustState, setThrustState] = usePersistedState('dronetools.thrust', { power: 800, efficiency: 0.7 })
  const [staticThrustKg, setStaticThrustKg] = useState<number | null>(null)

  const [chargeState, setChargeState] = usePersistedState('dronetools.charge', { capacity: 5000, current: 5 })
  const [chargeMinutes, setChargeMinutes] = useState<number | null>(null)

  const [converter, setConverter] = usePersistedState('dronetools.converter', { value: 1, from: 'kg' as ConverterUnit, to: 'lb' as ConverterUnit })
  const [convertedValue, setConvertedValue] = useState<number | null>(null)

  const [energyState, setEnergyState] = usePersistedState('dronetools.energy', { capacity: 4000, voltage: 22.2 })
  const [wattHours, setWattHours] = useState<number | null>(null)

  const [frameState, setFrameState] = usePersistedState('dronetools.frame', { x: 150, y: 150 })
  const [frameDiagonal, setFrameDiagonal] = useState<number | null>(null)

  const [kvState, setKvState] = usePersistedState('dronetools.kv', { kv: 2300, voltage: 14.8 })
  const [kvResult, setKvResult] = useState<{ noLoadRpm: number; loadRpm: number } | null>(null)

  const [servoState, setServoState] = usePersistedState('dronetools.servo', { armMm: 20, deflectionDeg: 25 })
  const [servoResult, setServoResult] = useState<{ throwMm: number } | null>(null)

  const [cState, setCState] = usePersistedState('dronetools.crate', { capacityMah: 5000, currentA: 40 })
  const [cResult, setCResult] = useState<{ cRate: number; maxSafeCurrentA: number } | null>(null)

  const [imuState, setImuState] = usePersistedState('dronetools.imu', { rpm: 20000, polePairs: 7, motorCount: 4, frameNaturalFreqHz: 200 })
  const [imuResult, setImuResult] = useState<ReturnType<typeof imuVibration> | null>(null)

  function calculateFlightTime() {
    setFlightMinutes(
      estimateFlightTimeMinutes({
        capacityMah: flight.cap,
        voltage: flight.voltage,
        currentA: flight.current,
        efficiency: flight.eff,
      }),
    )
  }

  function calculateRange() {
    setRangeKm(estimateRangeKm(range.speed, range.time))
  }

  function calculatePayload() {
    setPayloadKg(
      estimatePayloadKg({
        totalThrustKg: payload.thrust,
        dryWeightKg: payload.dryWeight,
        reservePercent: payload.margin,
      }),
    )
  }

  function calculateDensity() {
    const result = densityAndThrustFactor({
      altitudeM: density.altitude,
      temperatureC: density.temperature,
    })
    setDensityResult({ rho: result.densityKgM3, thrustFactor: result.thrustFactorPercent })
  }

  function calculateWind() {
    const angleRad = (windState.angleDeg * Math.PI) / 180
    const crosswind = windState.windspeed * Math.sin(angleRad)
    const headwind = windState.windspeed * Math.cos(angleRad)
    const inside = Math.max(0, windState.airspeed ** 2 - crosswind ** 2)
    const groundSpeed = Math.max(0, Math.sqrt(inside) + headwind)
    const driftDeg = Math.abs(crosswind) > windState.airspeed ? 90 : (Math.asin(crosswind / windState.airspeed) * 180) / Math.PI
    setWindResult({ groundSpeed, driftDeg })
  }

  function calculateIsa() {
    const result = isaAtAltitude(isaAltitude)
    setIsaResult({ pressure: result.pressureHpa, density: result.densityKgM3, temperature: result.temperatureC })
  }

  function calculateMach() {
    const result = machFromTemperatureAndSpeed({
      temperatureC: machState.temperature,
      speedKmh: machState.speedKmh,
    })
    setMachResult({ soundMs: result.soundSpeedMs, mach: result.mach })
  }

  function calculateStaticThrust() {
    setStaticThrustKg(estimateStaticThrustKg({ powerW: thrustState.power, efficiency: thrustState.efficiency }))
  }

  function calculateChargeTime() {
    setChargeMinutes(estimateChargeTimeMinutes(chargeState.capacity, chargeState.current))
  }

  function convertUnits() {
    setConvertedValue(convertUnit(converter.value, converter.from, converter.to))
  }

  function calculateWh() {
    setWattHours(batteryEnergyWh(energyState.capacity, energyState.voltage))
  }

  function calculateKv() {
    setKvResult(motorKvToRpm({ kv: kvState.kv, voltage: kvState.voltage }))
  }

  function calculateServo() {
    const r = servoThrow({ armRadiusMm: servoState.armMm, deflectionDeg: servoState.deflectionDeg })
    setServoResult({ throwMm: r.throwMm })
  }

  function calculateCRate() {
    setCResult(batteryC({ capacityMah: cState.capacityMah, currentA: cState.currentA }))
  }

  function calculateImu() {
    setImuResult(imuVibration(imuState))
  }

  function calculateFrameDiagonal() {
    setFrameDiagonal(frameDiagonalMm(frameState.x, frameState.y))
  }

  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle>Drone Engineer Toolset</CardTitle>
          <CardDescription>
            Швидкі польові інструменти для мультикоптерів, FPV, літаків і промислових БПЛА. Усі обчислення локальні, без сервера.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-ecalc-orange/20 bg-ecalc-orange/5 px-4 py-3 text-sm text-ecalc-text">
            Грубі польові оцінки для швидких рішень. Для густини використовується стандартний тиск на висоті та введена фактична температура, а тяга, дальність і заряджання залишаються спрощеними інженерними наближеннями.
          </div>
          <div className="grid gap-4 md:grid-cols-3">
          <div className="metric-tile">
            <div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Інструментів</div>
            <div className="mt-1 text-xl font-semibold text-ecalc-navy">13</div>
          </div>
          <div className="metric-tile">
            <div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Сценарій</div>
            <div className="mt-1 text-sm font-semibold text-ecalc-navy">Швидкі польові розрахунки</div>
          </div>
          <div className="metric-tile">
            <div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Режим</div>
            <div className="mt-1 text-sm font-semibold text-ecalc-navy">Локально, без API</div>
          </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <ToolCard icon={<Battery className="h-4 w-4" />} title="Час польоту" description="Оцінка тривалості польоту за ємністю, напругою, струмом і ККД.">
          <Field label="Ємність батареї, mAh"><Input type="number" value={flight.cap} onChange={(e) => setFlight((current) => ({ ...current, cap: Number(e.target.value) }))} /></Field>
          <Field label="Напруга, V"><Input type="number" step="0.1" value={flight.voltage} onChange={(e) => setFlight((current) => ({ ...current, voltage: Number(e.target.value) }))} /></Field>
          <Field label="Середній струм, A"><Input type="number" step="0.1" value={flight.current} onChange={(e) => setFlight((current) => ({ ...current, current: Number(e.target.value) }))} /></Field>
          <Field label="ККД системи, 0..1"><Input type="number" step="0.01" value={flight.eff} onChange={(e) => setFlight((current) => ({ ...current, eff: Number(e.target.value) }))} /></Field>
          <Button onClick={calculateFlightTime}>Розрахувати</Button>
          <ResultBox>Час польоту: <span className="font-semibold text-ecalc-navy">{formatToolNumber(flightMinutes, 1)} хв</span></ResultBox>
        </ToolCard>

        <ToolCard icon={<Compass className="h-4 w-4" />} title="Максимальна дальність" description="Груба оцінка дальності за швидкістю і часом польоту.">
          <Field label="Швидкість, км/год"><Input type="number" value={range.speed} onChange={(e) => setRange((current) => ({ ...current, speed: Number(e.target.value) }))} /></Field>
          <Field label="Час польоту, хв"><Input type="number" value={range.time} onChange={(e) => setRange((current) => ({ ...current, time: Number(e.target.value) }))} /></Field>
          <Button onClick={calculateRange}>Розрахувати</Button>
          <ResultBox>Дальність: <span className="font-semibold text-ecalc-navy">{formatToolNumber(rangeKm, 1)} км</span></ResultBox>
        </ToolCard>

        <ToolCard icon={<Layers3 className="h-4 w-4" />} title="Корисне навантаження" description="Скільки додаткової ваги можна підняти з заданим запасом тяги.">
          <Field label="Загальна статична тяга, кг"><Input type="number" step="0.1" value={payload.thrust} onChange={(e) => setPayload((current) => ({ ...current, thrust: Number(e.target.value) }))} /></Field>
          <Field label="Вага дрона без навантаження, кг"><Input type="number" step="0.1" value={payload.dryWeight} onChange={(e) => setPayload((current) => ({ ...current, dryWeight: Number(e.target.value) }))} /></Field>
          <Field label="Запас тяги, %"><Input type="number" value={payload.margin} onChange={(e) => setPayload((current) => ({ ...current, margin: Number(e.target.value) }))} /></Field>
          <Button onClick={calculatePayload}>Розрахувати</Button>
          <ResultBox>Додаткове навантаження: <span className="font-semibold text-ecalc-navy">{formatToolNumber(payloadKg, 2)} кг</span></ResultBox>
        </ToolCard>

        <ToolCard icon={<Mountain className="h-4 w-4" />} title="Щільність повітря" description="Густина атмосфери й відносна втрата тяги щодо рівня моря.">
          <Field label="Висота, м"><Input type="number" value={density.altitude} onChange={(e) => setDensity((current) => ({ ...current, altitude: Number(e.target.value) }))} /></Field>
          <Field label="Температура, °C"><Input type="number" value={density.temperature} onChange={(e) => setDensity((current) => ({ ...current, temperature: Number(e.target.value) }))} /></Field>
          <Button onClick={calculateDensity}>Розрахувати</Button>
          <ResultBox>Щільність: <span className="font-semibold text-ecalc-navy">{formatToolNumber(densityResult?.rho, 3)} кг/м³</span></ResultBox>
          <ResultBox>Ефективна тяга: <span className="font-semibold text-ecalc-navy">{formatToolNumber(densityResult?.thrustFactor, 1)}%</span> від рівня моря</ResultBox>
        </ToolCard>

        <ToolCard icon={<Wind className="h-4 w-4" />} title="Вітровий трикутник" description="Шляхова швидкість і кут зносу з урахуванням вітру.">
          <Field label="Швидкість дрона, км/год"><Input type="number" value={windState.airspeed} onChange={(e) => setWindState((current) => ({ ...current, airspeed: Number(e.target.value) }))} /></Field>
          <Field label="Швидкість вітру, км/год"><Input type="number" value={windState.windspeed} onChange={(e) => setWindState((current) => ({ ...current, windspeed: Number(e.target.value) }))} /></Field>
          <Field label="Кут вітру до курсу, °"><Input type="number" value={windState.angleDeg} onChange={(e) => setWindState((current) => ({ ...current, angleDeg: Number(e.target.value) }))} /></Field>
          <Button onClick={calculateWind}>Розрахувати</Button>
          <ResultBox>Шляхова швидкість: <span className="font-semibold text-ecalc-navy">{formatToolNumber(windResult?.groundSpeed, 1)} км/год</span></ResultBox>
          <ResultBox>Кут зносу: <span className="font-semibold text-ecalc-navy">{formatToolNumber(windResult?.driftDeg, 1)}°</span></ResultBox>
        </ToolCard>

        <ToolCard icon={<Gauge className="h-4 w-4" />} title="Атмосфера ISA" description="Стандартна атмосфера: тиск, густина і температура для заданої висоти.">
          <Field label="Висота, м"><Input type="number" value={isaAltitude} onChange={(e) => setIsaAltitude(Number(e.target.value))} /></Field>
          <Button onClick={calculateIsa}>Розрахувати</Button>
          <ResultBox>Тиск: <span className="font-semibold text-ecalc-navy">{formatToolNumber(isaResult?.pressure, 1)} гПа</span></ResultBox>
          <ResultBox>Щільність: <span className="font-semibold text-ecalc-navy">{formatToolNumber(isaResult?.density, 3)} кг/м³</span></ResultBox>
          <ResultBox>Температура: <span className="font-semibold text-ecalc-navy">{formatToolNumber(isaResult?.temperature, 1)} °C</span></ResultBox>
        </ToolCard>

        <ToolCard icon={<Rocket className="h-4 w-4" />} title="Швидкість звуку / Мах" description="Корисно для швидкісних платформ і гвинтів з високою окружною швидкістю.">
          <Field label="Температура повітря, °C"><Input type="number" value={machState.temperature} onChange={(e) => setMachState((current) => ({ ...current, temperature: Number(e.target.value) }))} /></Field>
          <Field label="Швидкість дрона, км/год"><Input type="number" value={machState.speedKmh} onChange={(e) => setMachState((current) => ({ ...current, speedKmh: Number(e.target.value) }))} /></Field>
          <Button onClick={calculateMach}>Розрахувати</Button>
          <ResultBox>Швидкість звуку: <span className="font-semibold text-ecalc-navy">{formatToolNumber(machResult?.soundMs, 1)} м/с</span></ResultBox>
          <ResultBox>Число Маха: <span className="font-semibold text-ecalc-navy">{formatToolNumber(machResult?.mach, 3)}</span></ResultBox>
        </ToolCard>

        <ToolCard icon={<RefreshCw className="h-4 w-4" />} title="Оцінка тяги пропелера" description="Груба статична оцінка тяги за потужністю і ККД пропелера.">
          <Field label="Потужність двигуна, W"><Input type="number" value={thrustState.power} onChange={(e) => setThrustState((current) => ({ ...current, power: Number(e.target.value) }))} /></Field>
          <Field label="ККД пропелера, 0.5..0.8"><Input type="number" step="0.01" value={thrustState.efficiency} onChange={(e) => setThrustState((current) => ({ ...current, efficiency: Number(e.target.value) }))} /></Field>
          <Button onClick={calculateStaticThrust}>Розрахувати</Button>
          <ResultBox>Орієнтовна тяга: <span className="font-semibold text-ecalc-navy">{formatToolNumber(staticThrustKg, 2)} кг</span></ResultBox>
        </ToolCard>

        <ToolCard icon={<Battery className="h-4 w-4" />} title="LiPo заряджання" description="Приблизний час заряду за ємністю акумулятора і струмом зарядки.">
          <Field label="Ємність, mAh"><Input type="number" value={chargeState.capacity} onChange={(e) => setChargeState((current) => ({ ...current, capacity: Number(e.target.value) }))} /></Field>
          <Field label="Струм заряду, A"><Input type="number" step="0.1" value={chargeState.current} onChange={(e) => setChargeState((current) => ({ ...current, current: Number(e.target.value) }))} /></Field>
          <Button onClick={calculateChargeTime}>Розрахувати</Button>
          <ResultBox>Час заряду: <span className="font-semibold text-ecalc-navy">{formatToolNumber(chargeMinutes, 1)} хв</span></ResultBox>
        </ToolCard>

        <ToolCard icon={<Ruler className="h-4 w-4" />} title="Конвертер одиниць" description="Кілограми, фунти, км/год, м/с, метри і фути.">
          <Field label="Значення"><Input type="number" step="0.001" value={converter.value} onChange={(e) => setConverter((current) => ({ ...current, value: Number(e.target.value) }))} /></Field>
          <Field label="З"><Select title="З сві" value={converter.from} onChange={(e) => setConverter((current) => ({ ...current, from: e.target.value as ConverterUnit }))}><option value="kg">кг</option><option value="lb">фунти</option><option value="kmh">км/год</option><option value="ms">м/с</option><option value="m">метри</option><option value="ft">фути</option></Select></Field>
          <Field label="У"><Select title="У сві" value={converter.to} onChange={(e) => setConverter((current) => ({ ...current, to: e.target.value as ConverterUnit }))}><option value="kg">кг</option><option value="lb">фунти</option><option value="kmh">км/год</option><option value="ms">м/с</option><option value="m">метри</option><option value="ft">фути</option></Select></Field>
          <Button onClick={convertUnits}>Конвертувати</Button>
          <ResultBox>Результат: <span className="font-semibold text-ecalc-navy">{formatToolNumber(convertedValue, 3)}</span> {converter.to}</ResultBox>
        </ToolCard>

        <ToolCard icon={<Battery className="h-4 w-4" />} title="Енергія батареї" description="Ват-години для оцінки запасу енергії та порівняння акумуляторів.">
          <Field label="Ємність, mAh"><Input type="number" value={energyState.capacity} onChange={(e) => setEnergyState((current) => ({ ...current, capacity: Number(e.target.value) }))} /></Field>
          <Field label="Напруга, V"><Input type="number" step="0.1" value={energyState.voltage} onChange={(e) => setEnergyState((current) => ({ ...current, voltage: Number(e.target.value) }))} /></Field>
          <Button onClick={calculateWh}>Розрахувати</Button>
          <ResultBox>Ват-години: <span className="font-semibold text-ecalc-navy">{formatToolNumber(wattHours, 1)} Wh</span></ResultBox>
        </ToolCard>

        <ToolCard icon={<MoveDiagonal2 className="h-4 w-4" />} title="Діагональ рами" description="Діагональ між моторами для швидкої оцінки сумісності рами й пропелерів.">
          <Field label="Відстань X, мм"><Input type="number" value={frameState.x} onChange={(e) => setFrameState((current) => ({ ...current, x: Number(e.target.value) }))} /></Field>
          <Field label="Відстань Y, мм"><Input type="number" value={frameState.y} onChange={(e) => setFrameState((current) => ({ ...current, y: Number(e.target.value) }))} /></Field>
          <Button onClick={calculateFrameDiagonal}>Розрахувати</Button>
          <ResultBox>Діагональ рами: <span className="font-semibold text-ecalc-navy">{formatToolNumber(frameDiagonal, 1)} мм</span></ResultBox>
        </ToolCard>

        <ToolCard icon={<RefreshCw className="h-4 w-4" />} title="Мотор KV → RPM" description="Оберти без навантаження та під навантаженням за KV мотора і напругою батареї.">
          <Field label="KV мотора"><Input type="number" min="1" value={kvState.kv} onChange={(e) => setKvState((c) => ({ ...c, kv: Number(e.target.value) }))} /></Field>
          <Field label="Напруга, В"><Input type="number" step="0.1" min="0.1" value={kvState.voltage} onChange={(e) => setKvState((c) => ({ ...c, voltage: Number(e.target.value) }))} /></Field>
          <Button onClick={calculateKv}>Розрахувати</Button>
          <ResultBox>
            Без навантаження: <span className="font-semibold text-ecalc-navy">{formatToolNumber(kvResult?.noLoadRpm, 0)} RPM</span>
            {kvResult && <span className="ml-3 text-ecalc-muted">Під навантаженням: {formatToolNumber(kvResult.loadRpm, 0)} RPM</span>}
          </ResultBox>
        </ToolCard>

        <ToolCard icon={<Ruler className="h-4 w-4" />} title="Хід серво" description="Хід штовхача за радіусом плеча серво та кутом відхилення рулів.">
          <Field label="Радіус плеча, мм"><Input type="number" min="1" value={servoState.armMm} onChange={(e) => setServoState((c) => ({ ...c, armMm: Number(e.target.value) }))} /></Field>
          <Field label="Відхилення, °"><Input type="number" min="1" max="90" value={servoState.deflectionDeg} onChange={(e) => setServoState((c) => ({ ...c, deflectionDeg: Number(e.target.value) }))} /></Field>
          <Button onClick={calculateServo}>Розрахувати</Button>
          <ResultBox>Хід штовхача: <span className="font-semibold text-ecalc-navy">{formatToolNumber(servoResult?.throwMm, 1)} мм</span></ResultBox>
        </ToolCard>

        <ToolCard icon={<Gauge className="h-4 w-4" />} title="C-rate акумулятора" description="Розрядний С-рейт і максимально допустимий струм для LiPo.">
          <Field label="Ємність, mAh"><Input type="number" min="1" value={cState.capacityMah} onChange={(e) => setCState((c) => ({ ...c, capacityMah: Number(e.target.value) }))} /></Field>
          <Field label="Струм розряду, A"><Input type="number" step="0.1" min="0" value={cState.currentA} onChange={(e) => setCState((c) => ({ ...c, currentA: Number(e.target.value) }))} /></Field>
          <Button onClick={calculateCRate}>Розрахувати</Button>
          <ResultBox>
            C-rate: <span className="font-semibold text-ecalc-navy">{formatToolNumber(cResult?.cRate, 1)} C</span>
            {cResult && <span className="ml-3 text-ecalc-muted">Макс. безпечний струм: {formatToolNumber(cResult.maxSafeCurrentA, 0)} A</span>}
          </ResultBox>
        </ToolCard>

        <ToolCard icon={<Gauge className="h-4 w-4" />} title="Аналіз вібрацій IMU / рами" description="Механічна та вібраційна частота від моторів, ризик резонансу з природною частотою рами.">
          <Field label="Оберти, RPM"><Input type="number" min="1" value={imuState.rpm} onChange={(e) => setImuState((c) => ({ ...c, rpm: Number(e.target.value) }))} /></Field>
          <Field label="Пар полюсів мотора" hint="14-полюсний = 7 пар">
            <Input type="number" min="1" value={imuState.polePairs} onChange={(e) => setImuState((c) => ({ ...c, polePairs: Number(e.target.value) }))} />
          </Field>
          <Field label="Кількість моторів"><Input type="number" min="1" value={imuState.motorCount} onChange={(e) => setImuState((c) => ({ ...c, motorCount: Number(e.target.value) }))} /></Field>
          <Field label="Власна частота рами, Гц" hint="Вуглець 100–300 Гц, типово ~200 Гц">
            <Input type="number" min="10" value={imuState.frameNaturalFreqHz} onChange={(e) => setImuState((c) => ({ ...c, frameNaturalFreqHz: Number(e.target.value) }))} />
          </Field>
          <Button onClick={calculateImu}>Розрахувати</Button>
          {imuResult && (
            <>
              <ResultBox>
                Мех. частота: <span className="font-semibold text-ecalc-navy">{formatToolNumber(imuResult.mechanicalHz, 1)} Гц</span>
                <span className="ml-3 text-ecalc-muted">Ел.: {formatToolNumber(imuResult.electricalHz, 1)} Гц</span>
              </ResultBox>
              <ResultBox>
                Вібраційна: <span className="font-semibold text-ecalc-navy">{formatToolNumber(imuResult.vibrationHz, 1)} Гц</span>
              </ResultBox>
              {!Number.isFinite(imuResult.vibrationHz) ? (
                <div className="rounded-xl border border-ecalc-border bg-white/5 px-3.5 py-2.5 text-sm text-ecalc-muted">
                  Ризик резонансу: — (перевірте вхідні дані)
                </div>
              ) : (
                <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${imuResult.resonanceRisk === 'ok' ? 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green' : imuResult.resonanceRisk === 'caution' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                  {imuResult.note}
                </div>
              )}
            </>
          )}
        </ToolCard>
      </div>
    </section>
  )
}