const SEA_LEVEL_DENSITY = 1.225
const GRAVITY = 9.81

function isPositive(value: number) {
  return Number.isFinite(value) && value > 0
}

function safeLogRatio(initialWeight: number, finalWeight: number) {
  if (!isPositive(initialWeight) || !isPositive(finalWeight) || initialWeight <= finalWeight) {
    return 0
  }

  return Math.log(initialWeight / finalWeight)
}

export function trueAirspeed(ias: number, rho: number, rho0 = SEA_LEVEL_DENSITY) {
  if (!isPositive(ias) || !isPositive(rho) || !isPositive(rho0)) return 0
  return ias * Math.sqrt(rho0 / rho)
}

export function equivalentAirspeed(ias: number, sigma: number) {
  if (!isPositive(ias) || !isPositive(sigma)) return 0
  return ias * Math.sqrt(sigma)
}

// Electric motor thrust scales linearly with air density (momentum theory, constant RPM approx)
// Use exponent=0.7 for gas-turbine / piston-propeller, 1.0 for electric
export function thrustAltitude(thrustSea: number, rho: number, rho0 = SEA_LEVEL_DENSITY, exponent = 1) {
  if (!isPositive(thrustSea) || !isPositive(rho) || !isPositive(rho0)) return 0
  return thrustSea * Math.pow(rho / rho0, exponent)
}

export function tsfc(fuelFlowKgHr: number, thrustKN: number) {
  if (!isPositive(fuelFlowKgHr) || !isPositive(thrustKN)) return 0
  return fuelFlowKgHr / thrustKN
}

// tsfcGravitational: TSFC in kg/kgf/h (= lb/lbf/h, same numerically).
// R [km] = (V [km/h] / TSFC [kg/kgf/h]) × L/D × ln(W0/W1) — units cancel in gravitational system.
// Typical turbofan: 0.5–0.8; turboprop: 0.3–0.5; piston: 0.4–0.6
export function breguetRange(speedKmh: number, tsfcGravitational: number, liftDrag: number, initialWeight: number, finalWeight: number) {
  if (!isPositive(speedKmh) || !isPositive(tsfcGravitational) || !isPositive(liftDrag)) return 0
  return (speedKmh / tsfcGravitational) * liftDrag * safeLogRatio(initialWeight, finalWeight)
}

// E [h] = (1 / TSFC [kg/kgf/h]) × L/D × ln(W0/W1)
export function breguetEndurance(tsfcGravitational: number, liftDrag: number, initialWeight: number, finalWeight: number) {
  if (!isPositive(tsfcGravitational) || !isPositive(liftDrag)) return 0
  return (1 / tsfcGravitational) * liftDrag * safeLogRatio(initialWeight, finalWeight)
}

export function climbAngle(thrustN: number, dragN: number, weightN: number) {
  if (!isPositive(weightN)) return 0
  const ratio = (thrustN - dragN) / weightN
  const clamped = Math.max(-1, Math.min(1, ratio))
  return Math.asin(clamped)
}

export function rateOfClimb(speedMs: number, gammaRad: number) {
  if (!isPositive(speedMs) || !Number.isFinite(gammaRad)) return 0
  return speedMs * Math.sin(gammaRad)
}

export function takeoffDistance(weightN: number, rho: number, wingAreaM2: number, clMaxValue: number, thrustN: number, gravity = GRAVITY) {
  if (!isPositive(weightN) || !isPositive(rho) || !isPositive(wingAreaM2) || !isPositive(clMaxValue) || !isPositive(thrustN) || !isPositive(gravity)) {
    return 0
  }

  return (1.44 * Math.pow(weightN, 2)) / (gravity * rho * wingAreaM2 * clMaxValue * thrustN)
}

export function landingDistance(weightN: number, rho: number, wingAreaM2: number, clMaxValue: number, reverseThrustN: number, gravity = GRAVITY) {
  if (!isPositive(weightN) || !isPositive(rho) || !isPositive(wingAreaM2) || !isPositive(clMaxValue) || !isPositive(reverseThrustN) || !isPositive(gravity)) {
    return 0
  }

  return (1.69 * Math.pow(weightN, 2)) / (gravity * rho * wingAreaM2 * clMaxValue * reverseThrustN)
}

export function fuelWeight(initialWeight: number, finalWeight: number) {
  if (!isPositive(initialWeight) || !isPositive(finalWeight) || initialWeight <= finalWeight) return 0
  return initialWeight - finalWeight
}

export function wingLoading(weight: number, wingAreaM2: number) {
  if (!isPositive(weight) || !isPositive(wingAreaM2)) return 0
  return weight / wingAreaM2
}

export function clMax(weightN: number, rho: number, stallSpeedMs: number, wingAreaM2: number) {
  if (!isPositive(weightN) || !isPositive(rho) || !isPositive(stallSpeedMs) || !isPositive(wingAreaM2)) return 0
  return (2 * weightN) / (rho * Math.pow(stallSpeedMs, 2) * wingAreaM2)
}

export function dragCoefficient(cd0: number, inducedFactor: number, cl: number) {
  if (!Number.isFinite(cd0) || !Number.isFinite(inducedFactor) || !Number.isFinite(cl)) return 0
  return cd0 + inducedFactor * Math.pow(cl, 2)
}

