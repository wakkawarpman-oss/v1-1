export type ConverterUnit = 'kg' | 'lb' | 'kmh' | 'ms' | 'm' | 'ft'

const SEA_LEVEL_DENSITY = 1.225
const SEA_LEVEL_TEMPERATURE_K = 288.15
const SEA_LEVEL_PRESSURE_PA = 101325
const LAPSE_RATE = 0.0065
const GRAVITY = 9.80665
const GAS_CONSTANT = 287.05

function standardPressureAtAltitude(altitudeM: number) {
  return SEA_LEVEL_PRESSURE_PA * Math.pow(1 - (LAPSE_RATE * altitudeM) / SEA_LEVEL_TEMPERATURE_K, GRAVITY / (GAS_CONSTANT * LAPSE_RATE))
}

export function estimateFlightTimeMinutes(params: {
  capacityMah: number
  voltage: number
  currentA: number
  efficiency: number
}) {
  if (params.currentA <= 0 || params.voltage <= 0 || params.capacityMah <= 0) return 0
  const energyWh = (params.capacityMah / 1000) * params.voltage
  const powerW = params.currentA * params.voltage
  return ((energyWh * params.efficiency) / powerW) * 60
}

export function estimateRangeKm(speedKmh: number, timeMinutes: number) {
  if (speedKmh < 0 || timeMinutes < 0) return 0
  return (speedKmh * timeMinutes) / 60
}

export function estimatePayloadKg(params: {
  totalThrustKg: number
  dryWeightKg: number
  reservePercent: number
}) {
  const availableThrustKg = params.totalThrustKg * (1 - params.reservePercent / 100)
  return Math.max(0, availableThrustKg - params.dryWeightKg)
}

export function densityAndThrustFactor(params: {
  altitudeM: number
  temperatureC: number
}) {
  const pressure = standardPressureAtAltitude(params.altitudeM)
  const temperatureK = params.temperatureC + 273.15
  const densityKgM3 = pressure / (GAS_CONSTANT * temperatureK)

  return {
    densityKgM3,
    thrustFactorPercent: (densityKgM3 / SEA_LEVEL_DENSITY) * 100,
  }
}

export function isaAtAltitude(altitudeM: number) {
  const temperatureK = SEA_LEVEL_TEMPERATURE_K - LAPSE_RATE * altitudeM
  const pressurePa = standardPressureAtAltitude(altitudeM)
  const densityKgM3 = pressurePa / (GAS_CONSTANT * temperatureK)

  return {
    pressureHpa: pressurePa / 100,
    densityKgM3,
    temperatureC: temperatureK - 273.15,
  }
}

export function machFromTemperatureAndSpeed(params: {
  temperatureC: number
  speedKmh: number
}) {
  const speedMs = params.speedKmh / 3.6
  if (params.temperatureC < -273.15) return { soundSpeedMs: 0, mach: 0 }
  const soundSpeedMs = 331.3 * Math.sqrt(1 + params.temperatureC / 273.15)

  return {
    soundSpeedMs,
    mach: speedMs / soundSpeedMs,
  }
}

export function estimateStaticThrustKg(params: {
  powerW: number
  efficiency: number
}) {
  return Math.max(0, (params.powerW * params.efficiency) / (9.81 * 10))
}

export function estimateChargeTimeMinutes(capacityMah: number, currentA: number) {
  if (currentA <= 0 || capacityMah <= 0) return 0
  return ((capacityMah / 1000) / currentA) * 60
}

export function convertUnit(value: number, from: ConverterUnit, to: ConverterUnit) {
  if (from === to) return value
  if (from === 'kg' && to === 'lb') return value * 2.20462
  if (from === 'lb' && to === 'kg') return value / 2.20462
  if (from === 'kmh' && to === 'ms') return value / 3.6
  if (from === 'ms' && to === 'kmh') return value * 3.6
  if (from === 'm' && to === 'ft') return value * 3.28084
  if (from === 'ft' && to === 'm') return value / 3.28084
  return value
}

export function batteryEnergyWh(capacityMah: number, voltage: number) {
  if (capacityMah <= 0 || voltage <= 0) return 0
  return (capacityMah / 1000) * voltage
}

export function frameDiagonalMm(xMm: number, yMm: number) {
  return Math.hypot(xMm, yMm)
}

// ── Propeller Tip Speed & Mach ────────────────────────────────────────────────
// V_tip = (RPM / 60) × π × D_m  [m/s]
// Sound speed depends on temperature: c = 331.3 × sqrt(1 + T°C / 273.15)
export type TipSpeedResult = {
  tipSpeedMs: number
  mach: number
  soundSpeedMs: number
  warning: 'ok' | 'caution' | 'danger'  // <0.80 ok, 0.80-0.90 caution, ≥0.90 danger
}

