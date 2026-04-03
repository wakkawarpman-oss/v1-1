export type PerfCalcInput = {
  elevationM: number
  temperatureC: number
  weightKg: number
  wingAreaDm2: number
  wingSpanMm: number
  cd0: number
  oswald: number
  clMax: number
  motorCount: number
  propDiameterIn: number
  propPitchIn: number
  bladeCount: number
  rpm: number
  staticThrustG: number
  drivePowerW: number
  batteryCells: number
  batteryVoltagePerCell: number
  batteryCapacityMah: number
  averageCurrentA: number
  // Altmann motor model (optional — activates high-accuracy mode when all three provided)
  motorKv?: number   // RPM/V
  motorRi?: number   // Ω internal resistance
  motorI0?: number   // A no-load current
  // Peukert + voltage sag model (optional — improves flight-time and voltage accuracy)
  batteryRiMohm?: number  // mΩ total pack internal resistance
  peukertK?: number       // Peukert exponent (1.0=ideal, typical LiPo 1.05–1.15)
  // Prop database overrides (optional — real UIUC Ct/Cp instead of formula)
  ctStaticOverride?: number
  cpStaticOverride?: number
}

export type PerfCurvePoint = {
  speedKmh: number
  parasitePower: number
  inducedPower: number
  reqPower: number
  availablePower: number
  thrustDynamicG: number
  thrustDynamicN: number
  roc: number
  climbAngle: number
  efficiencyWhKm: number
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function round(value: number, decimals = 2) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function airDensity(elevationM: number, temperatureC: number) {
  const seaLevelPressure = 101325
  const lapseRate = 0.0065
  const gasConstant = 287.05
  const gravity = 9.80665
  // Guard: absolute zero floor prevents division by zero / NaN
  const tempK = Math.max(1, temperatureC + 273.15)
  // Guard: ISA lapse-rate model is only valid below ~44 km (standardTempK > 0).
  // Clamp to 1 K so Math.pow stays real-valued for any user input.
  const standardTempK = Math.max(1, 288.15 - lapseRate * elevationM)
  const pressure =
    seaLevelPressure *
    Math.pow(standardTempK / 288.15, gravity / (gasConstant * lapseRate))

  return pressure / (gasConstant * tempK)
}

export function propDiskAreaM2(diameterIn: number, motorCount = 1) {
  const diameterM = diameterIn * 0.0254
  const singleArea = Math.PI * (diameterM / 2) ** 2
  return singleArea * motorCount
}

export function aspectRatio(spanMm: number, areaDm2: number) {
  const spanM = spanMm / 1000
  const areaM2 = areaDm2 / 100
  if (areaM2 <= 0) return 0
  return (spanM * spanM) / areaM2
}

/**
 * Oswald efficiency factor estimate from aspect ratio.
 * Raymer (2018) eq. 12.49: e₀ = 1.78·(1 − 0.045·AR^0.68) − 0.64
 * Valid for straight-wing aircraft; clamped to [0.50, 0.95].
 */
export function estimateOswald(ar: number): number {
  if (ar <= 0) return 0.75
  return clamp(1.78 * (1 - 0.045 * Math.pow(ar, 0.68)) - 0.64, 0.50, 0.95)
}

export function pitchSpeedKmh(rpm: number, pitchIn: number) {
  return rpm * pitchIn * 0.001524
}

/**
 * tConst for staticThrustFromProp empirical formula.
 * Blade factor: +0.000014 per blade above 2.
 * Calibrated against staticThrustFromCt at APC 10×6, 9200 RPM, sea level.
 */
export function propTConst(bladeCount: number): number {
  return 0.000168 + (bladeCount - 2) * 0.000014
}

export function staticThrustFromProp(params: {
  tConst: number
  rpm: number
  diameterIn: number
  pitchIn: number
  bladeCount?: number
}) {
  const bladeFactor = params.bladeCount ? 1 + (params.bladeCount - 2) * 0.08 : 1
  const thrustG =
    params.tConst *
    Math.pow(params.rpm / 1000, 2.18) *
    Math.pow(params.diameterIn, 3.92) *
    Math.pow(params.pitchIn, 0.62) *
    bladeFactor

  return thrustG
}

export function dynamicThrustG(staticThrustG: number, speedKmh: number, pitchSpeed: number) {
  if (pitchSpeed <= 0) return 0
  const ratio = clamp(1 - speedKmh / pitchSpeed, 0.08, 1)
  return staticThrustG * ratio
}

export function requiredPowerW(params: {
  density: number
  speedMs: number
  wingAreaM2: number
  cd0: number
  weightN: number
  aspectRatio: number
  oswald: number
}) {
  const { density, speedMs, wingAreaM2, cd0, weightN, aspectRatio, oswald } = params
  if (speedMs <= 0 || wingAreaM2 <= 0 || aspectRatio <= 0 || oswald <= 0) return 0

  const parasite = 0.5 * density * speedMs ** 3 * wingAreaM2 * cd0
  const induced =
    (2 * weightN ** 2) /
    (density * speedMs * wingAreaM2 * Math.PI * aspectRatio * oswald)

  return parasite + induced
}

export function parasitePowerW(params: {
  density: number
  speedMs: number
  wingAreaM2: number
  cd0: number
}) {
  return 0.5 * params.density * params.speedMs ** 3 * params.wingAreaM2 * params.cd0
}

export function inducedPowerW(params: {
  density: number
  speedMs: number
  wingAreaM2: number
  weightN: number
  aspectRatio: number
  oswald: number
}) {
  if (
    params.speedMs <= 0 ||
    params.wingAreaM2 <= 0 ||
    params.aspectRatio <= 0 ||
    params.oswald <= 0
  ) {
    return 0
  }

  return (
    (2 * params.weightN ** 2) /
    (params.density * params.speedMs * params.wingAreaM2 * Math.PI * params.aspectRatio * params.oswald)
  )
}

export function stallSpeedMs(params: {
  density: number
  weightN: number
  wingAreaM2: number
  clMax: number
}) {
  if (params.density <= 0 || params.wingAreaM2 <= 0 || params.clMax <= 0) return 0
  return Math.sqrt((2 * params.weightN) / (params.density * params.wingAreaM2 * params.clMax))
}

export function inducedVelocityMs(thrustN: number, density: number, diskAreaM2: number) {
  if (density <= 0 || diskAreaM2 <= 0 || thrustN <= 0) return 0
  return Math.sqrt(thrustN / (2 * density * diskAreaM2))
}

// ── Slipstream / Actuator-disk drag ───────────────────────────────────────────

export interface SlipstreamInput {
  /** Thrust per motor, Newtons */
  thrustN: number
  /** Propeller diameter, metres */
  propDiameterM: number
  /** Flight speed, m/s (0 = static hover) */
  flightSpeedMs: number
  /** Air density, kg/m³ */
  density: number
  /** Frontal area of body immersed in slipstream, m² (optional) */
  bodyAreaM2?: number
  /** Drag coefficient of that body (optional, default 0.5) */
  bodyCd?: number
}

export interface SlipstreamResult {
  /** Induced velocity at actuator disk, m/s */
  inducedVelocityMs: number
  /** Far-wake axial velocity increment = 2 × v_i, m/s */
  wakeVelocityMs: number
  /** Disk radius = prop D/2 */
  diskRadiusM: number
  /** Far-wake radius (Rankine-Froude contraction ≈ r × √0.5) */
  wakeRadiusM: number
  /** Freestream dynamic pressure, Pa */
  qFreestream: number
  /** Dynamic pressure in far wake, Pa */
  qWake: number
  /** Extra drag on body due to slipstream, N (0 if no body params given) */
  slipstreamDragN: number
  /** Same in grams */
  slipstreamDragG: number
  /** Actuator-disk propulsive efficiency η = V / (V + v_i); NaN at V=0 */
  propulsiveEfficiency: number
  /** Power lost to kinetic energy in the wake (ideal minimum), W */
  inducedPowerW: number
}

export function slipstreamDrag(inp: SlipstreamInput): SlipstreamResult {
  const { thrustN, propDiameterM, flightSpeedMs, density } = inp
  const diskAreaM2 = Math.PI * (propDiameterM / 2) ** 2

  const vi   = inducedVelocityMs(thrustN, density, diskAreaM2)       // at disk
  const vw   = 2 * vi                                                  // far-wake increment
  const diskR = propDiameterM / 2
  const wakeR = diskR * Math.sqrt(0.5)                                 // Rankine contraction

  const qFree = 0.5 * density * flightSpeedMs ** 2
  const qWake = 0.5 * density * (flightSpeedMs + vw) ** 2

  const Cd   = inp.bodyCd ?? 0.5
  const Abody = inp.bodyAreaM2 ?? 0
  const extraDragN = (qWake - qFree) * Cd * Abody

  const eta = flightSpeedMs > 0 ? flightSpeedMs / (flightSpeedMs + vi) : NaN

  return {
    inducedVelocityMs:    vi,
    wakeVelocityMs:       vw,
    diskRadiusM:          diskR,
    wakeRadiusM:          wakeR,
    qFreestream:          qFree,
    qWake,
    slipstreamDragN:      Math.max(0, extraDragN),
    slipstreamDragG:      Math.max(0, extraDragN) * 101.97,
    propulsiveEfficiency: eta,
    inducedPowerW:        thrustN * vi,
  }
}

export function rocMs(powerAvailableW: number, powerRequiredW: number, weightKg: number) {
  if (weightKg <= 0) return 0
  const excess = powerAvailableW - powerRequiredW
  return excess / (weightKg * 9.81)
}

export function estimateFlightTimeMin(capacityMah: number, currentA: number, reserve = 0.85) {
  if (capacityMah <= 0 || currentA <= 0) return 0
  return (capacityMah / 1000 / currentA) * 60 * reserve
}

export function timeToHeightSeconds(heightM: number, rocMsValue: number) {
  if (heightM <= 0 || rocMsValue <= 0) return 0
  return heightM / rocMsValue
}

export function availablePowerAtSpeedW(params: {
  drivePowerW: number
  speedKmh: number
  pitchSpeedKmhValue: number
  staticThrustG: number
  dynamicThrustGValue: number
}) {
  const thrustRatio =
    params.staticThrustG > 0 ? clamp(params.dynamicThrustGValue / params.staticThrustG, 0.15, 1) : 0.15
  const speedRatio = params.pitchSpeedKmhValue > 0 ? clamp(params.speedKmh / params.pitchSpeedKmhValue, 0, 1.1) : 0
  const propEfficiency = clamp(0.6 + 0.28 * speedRatio - 0.22 * speedRatio ** 2, 0.45, 0.86)

  return Math.max(0, params.drivePowerW * thrustRatio * (0.88 + (propEfficiency - 0.65)))
}

// ── Reynolds-corrected polars ──────────────────────────────────────────────
// Based on Lissaman (1983) "Low-Reynolds-number airfoils" and Selig et al.
// Corrections activate below Re=300k — typical for small RC aircraft (<1.2m span).

/**
 * Dynamic viscosity of air via Sutherland's law.
 * μ_ref = 1.789e-5 Pa·s at 288.15 K
 */
export function dynamicViscosity(temperatureC: number): number {
  const T = temperatureC + 273.15
  const T_ref = 288.15
  const mu_ref = 1.789e-5
  const S = 110.4
  return mu_ref * Math.pow(T / T_ref, 1.5) * (T_ref + S) / (T + S)
}

/** Re = ρ·V·c / μ */
export function reynoldsNumber(density: number, speedMs: number, chordM: number, viscosity: number): number {
  return viscosity > 0 ? density * speedMs * chordM / viscosity : 0
}

/**
 * CD0 correction for low Re.
 * Below Re=300k laminar separation increases parasite drag.
 * Exponent 0.18 from Lissaman curve fit.
 */
export function reCorrectCd0(cd0: number, re: number): number {
  if (re <= 0) return cd0
  const re_ref = 300_000
  if (re >= re_ref) return cd0
  return cd0 * Math.pow(re_ref / re, 0.18)
}

/**
 * CL_max correction for low Re.
 * Laminar separation bubble limits max lift below Re=300k.
 * Factor floors at 0.72 (severe separation for very small/slow aircraft).
 */
export function reCorrectClMax(clMax: number, re: number): number {
  if (re <= 0) return clMax
  const re_ref = 300_000
  if (re >= re_ref) return clMax
  return clMax * clamp(0.72 + 0.28 * Math.sqrt(re / re_ref), 0.72, 1.0)
}
// ──────────────────────────────────────────────────────────────────────────

/**
 * Voltage sag under load.
 * V_eff = V_nominal − I × R_internal
 * batteryRiMohm: total pack resistance in mΩ (series cells × cell_Ri)
 */
export function saggedVoltage(nominalV: number, currentA: number, batteryRiMohm: number): number {
  return Math.max(nominalV * 0.7, nominalV - currentA * batteryRiMohm / 1000)
}

/**
 * Peukert-corrected capacity.
 * C_eff = C_rated × (I_1C / I_actual)^(k−1)
 * k=1.0 → ideal; k≈1.08 for LiPo; k≈1.2 for older NiMH
 */
export function peukertCapacityMah(capacityMah: number, currentA: number, peukertK: number): number {
  if (currentA <= 0) return capacityMah
  const i1c = capacityMah / 1000           // 1C current in A
  const ratio = clamp(i1c / currentA, 0.1, 10)
  return capacityMah * Math.pow(ratio, peukertK - 1)
}

export function perfSummary(input: PerfCalcInput) {
  const density = airDensity(input.elevationM, input.temperatureC)
  const weightN = input.weightKg * 9.81
  const wingAreaM2 = input.wingAreaDm2 / 100
  const ar = aspectRatio(input.wingSpanMm, input.wingAreaDm2)
  const nominalVoltage = input.batteryCells * input.batteryVoltagePerCell

  // ── Peukert + voltage sag ─────────────────────────────────────────────────
  const usePeukert = (input.batteryRiMohm ?? 0) > 0 && (input.peukertK ?? 0) > 0
  const batteryVoltage = usePeukert
    ? saggedVoltage(nominalVoltage, input.averageCurrentA, input.batteryRiMohm!)
    : nominalVoltage
  const effectiveCapacityMah = usePeukert
    ? peukertCapacityMah(input.batteryCapacityMah, input.averageCurrentA, input.peukertK!)
    : input.batteryCapacityMah
  // ─────────────────────────────────────────────────────────────────────────

  // ── Reynolds-corrected polars ─────────────────────────────────────────────
  const chordM = input.wingSpanMm > 0 ? wingAreaM2 / (input.wingSpanMm / 1000) : 0.15
  const viscosity = dynamicViscosity(input.temperatureC)
  // ─────────────────────────────────────────────────────────────────────────

  // ── Altmann high-accuracy mode ────────────────────────────────────────────
  const useAltmann =
    input.motorKv !== undefined &&
    input.motorRi !== undefined &&
    input.motorI0 !== undefined
  const motor: MotorParams | null = useAltmann
    ? { kv: input.motorKv!, ri: input.motorRi!, i0: input.motorI0! }
    : null

  const ct = input.ctStaticOverride ?? propCtStatic(input.propDiameterIn, input.propPitchIn, input.bladeCount)
  const cp = input.cpStaticOverride ?? propCpStatic(input.propDiameterIn, input.propPitchIn, input.bladeCount)

  // Computed or user-provided static operating point
  const effectiveRpm = motor
    ? motorStaticRpm(motor, batteryVoltage, cp, density, input.propDiameterIn) * input.motorCount
    : input.rpm
  const effectiveStaticThrustG = motor
    ? staticThrustFromCt(ct, density,
        motorStaticRpm(motor, batteryVoltage, cp, density, input.propDiameterIn),
        input.propDiameterIn) * input.motorCount
    : input.staticThrustG
  const effectiveDrivePowerW = motor
    ? motorShaftPowerW(motor, batteryVoltage,
        motorStaticRpm(motor, batteryVoltage, cp, density, input.propDiameterIn))
    : input.drivePowerW

  const pitchSpeed = pitchSpeedKmh(effectiveRpm / (motor ? input.motorCount : 1), input.propPitchIn)
  // ─────────────────────────────────────────────────────────────────────────

  // Re-corrected CL_max: two-pass iteration for accuracy at very low Re.
  // Pass 1: estimate Re from uncorrected stall speed → first CLmax correction.
  // Pass 2: recompute Re with the corrected stall speed → final correction.
  // Converges in 2 passes; above Re=300k both passes are no-ops.
  const stallMsPass1 = stallSpeedMs({ density, weightN, wingAreaM2, clMax: input.clMax })
  const rePass1 = reynoldsNumber(density, stallMsPass1, chordM, viscosity)
  const clMaxPass1 = reCorrectClMax(input.clMax, rePass1)
  const stallMsPass2 = stallSpeedMs({ density, weightN, wingAreaM2, clMax: clMaxPass1 })
  const reAtStall = reynoldsNumber(density, stallMsPass2, chordM, viscosity)
  const clMaxCorrected = reCorrectClMax(input.clMax, reAtStall)

  const stallMs = stallSpeedMs({
    density,
    weightN,
    wingAreaM2,
    clMax: clMaxCorrected,
  })

  const points: PerfCurvePoint[] = Array.from({ length: 49 }, (_, index) => {
    const speedKmh = 8 + index * 4
    const speedMs = speedKmh / 3.6
    const re = reynoldsNumber(density, speedMs, chordM, viscosity)
    const cd0Corrected = reCorrectCd0(input.cd0, re)
    const parasitePower = parasitePowerW({
      density,
      speedMs,
      wingAreaM2,
      cd0: cd0Corrected,
    })
    const inducedPower = inducedPowerW({
      density,
      speedMs,
      wingAreaM2,
      weightN,
      aspectRatio: ar,
      oswald: input.oswald,
    })
    const reqPower = parasitePower + inducedPower

    const thrustDynamicG = motor
      ? dynamicThrustAltmann(effectiveStaticThrustG, effectiveRpm / input.motorCount, speedMs, input.propDiameterIn) * input.motorCount
      : dynamicThrustG(effectiveStaticThrustG, speedKmh, pitchSpeed)
    const thrustDynamicN = thrustDynamicG / 1000 * 9.81

    const powerAvailable = motor
      ? availablePowerAltmann(motor, batteryVoltage, cp, ct, density, input.propDiameterIn, speedMs) * input.motorCount
      : availablePowerAtSpeedW({
          drivePowerW: effectiveDrivePowerW,
          speedKmh,
          pitchSpeedKmhValue: pitchSpeed,
          staticThrustG: effectiveStaticThrustG,
          dynamicThrustGValue: thrustDynamicG,
        })
    const roc = rocMs(powerAvailable, reqPower, input.weightKg)
    const climbAngle = speedMs > 0 ? Math.asin(clamp(roc / speedMs, -1, 1)) * 180 / Math.PI : 0

    return {
      speedKmh,
      parasitePower,
      inducedPower,
      reqPower,
      availablePower: powerAvailable,
      thrustDynamicG,
      thrustDynamicN,
      roc,
      climbAngle,
      efficiencyWhKm: speedKmh > 0 ? reqPower / speedKmh : 0,
    }
  }).filter((point) => Number.isFinite(point.reqPower))

  // Safety net: with the airDensity guard above, this path is only reachable on
  // genuinely degenerate inputs (e.g. wingArea = 0). Provide a zero-valued point
  // so reduce() never receives undefined as its initial accumulator.
  const ZERO_POINT: PerfCurvePoint = {
    speedKmh: 0, parasitePower: 0, inducedPower: 0, reqPower: 0,
    availablePower: 0, thrustDynamicG: 0, thrustDynamicN: 0,
    roc: 0, climbAngle: 0, efficiencyWhKm: 0,
  }
  const initialPoint = points[0] ?? ZERO_POINT
  const minPowerPoint = points.reduce(
    (best, current) => (current.reqPower < best.reqPower ? current : best),
    initialPoint,
  )
  const bestRocPoint = points.reduce(
    (best, current) => (current.roc > best.roc ? current : best),
    initialPoint,
  )
  const bestAnglePoint = points.reduce(
    (best, current) => (current.climbAngle > best.climbAngle ? current : best),
    initialPoint,
  )
  const bestEfficiencyPoint = points.reduce(
    (best, current) => (current.efficiencyWhKm < best.efficiencyWhKm ? current : best),
    initialPoint,
  )
  const maxSpeedFound = [...points].reverse().find((point) => point.availablePower >= point.reqPower)
  const canSustainLevel = maxSpeedFound !== undefined
  const maxSpeedPoint = maxSpeedFound ?? points[0]
  const carsonKmh = minPowerPoint.speedKmh * 1.316
  const inducedVelocity = inducedVelocityMs(
    effectiveStaticThrustG / 1000 * 9.81,
    density,
    propDiskAreaM2(input.propDiameterIn, input.motorCount),
  )
  const flightTimeMin = estimateFlightTimeMin(effectiveCapacityMah, input.averageCurrentA)
  const timeTo100m = timeToHeightSeconds(100, Math.max(bestRocPoint.roc, 0))
  const timeTo500m = timeToHeightSeconds(500, Math.max(bestRocPoint.roc, 0))
  const minDragPoint = points.reduce(
    (best, current) =>
      current.speedKmh > stallMs * 3.6 && current.reqPower < best.reqPower ? current : best,
    initialPoint,
  )

  const reAtCruise = reynoldsNumber(density, minPowerPoint.speedKmh / 3.6, chordM, viscosity)

  return {
    density,
    batteryVoltage,
    nominalVoltage,
    effectiveCapacityMah,
    usePeukert,
    chordM,
    reAtCruise,
    clMaxCorrected,
    aspectRatio: ar,
    pitchSpeed,
    stallSpeedKmh: stallMs * 3.6,
    thrustToWeight: effectiveStaticThrustG / (input.weightKg * 1000),
    bestRangeKmh: carsonKmh,
    bestEfficiencyWhKm: bestEfficiencyPoint.efficiencyWhKm,
    maxRocMs: bestRocPoint.roc,
    maxRocSpeedKmh: bestRocPoint.speedKmh,
    maxAngleDeg: bestAnglePoint.climbAngle,
    maxAngleSpeedKmh: bestAnglePoint.speedKmh,
    canSustainLevel,
    levelMaxSpeedKmh: canSustainLevel ? maxSpeedPoint.speedKmh : 0,
    oswaldAuto: estimateOswald(ar),
    minPowerW: minPowerPoint.reqPower,
    minPowerSpeedKmh: minPowerPoint.speedKmh,
    minDragPowerW: minDragPoint.reqPower,
    staticVerticalSpeedMs: inducedVelocity,
    timeTo100m,
    timeTo500m,
    estimatedFlightTimeMin: flightTimeMin,
    points,
  }
}

// ── Altmann Motor Model ────────────────────────────────────────────────────
// Based on Sigmar Altmann's work published in aufwind/MFI series.
// Replaces magic-constant approximations with physics-derived motor+prop model.

export type MotorParams = {
  kv: number  // RPM/V (velocity constant)
  ri: number  // Ω   (internal winding resistance)
  i0: number  // A   (no-load current — iron + friction losses)
}

/**
 * Static prop power coefficient Cp from geometry.
 * Calibrated against APC/UIUC static prop data.
 * Cp_static ≈ 0.070 × blades^0.3 × (pitch/diam)^0.6
 */
export function propCpStatic(diameterIn: number, pitchIn: number, bladeCount: number): number {
  return 0.070 * Math.pow(bladeCount, 0.3) * Math.pow(pitchIn / diameterIn, 0.6)
}

/**
 * Static prop thrust coefficient Ct from geometry.
 * Calibrated against APC/UIUC static prop data.
 * Ct_static ≈ 0.044 × blades^0.3 × (1 + 0.5 × pitch/diam)
 */
export function propCtStatic(diameterIn: number, pitchIn: number, bladeCount: number): number {
  return 0.044 * Math.pow(bladeCount, 0.3) * (1 + 0.5 * pitchIn / diameterIn)
}

/**
 * Motor shaft power [W] at given RPM and supply voltage.
 * P_shaft = back_EMF × (I_total − I₀)
 * where back_EMF = n/Kv, I_total = (U − back_EMF) / Ri
 */
export function motorShaftPowerW(motor: MotorParams, voltage: number, rpm: number): number {
  const backEmf = rpm / motor.kv
  const current = (voltage - backEmf) / motor.ri
  const shaftCurrent = current - motor.i0
  if (shaftCurrent <= 0) return 0
  return backEmf * shaftCurrent
}

/**
 * Motor efficiency at given RPM and voltage.
 */
export function motorEfficiency(motor: MotorParams, voltage: number, rpm: number): number {
  const backEmf = rpm / motor.kv
  const current = (voltage - backEmf) / motor.ri
  if (current <= 0) return 0
  const pIn = voltage * current
  const pShaft = motorShaftPowerW(motor, voltage, rpm)
  return pIn > 0 ? pShaft / pIn : 0
}

/**
 * Find static equilibrium RPM by bisection.
 * Solves P_motor(n) = P_prop(n) at V=0.
 */
export function motorStaticRpm(
  motor: MotorParams,
  batteryV: number,
  cp: number,
  density: number,
  diameterIn: number,
): number {
  const D = diameterIn * 0.0254
  let lo = 0
  let hi = motor.kv * batteryV * 0.995

  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2
    const nRps = mid / 60
    const pMotor = motorShaftPowerW(motor, batteryV, mid)
    const pProp = cp * density * nRps ** 3 * D ** 5
    if (pMotor > pProp) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * Static thrust [g] from Ct, density, RPM, diameter.
 */
export function staticThrustFromCt(
  ct: number,
  density: number,
  rpm: number,
  diameterIn: number,
): number {
  const D = diameterIn * 0.0254
  const nRps = rpm / 60
  const thrustN = ct * density * nRps ** 2 * D ** 4
  return (thrustN * 1000) / 9.81
}

/**
 * Dynamic thrust via advance ratio (Altmann momentum model).
 * J = V / (n_rps × D) — advance ratio
 * T_dyn = T_stat × (1 − J / J_max)^1.8
 * More accurate than linear: captures the flatter torque curve at low J
 * and the sharper drop near pitch speed.
 */
export function dynamicThrustAltmann(
  staticThrustG: number,
  rpm: number,
  speedMs: number,
  diameterIn: number,
): number {
  if (rpm <= 0 || diameterIn <= 0) return 0
  const D = diameterIn * 0.0254
  const J = speedMs / ((rpm / 60) * D)
  const Jmax = 1.05
  if (J >= Jmax) return 0
  return staticThrustG * Math.pow(Math.max(0, 1 - J / Jmax), 1.8)
}

/**
 * Prop efficiency from advance ratio: η = J × Ct / Cp
 * Peaks around J = 0.55–0.75 for typical sport props.
 */
export function propEfficiencyFromJ(J: number, ct: number, cp: number): number {
  if (cp <= 0 || J <= 0) return 0
  return Math.min(0.88, J * ct / cp)
}

/**
 * Available propulsive power at flight speed using Altmann model.
 * At speed V the prop partially unloads → RPM rises, Cp drops.
 * Finds new motor+prop equilibrium at each speed point.
 */
export function availablePowerAltmann(
  motor: MotorParams,
  batteryV: number,
  cp0: number,
  ct0: number,
  density: number,
  diameterIn: number,
  speedMs: number,
): number {
  const D = diameterIn * 0.0254
  let lo = 0
  let hi = motor.kv * batteryV * 0.995

  // Cp decreases with J as prop unloads: Cp(J) ≈ Cp0 × max(0.05, 1 − J/1.2)
  const cpAtSpeed = (rpm: number) => {
    const nRps = rpm / 60
    if (nRps <= 0) return cp0
    const J = speedMs / (nRps * D)
    return cp0 * Math.max(0.05, 1 - J / 1.2)
  }

  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2
    const nRps = mid / 60
    const cp = cpAtSpeed(mid)
    const pMotor = motorShaftPowerW(motor, batteryV, mid)
    const pProp = cp * density * nRps ** 3 * D ** 5
    if (pMotor > pProp) lo = mid
    else hi = mid
  }

  const rpmAtSpeed = (lo + hi) / 2
  const nRps = rpmAtSpeed / 60
  const J = nRps > 0 ? speedMs / (nRps * D) : 0
  // Disk efficiency: 0.78 at static, drops to 0 near pitch speed (J_max=1.05).
  // Uses actuator-disk theory rather than propulsive efficiency (which is 0 at J=0).
  const jRatio = Math.min(J / 1.05, 1)
  const eta = 0.78 * Math.pow(Math.max(0, 1 - jRatio), 0.8)
  return motorShaftPowerW(motor, batteryV, rpmAtSpeed) * Math.max(eta, 0.02)
}