export function liftDragRatio(cl: number, cd: number) {
  if (!Number.isFinite(cl) || !isPositive(cd)) return 0
  return cl / cd
}

export function advanceRatio(speedMs: number, rpm: number, diameterM: number) {
  const revPerSecond = rpm / 60
  if (!isPositive(speedMs) || !isPositive(revPerSecond) || !isPositive(diameterM)) return 0
  return speedMs / (revPerSecond * diameterM)
}

export function propellerEfficiency(j: number) {
  if (!Number.isFinite(j)) return 0
  return 0.83 / (1 + 1.2 * Math.pow(j - 0.6, 2))
}

export function motorTorque(powerW: number, rpm: number) {
  if (!isPositive(powerW) || !isPositive(rpm)) return 0
  const omega = (2 * Math.PI * rpm) / 60
  return powerW / omega
}

// ── Stall Speed & Bank-angle Load Factor ─────────────────────────────────────
// V_stall = sqrt(2W / (ρ × S × CLmax))         [m/s]
// n (load factor in banked turn) = 1 / cos(φ)   [g]
// V_stall_banked = V_stall × sqrt(n)
export type StallResult = {
  stallSpeedMs: number
  stallSpeedKmh: number
  loadFactorG: number
  stallBankedMs: number
  stallBankedKmh: number
}

export function stallSpeed(params: {
  weightKg: number
  wingAreaM2: number
  clMax: number
  bankAngleDeg?: number   // 0 = level flight
  rhoKgM3?: number        // default ISA sea level
}): StallResult {
  const { weightKg, wingAreaM2, clMax, bankAngleDeg = 0, rhoKgM3 = SEA_LEVEL_DENSITY } = params
  if (!isPositive(weightKg) || !isPositive(wingAreaM2) || !isPositive(clMax) || !isPositive(rhoKgM3)) {
    return { stallSpeedMs: 0, stallSpeedKmh: 0, loadFactorG: 1, stallBankedMs: 0, stallBankedKmh: 0 }
  }
  const weightN = weightKg * GRAVITY
  const bankRad = (bankAngleDeg * Math.PI) / 180
  const cosBank = Math.max(0.01, Math.cos(bankRad))
  const loadFactorG = 1 / cosBank
  const stallSpeedMs = Math.sqrt((2 * weightN) / (rhoKgM3 * wingAreaM2 * clMax))
  const stallBankedMs = stallSpeedMs * Math.sqrt(loadFactorG)
  return {
    stallSpeedMs,
    stallSpeedKmh: stallSpeedMs * 3.6,
    loadFactorG,
    stallBankedMs,
    stallBankedKmh: stallBankedMs * 3.6,
  }
}

// ── Static Margin ─────────────────────────────────────────────────────────────
// SM = (AC position - CG position) / MAC  [% of MAC]
// AC is at 25% of MAC from LE. Positive SM → stable; negative → unstable.
export function staticMarginPct(cgPositionFromLeM: number, macLePositionM: number, macLengthM: number): number {
  if (!isPositive(macLengthM)) return 0
  const acPositionFromLeM = macLePositionM + 0.25 * macLengthM
  return ((acPositionFromLeM - cgPositionFromLeM) / macLengthM) * 100
}

// ── ESC Safety Margin ────────────────────────────────────────────────────────
// Recommended ESC continuous current ≥ motorMaxA × safetyFactor (1.3–1.5)
export function recommendedEscRating(motorMaxA: number, safetyFactor = 1.4): number {
  if (!isPositive(motorMaxA)) return 0
  return motorMaxA * safetyFactor
}

// ── Cable Voltage Drop ────────────────────────────────────────────────────────
// For DC power cables: V_drop = rho_per_m × I × 2L  (2L = there + back)
// AWG wire resistivity table (mΩ/m per conductor) at 20°C copper
const AWG_RESISTANCE_MohM: Record<string, number> = {
  '8':  0.7921,  '10': 1.26,   '12': 2.003, '14': 3.184,
  '16': 5.064,   '18': 8.046,  '20': 12.77, '22': 21.34,
}

export function cableVoltageDrop(params: {
  awg: string
  currentA: number
  cableLengthM: number  // one-way length
}): number {
  const { awg, currentA, cableLengthM } = params
  if (!isPositive(currentA) || !isPositive(cableLengthM)) return 0
  const rohm = (AWG_RESISTANCE_MohM[awg] ?? 12.77) / 1000  // Ω/m
  return rohm * currentA * 2 * cableLengthM
}

export function systemEfficiency(thrustN: number, speedMs: number, currentA: number, batteryVoltage: number) {
  const electricalPower = currentA * batteryVoltage
  if (!isPositive(thrustN) || !isPositive(speedMs) || !isPositive(electricalPower)) return 0
  return (thrustN * speedMs) / electricalPower
}

export function gLoad(centrifugalForceN: number, massKg: number, gravity = GRAVITY) {
  if (!isPositive(centrifugalForceN) || !isPositive(massKg) || !isPositive(gravity)) return 0
  return centrifugalForceN / (massKg * gravity)
}

export function cRate(currentA: number, capacityAh: number) {
  if (!isPositive(currentA) || !isPositive(capacityAh)) return 0
  return currentA / capacityAh
}