export function propTipSpeed(params: {
  diameterIn: number
  rpm: number
  temperatureC?: number
}): TipSpeedResult {
  const { diameterIn, rpm, temperatureC = 20 } = params
  if (diameterIn <= 0 || rpm <= 0) {
    return { tipSpeedMs: 0, mach: 0, soundSpeedMs: 343, warning: 'ok' }
  }
  const diameterM = diameterIn * 0.0254
  const tipSpeedMs = (rpm / 60) * Math.PI * diameterM
  const soundSpeedMs = 331.3 * Math.sqrt(1 + temperatureC / 273.15)
  const mach = tipSpeedMs / soundSpeedMs
  let warning: TipSpeedResult['warning']
  if (mach >= 0.9) {
    warning = 'danger'
  } else if (mach >= 0.8) {
    warning = 'caution'
  } else {
    warning = 'ok'
  }
  return { tipSpeedMs, mach, soundSpeedMs, warning }
}

// Max safe KV to keep tip speed below Mach 0.85 for given battery cells and prop diameter.
// Derived from: (KV × S × 4.2 × efficiency / 60) × π × D_m ≤ 0.85 × c
export function maxKvForMach(params: {
  diameterIn: number
  sCells: number
  chargedVoltagePer?: number  // default 4.2 V
  loadEfficiency?: number     // RPM fraction under load, default 0.85
  machLimit?: number          // default 0.85
  temperatureC?: number
}): number {
  const {
    diameterIn, sCells,
    chargedVoltagePer = 4.2,
    loadEfficiency = 0.85,
    machLimit = 0.85,
    temperatureC = 20,
  } = params
  if (diameterIn <= 0 || sCells <= 0) return 0
  const diameterM = diameterIn * 0.0254
  const soundSpeedMs = 331.3 * Math.sqrt(1 + temperatureC / 273.15)
  // max RPM = (machLimit × c) / (π × D) × 60
  const maxRpm = (machLimit * soundSpeedMs * 60) / (Math.PI * diameterM)
  // KV = RPM / (V × efficiency)
  return maxRpm / (sCells * chargedVoltagePer * loadEfficiency)
}

// ── Motor KV → RPM ────────────────────────────────────────────────────────────
// No-load RPM = KV × voltage; under-load RPM ≈ no-load × efficiency (0.80-0.90)
export function motorKvToRpm(params: {
  kv: number
  voltage: number
  loadEfficiency?: number  // default 1.0 (no-load)
}): { noLoadRpm: number; loadRpm: number } {
  const { kv, voltage, loadEfficiency = 0.87 } = params
  const noLoadRpm = kv * voltage
  return { noLoadRpm, loadRpm: noLoadRpm * loadEfficiency }
}

// ── Servo Throw ───────────────────────────────────────────────────────────────
// Given servo arm radius and desired control surface deflection,
// calculate required linkage throw (arc chord length).
export function servoThrow(params: {
  armRadiusMm: number
  deflectionDeg: number
}): { throwMm: number; radians: number } {
  const { armRadiusMm, deflectionDeg } = params
  const radians = (deflectionDeg * Math.PI) / 180
  const throwMm = 2 * armRadiusMm * Math.sin(radians / 2)
  return { throwMm, radians }
}

// ── C-rate Calculator ─────────────────────────────────────────────────────────
// C-rate = current (A) / capacity (Ah)
export function batteryC(params: {
  capacityMah: number
  currentA: number
}): { cRate: number; maxSafeCurrentA: number } {
  const { capacityMah, currentA } = params
  const capacityAh = capacityMah / 1000
  const cRate = capacityAh > 0 ? currentA / capacityAh : 0
  const maxSafeCurrentA = capacityAh * 25  // conservative 25C max
  return { cRate, maxSafeCurrentA }
}

// ── IMU / Frame Vibration Analysis ───────────────────────────────────────────
// Motor electrical frequency → mechanical vibration frequency → check against
// typical carbon fiber frame natural frequency range (100–300 Hz).
export function imuVibration(params: {
  rpm: number
  polePairs: number        // e.g. 7 for a 14-pole motor
  motorCount: number
  frameNaturalFreqHz?: number  // user-supplied or use default range mid 200 Hz
}): {
  mechanicalHz: number
  electricalHz: number
  vibrationHz: number     // dominant vibration = mech × motorCount (prop pass)
  resonanceRisk: 'ok' | 'caution' | 'danger'
  note: string
} {
  const { rpm, polePairs, motorCount, frameNaturalFreqHz = 200 } = params
  const mechanicalHz = rpm / 60
  const electricalHz = mechanicalHz * polePairs
  const vibrationHz = mechanicalHz * motorCount  // once-per-rev × motor count
  const diff = Math.abs(vibrationHz - frameNaturalFreqHz)
  const ratio = diff / frameNaturalFreqHz
  let resonanceRisk: 'ok' | 'caution' | 'danger'
  let note: string
  if (ratio < 0.05) {
    resonanceRisk = 'danger'
    note = `Резонанс! ${vibrationHz.toFixed(1)} Гц ≈ власна частота рами ${frameNaturalFreqHz} Гц. Змініть RPM або демпфуйте мотори.`
  } else if (ratio < 0.15) {
    resonanceRisk = 'caution'
    note = `Близько до резонансу (${vibrationHz.toFixed(1)} Гц vs ${frameNaturalFreqHz} Гц). Рекомендовані гумові демпфери IMU.`
  } else {
    resonanceRisk = 'ok'
    note = `Вібраційна частота ${vibrationHz.toFixed(1)} Гц далеко від резонансу рами.`
  }
  return { mechanicalHz, electricalHz, vibrationHz, resonanceRisk, note }
}
