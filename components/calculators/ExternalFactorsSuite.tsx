'use client'

import { useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { Cloud, Compass, Gauge, Mountain, Radio, Snowflake, Sun, Thermometer, Wind, Zap } from 'lucide-react'
import { TelemetryForm } from '@/components/calculators/TelemetryForm'
import {
  airDensityMoist,
  cloudBaseHeight,
  densityAltitude,
  eddyDissipationRate,
  gpsSolarDelay,
  gustWindSpeed,
  icingRate,
  kpDescription,
  magneticDeclination,
  pblHeight,
  potentialTemperature,
  pressureAltitudeIsa,
  radioHorizon,
  radioRefractivity,
  rainAttenuation,
  richardsonNumber,
  solarIrradiance,
  soundSpeedHumidity,
  visibilityKm,
  vonKarmanSpectrum,
} from '@/lib/external-factors'
import { Field, formatToolNumber, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function GustWindCard() {
  const [gustState, setGustState] = usePersistedState('environment.gust', { meanWind: 10, sigma: 3 })
  const [gustResult, setGustResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Wind className="h-4 w-4" />} title="Вітер з поривами" description="Середній вітер плюс 1.5σ для gust estimate.">
      <Field label="Середній вітер, м/с"><Input type="number" step="0.1" value={gustState.meanWind} onChange={(e) => setGustState((s) => ({ ...s, meanWind: Number(e.target.value) }))} /></Field>
      <Field label="σ швидкості, м/с"><Input type="number" step="0.1" value={gustState.sigma} onChange={(e) => setGustState((s) => ({ ...s, sigma: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setGustResult(gustWindSpeed(gustState.meanWind, gustState.sigma))}>Розрахувати</Button>
      <ResultBox>Порив: <span className="font-semibold text-ecalc-navy">{formatToolNumber(gustResult, 1)} м/с</span></ResultBox>
    </ToolCard>
  )
}

function EdrCard() {
  const [edrState, setEdrState] = usePersistedState('environment.edr', { sigmaU: 1.8, sigmaV: 1.2, sigmaW: 0.9, lengthScaleM: 533 })
  const [edrResult, setEdrResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Cloud className="h-4 w-4" />} title="EDR / турбулентність" description="Eddy Dissipation Rate ε^(1/3) [m²/³s⁻¹] за Колмогоровим. Слабка < 0.1, помірна 0.1–0.3, сильна > 0.3.">
      <Field label="σu, м/с"><Input type="number" step="0.1" value={edrState.sigmaU} onChange={(e) => setEdrState((s) => ({ ...s, sigmaU: Number(e.target.value) }))} /></Field>
      <Field label="σv, м/с"><Input type="number" step="0.1" value={edrState.sigmaV} onChange={(e) => setEdrState((s) => ({ ...s, sigmaV: Number(e.target.value) }))} /></Field>
      <Field label="σw, м/с"><Input type="number" step="0.1" value={edrState.sigmaW} onChange={(e) => setEdrState((s) => ({ ...s, sigmaW: Number(e.target.value) }))} /></Field>
      <Field label="Масштаб довжини L, м" hint="ICAO/FAA стандарт: 533 м (низька висота)"><Input type="number" value={edrState.lengthScaleM} onChange={(e) => setEdrState((s) => ({ ...s, lengthScaleM: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setEdrResult(eddyDissipationRate(edrState.sigmaU, edrState.sigmaV, edrState.sigmaW, edrState.lengthScaleM))}>Розрахувати</Button>
      {edrResult !== null && <ResultBox copyValue={formatToolNumber(edrResult, 4)}>EDR ε^(1/3): <span className="font-semibold text-ecalc-navy">{formatToolNumber(edrResult, 4)} м²/³с⁻¹</span></ResultBox>}
    </ToolCard>
  )
}

function MagneticDeclinationCard() {
  const [declinationState, setDeclinationState] = usePersistedState('environment.declination', { lat: 50.45, lon: 30.52, year: 2026 })
  const [declinationResult, setDeclinationResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Compass className="h-4 w-4" />} title="Магнітне відхилення" description="Демонстраційна апроксимація declination для місця і року.">
      <Field label="Широта"><Input type="number" step="0.01" value={declinationState.lat} onChange={(e) => setDeclinationState((s) => ({ ...s, lat: Number(e.target.value) }))} /></Field>
      <Field label="Довгота"><Input type="number" step="0.01" value={declinationState.lon} onChange={(e) => setDeclinationState((s) => ({ ...s, lon: Number(e.target.value) }))} /></Field>
      <Field label="Рік"><Input type="number" value={declinationState.year} onChange={(e) => setDeclinationState((s) => ({ ...s, year: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setDeclinationResult(magneticDeclination(declinationState.lat, declinationState.lon, declinationState.year))}>Розрахувати</Button>
      <ResultBox>Declination: <span className="font-semibold text-ecalc-navy">{formatToolNumber(declinationResult, 2)}°</span></ResultBox>
    </ToolCard>
  )
}

function AirDensityMoistCard() {
  const [densityState, setDensityState] = usePersistedState('environment.density', { rhoDry: 1.18, humidity: 0.01 })
  const [densityResult, setDensityResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Cloud className="h-4 w-4" />} title="Щільність з вологістю" description="Корекція щільності повітря через питому вологість.">
      <Field label="Суха щільність, кг/м³"><Input type="number" step="0.001" value={densityState.rhoDry} onChange={(e) => setDensityState((s) => ({ ...s, rhoDry: Number(e.target.value) }))} /></Field>
      <Field label="Питома вологість q"><Input type="number" step="0.001" value={densityState.humidity} onChange={(e) => setDensityState((s) => ({ ...s, humidity: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setDensityResult(airDensityMoist(densityState.rhoDry, densityState.humidity))}>Розрахувати</Button>
      <ResultBox>Волога щільність: <span className="font-semibold text-ecalc-navy">{formatToolNumber(densityResult, 3)} кг/м³</span></ResultBox>
    </ToolCard>
  )
}

function PotentialTemperatureCard() {
  const [thetaState, setThetaState] = usePersistedState('environment.theta', { tempK: 288.15, pressure: 950 })
  const [thetaResult, setThetaResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Thermometer className="h-4 w-4" />} title="Потенційна температура" description="Θ = T × (1000/P)^0.286 для аналізу стабільності шару.">
      <Field label="T, K"><Input type="number" step="0.1" value={thetaState.tempK} onChange={(e) => setThetaState((s) => ({ ...s, tempK: Number(e.target.value) }))} /></Field>
      <Field label="P, hPa"><Input type="number" step="0.1" value={thetaState.pressure} onChange={(e) => setThetaState((s) => ({ ...s, pressure: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setThetaResult(potentialTemperature(thetaState.tempK, thetaState.pressure))}>Розрахувати</Button>
      <ResultBox>θ: <span className="font-semibold text-ecalc-navy">{formatToolNumber(thetaResult, 2)} K</span></ResultBox>
    </ToolCard>
  )
}

function CloudBaseHeightCard() {
  const [cloudState, setCloudState] = usePersistedState('environment.cloud', { temp: 18, dew: 12 })
  const [cloudResult, setCloudResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Cloud className="h-4 w-4" />} title="Висота бази хмар" description="Cloud base із різниці температури й точки роси.">
      <Field label="Температура, °C"><Input type="number" step="0.1" value={cloudState.temp} onChange={(e) => setCloudState((s) => ({ ...s, temp: Number(e.target.value) }))} /></Field>
      <Field label="Точка роси, °C"><Input type="number" step="0.1" value={cloudState.dew} onChange={(e) => setCloudState((s) => ({ ...s, dew: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setCloudResult(cloudBaseHeight(cloudState.temp, cloudState.dew))}>Розрахувати</Button>
      <ResultBox>Cloud base: <span className="font-semibold text-ecalc-navy">{formatToolNumber(cloudResult, 0)} м</span></ResultBox>
    </ToolCard>
  )
}

function VisibilityCard() {
  const [visibilityState, setVisibilityState] = usePersistedState('environment.visibility', { extinction: 0.35 })
  const [visibilityResult, setVisibilityResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Mountain className="h-4 w-4" />} title="Метеовидимість" description="Visibility через коефіцієнт ослаблення середовища.">
      <Field label="Коефіцієнт ослаблення, 1/км"><Input type="number" step="0.01" value={visibilityState.extinction} onChange={(e) => setVisibilityState({ extinction: Number(e.target.value) })} /></Field>
      <Button onClick={() => setVisibilityResult(visibilityKm(visibilityState.extinction))}>Розрахувати</Button>
      <ResultBox>Видимість: <span className="font-semibold text-ecalc-navy">{formatToolNumber(visibilityResult, 2)} км</span></ResultBox>
    </ToolCard>
  )
}

function RadioRefractivityCard() {
  const [refractivityState, setRefractivityState] = usePersistedState('environment.refractivity', { pressure: 1002, tempK: 293.15, vapor: 16 })
  const [refractivityResult, setRefractivityResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Radio className="h-4 w-4" />} title="Радіорефрактивність" description="N-units для оцінки тропосферної рефракції радіохвиль.">
      <Field label="Тиск, hPa"><Input type="number" step="0.1" value={refractivityState.pressure} onChange={(e) => setRefractivityState((s) => ({ ...s, pressure: Number(e.target.value) }))} /></Field>
      <Field label="Температура, K"><Input type="number" step="0.1" value={refractivityState.tempK} onChange={(e) => setRefractivityState((s) => ({ ...s, tempK: Number(e.target.value) }))} /></Field>
      <Field label="Тиск водяної пари, hPa"><Input type="number" step="0.1" value={refractivityState.vapor} onChange={(e) => setRefractivityState((s) => ({ ...s, vapor: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setRefractivityResult(radioRefractivity(refractivityState.pressure, refractivityState.tempK, refractivityState.vapor))}>Розрахувати</Button>
      <ResultBox>N: <span className="font-semibold text-ecalc-navy">{formatToolNumber(refractivityResult, 2)}</span></ResultBox>
    </ToolCard>
  )
}

function RainAttenuationCard() {
  const [rainState, setRainState] = usePersistedState('environment.rain', { rainRate: 12, distance: 8, freq: 5.8 })
  const [rainResult, setRainResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Cloud className="h-4 w-4" />} title="Втрати через дощ" description="Спрощена ITU-R attenuation model для радіолінії.">
      <Field label="Інтенсивність дощу, мм/год"><Input type="number" step="0.1" value={rainState.rainRate} onChange={(e) => setRainState((s) => ({ ...s, rainRate: Number(e.target.value) }))} /></Field>
      <Field label="Дистанція, км"><Input type="number" step="0.1" value={rainState.distance} onChange={(e) => setRainState((s) => ({ ...s, distance: Number(e.target.value) }))} /></Field>
      <Field label="Частота, ГГц"><Input type="number" step="0.1" value={rainState.freq} onChange={(e) => setRainState((s) => ({ ...s, freq: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setRainResult(rainAttenuation(rainState.rainRate, rainState.distance, rainState.freq))}>Розрахувати</Button>
      <ResultBox>Rain loss: <span className="font-semibold text-ecalc-navy">{formatToolNumber(rainResult, 2)} dB</span></ResultBox>
    </ToolCard>
  )
}

function GpsSolarDelayCard() {
  const [gpsState, setGpsState] = usePersistedState('environment.gps', { kp: 4 })
  const [gpsResult, setGpsResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Sun className="h-4 w-4" />} title="Сонячна затримка GPS" description="Оцінка росту GPS delay за Kp-index.">
      <Field label="Kp-index"><Input type="number" step="0.1" value={gpsState.kp} onChange={(e) => setGpsState({ kp: Number(e.target.value) })} /></Field>
      <Button onClick={() => setGpsResult(gpsSolarDelay(gpsState.kp))}>Розрахувати</Button>
      <ResultBox>Δτ: <span className="font-semibold text-ecalc-navy">{formatToolNumber(gpsResult, 2)} с</span></ResultBox>
      <ResultBox>Оцінка: <span className="font-semibold text-ecalc-navy">{kpDescription(gpsState.kp)}</span></ResultBox>
    </ToolCard>
  )
}

function DensityAltitudeCard() {
  const [densityAltitudeState, setDensityAltitudeState] = usePersistedState('environment.densityalt', { pressureAltitude: 1200, temp: 28, isaTemp: 15 })
  const [densityAltitudeResult, setDensityAltitudeResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Mountain className="h-4 w-4" />} title="Density Altitude" description="Наближена висота густини через pressure altitude та температуру.">
      <Field label="Pressure altitude, м"><Input type="number" step="1" value={densityAltitudeState.pressureAltitude} onChange={(e) => setDensityAltitudeState((s) => ({ ...s, pressureAltitude: Number(e.target.value) }))} /></Field>
      <Field label="Фактична T, °C"><Input type="number" step="0.1" value={densityAltitudeState.temp} onChange={(e) => setDensityAltitudeState((s) => ({ ...s, temp: Number(e.target.value) }))} /></Field>
      <Field label="ISA T, °C"><Input type="number" step="0.1" value={densityAltitudeState.isaTemp} onChange={(e) => setDensityAltitudeState((s) => ({ ...s, isaTemp: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setDensityAltitudeResult(densityAltitude(densityAltitudeState.pressureAltitude, densityAltitudeState.temp, densityAltitudeState.isaTemp))}>Розрахувати</Button>
      <ResultBox>DA: <span className="font-semibold text-ecalc-navy">{formatToolNumber(densityAltitudeResult, 0)} м</span></ResultBox>
    </ToolCard>
  )
}

function VonKarmanSpectrumCard() {
  const [spectrumState, setSpectrumState] = usePersistedState('environment.spectrum', { sigmaU: 1.8, lu: 120, waveNumber: 0.03 })
  const [spectrumResult, setSpectrumResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Wind className="h-4 w-4" />} title="Спектр фон Кармана" description="Спектральна щільність турбулентності на заданому хвильовому числі.">
      <Field label="σu"><Input type="number" step="0.1" value={spectrumState.sigmaU} onChange={(e) => setSpectrumState((s) => ({ ...s, sigmaU: Number(e.target.value) }))} /></Field>
      <Field label="Lu"><Input type="number" step="1" value={spectrumState.lu} onChange={(e) => setSpectrumState((s) => ({ ...s, lu: Number(e.target.value) }))} /></Field>
      <Field label="k"><Input type="number" step="0.001" value={spectrumState.waveNumber} onChange={(e) => setSpectrumState((s) => ({ ...s, waveNumber: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setSpectrumResult(vonKarmanSpectrum(spectrumState.sigmaU, spectrumState.lu, spectrumState.waveNumber))}>Розрахувати</Button>
      <ResultBox>Φu(k): <span className="font-semibold text-ecalc-navy">{formatToolNumber(spectrumResult, 4)}</span></ResultBox>
    </ToolCard>
  )
}

function SoundSpeedHumidityCard() {
  const [soundState, setSoundState] = usePersistedState('environment.sound', { temp: 20, humidity: 0.012 })
  const [soundResult, setSoundResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Thermometer className="h-4 w-4" />} title="Швидкість звуку з вологістю" description="Корекція sound speed через температуру й специфічну вологість.">
      <Field label="T, °C"><Input type="number" step="0.1" value={soundState.temp} onChange={(e) => setSoundState((s) => ({ ...s, temp: Number(e.target.value) }))} /></Field>
      <Field label="Specific humidity q"><Input type="number" step="0.001" value={soundState.humidity} onChange={(e) => setSoundState((s) => ({ ...s, humidity: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setSoundResult(soundSpeedHumidity(soundState.temp, soundState.humidity))}>Розрахувати</Button>
      <ResultBox>c: <span className="font-semibold text-ecalc-navy">{formatToolNumber(soundResult, 2)} м/с</span></ResultBox>
    </ToolCard>
  )
}

function RichardsonNumberCard() {
  const [riState, setRiState] = usePersistedState('environment.ri', { gravity: 9.81, thetaV: 292, deltaThetaV: 1.5, deltaZ: 60, deltaU: 4 })
  const [riResult, setRiResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Gauge className="h-4 w-4" />} title="Число Річардсона" description="Груба оцінка стійкості атмосфери за buoyancy та shear.">
      <Field label="g"><Input type="number" step="0.01" value={riState.gravity} onChange={(e) => setRiState((s) => ({ ...s, gravity: Number(e.target.value) }))} /></Field>
      <Field label="θv, K"><Input type="number" step="0.1" value={riState.thetaV} onChange={(e) => setRiState((s) => ({ ...s, thetaV: Number(e.target.value) }))} /></Field>
      <Field label="Δθv"><Input type="number" step="0.1" value={riState.deltaThetaV} onChange={(e) => setRiState((s) => ({ ...s, deltaThetaV: Number(e.target.value) }))} /></Field>
      <Field label="Δz, м"><Input type="number" step="0.1" value={riState.deltaZ} onChange={(e) => setRiState((s) => ({ ...s, deltaZ: Number(e.target.value) }))} /></Field>
      <Field label="ΔU, м/с"><Input type="number" step="0.1" value={riState.deltaU} onChange={(e) => setRiState((s) => ({ ...s, deltaU: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setRiResult(richardsonNumber(riState.gravity, riState.thetaV, riState.deltaThetaV, riState.deltaZ, riState.deltaU))}>Розрахувати</Button>
      <ResultBox>Ri: <span className="font-semibold text-ecalc-navy">{formatToolNumber(riResult, 3)}</span></ResultBox>
    </ToolCard>
  )
}

function PblHeightCard() {
  const [pblState, setPblState] = usePersistedState('environment.pbl', { ustar: 0.45, coriolis: 0.0001 })
  const [pblResult, setPblResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Mountain className="h-4 w-4" />} title="Висота PBL" description="Оцінка planetary boundary layer через u* і параметр Коріоліса.">
      <Field label="u*, м/с"><Input type="number" step="0.01" value={pblState.ustar} onChange={(e) => setPblState((s) => ({ ...s, ustar: Number(e.target.value) }))} /></Field>
      <Field label="f_c"><Input type="number" step="0.00001" value={pblState.coriolis} onChange={(e) => setPblState((s) => ({ ...s, coriolis: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setPblResult(pblHeight(pblState.ustar, pblState.coriolis))}>Розрахувати</Button>
      <ResultBox>PBL height: <span className="font-semibold text-ecalc-navy">{formatToolNumber(pblResult, 0)} м</span></ResultBox>
    </ToolCard>
  )
}

function IcingRateCard() {
  const [icingState, setIcingState] = usePersistedState('environment.icing', { lwc: 0.7, speed: 55, beta: 0.8 })
  const [icingResult, setIcingResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Snowflake className="h-4 w-4" />} title="Швидкість обмерзання" description="Проста оцінка icing rate за LWC, швидкістю і β.">
      <Field label="LWC, г/м³"><Input type="number" step="0.1" value={icingState.lwc} onChange={(e) => setIcingState((s) => ({ ...s, lwc: Number(e.target.value) }))} /></Field>
      <Field label="V, м/с"><Input type="number" step="0.1" value={icingState.speed} onChange={(e) => setIcingState((s) => ({ ...s, speed: Number(e.target.value) }))} /></Field>
      <Field label="β"><Input type="number" step="0.01" value={icingState.beta} onChange={(e) => setIcingState((s) => ({ ...s, beta: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setIcingResult(icingRate(icingState.lwc, icingState.speed, icingState.beta))}>Розрахувати</Button>
      <ResultBox>Icing rate: <span className="font-semibold text-ecalc-navy">{formatToolNumber(icingResult, 2)} мм/хв</span></ResultBox>
    </ToolCard>
  )
}

function SolarIrradianceCard() {
  const [solarState, setSolarState] = usePersistedState('environment.solar', { i0: 1361, tau: 0.75, airMass: 1.4, zenith: 35 })
  const [solarResult, setSolarResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Sun className="h-4 w-4" />} title="Сонячна радіація" description="I = I0 × τ^m × cos(θz) для оцінки solar load на висоті.">
      <Field label="I0, W/м²"><Input type="number" step="1" value={solarState.i0} onChange={(e) => setSolarState((s) => ({ ...s, i0: Number(e.target.value) }))} /></Field>
      <Field label="τ"><Input type="number" step="0.01" value={solarState.tau} onChange={(e) => setSolarState((s) => ({ ...s, tau: Number(e.target.value) }))} /></Field>
      <Field label="m"><Input type="number" step="0.1" value={solarState.airMass} onChange={(e) => setSolarState((s) => ({ ...s, airMass: Number(e.target.value) }))} /></Field>
      <Field label="θz, °"><Input type="number" step="0.1" value={solarState.zenith} onChange={(e) => setSolarState((s) => ({ ...s, zenith: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setSolarResult(solarIrradiance(solarState.i0, solarState.tau, solarState.airMass, solarState.zenith))}>Розрахувати</Button>
      <ResultBox>I_solar: <span className="font-semibold text-ecalc-navy">{formatToolNumber(solarResult, 1)} W/м²</span></ResultBox>
    </ToolCard>
  )
}

function PressureAltitudeIsaCard() {
  const [pressureState, setPressureState] = usePersistedState('environment.pressure', { pressure: 900 })
  const [pressureResult, setPressureResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Zap className="h-4 w-4" />} title="Pressure altitude (ISA)" description="ISA-перетворення тиску в еквівалентну висоту.">
      <Field label="Тиск, hPa"><Input type="number" step="0.1" value={pressureState.pressure} onChange={(e) => setPressureState({ pressure: Number(e.target.value) })} /></Field>
      <Button onClick={() => setPressureResult(pressureAltitudeIsa(pressureState.pressure))}>Розрахувати</Button>
      <ResultBox>Pressure altitude: <span className="font-semibold text-ecalc-navy">{formatToolNumber(pressureResult, 0)} м</span></ResultBox>
    </ToolCard>
  )
}

function RadioHorizonCard() {
  const [horizonState, setHorizonState] = usePersistedState('environment.horizon', { antenna: 25, nUnits: 320 })
  const [horizonResult, setHorizonResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Radio className="h-4 w-4" />} title="Ефективний радіогоризонт" description="Дальність зв'язку з поправкою на рефракцію атмосфери.">
      <Field label="Висота антени, м"><Input type="number" step="0.1" value={horizonState.antenna} onChange={(e) => setHorizonState((s) => ({ ...s, antenna: Number(e.target.value) }))} /></Field>
      <Field label="N-units"><Input type="number" step="1" value={horizonState.nUnits} onChange={(e) => setHorizonState((s) => ({ ...s, nUnits: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setHorizonResult(radioHorizon(horizonState.antenna, horizonState.nUnits))}>Розрахувати</Button>
      <ResultBox>Радіогоризонт: <span className="font-semibold text-ecalc-navy">{formatToolNumber(horizonResult, 2)} км</span></ResultBox>
    </ToolCard>
  )
}

export function ExternalFactorsSuite() {
  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle>External Factors Suite</CardTitle>
          <CardDescription>
            20 інструментів для метеоумов, щільності, турбулентності, обмерзання, радіотракту, магнітних ефектів і сонячної активності.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-ecalc-orange/20 bg-ecalc-orange/5 px-4 py-3 text-sm text-ecalc-text">
            Формули дають інженерні оцінки зовнішнього середовища для flight planning, RF sanity-check і оперативної оцінки ризиків. Магнітне відхилення тут лишається демонстраційною апроксимацією, не заміною WMM.
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Інструментів</div><div className="mt-1 text-xl font-semibold text-ecalc-navy">20</div></div>
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Фокус</div><div className="mt-1 text-sm font-semibold text-ecalc-navy">Weather, RF, atmosphere</div></div>
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Тип</div><div className="mt-1 text-sm font-semibold text-ecalc-navy">External conditions</div></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <GustWindCard />
        <EdrCard />
        <MagneticDeclinationCard />
        <AirDensityMoistCard />
        <PotentialTemperatureCard />
        <CloudBaseHeightCard />
        <VisibilityCard />
        <RadioRefractivityCard />
        <RainAttenuationCard />
        <GpsSolarDelayCard />
        <DensityAltitudeCard />
        <VonKarmanSpectrumCard />
        <SoundSpeedHumidityCard />
        <RichardsonNumberCard />
        <PblHeightCard />
        <IcingRateCard />
        <SolarIrradianceCard />
        <PressureAltitudeIsaCard />
        <RadioHorizonCard />
      </div>

      <TelemetryForm />
    </section>
  )
}
