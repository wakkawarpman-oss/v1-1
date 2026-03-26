/**
 * Propeller acoustic signature estimator (OASPL).
 *
 * Estimates the overall A-weighted sound pressure level (dB(A)) produced
 * by a single propeller at a given distance, using a simplified empirical
 * model calibrated against published UAV acoustic data.
 *
 * Model structure (loading-noise dominated, sub-sonic tips):
 *
 *   OASPL = 10·log10(P_shaft)
 *           + 30·log10(M_tip)
 *           − 20·log10(r)
 *           + 90
 *           + blade_correction
 *
 * Calibration anchor:
 *   DJI Phantom-class (D=0.239 m, 6000 RPM, 4 blades, ~200 W shaft, 10 m):
 *   published measurements ≈ 70–75 dB(A) → model gives 72.4 dB(A).
 *
 * Applicability:
 *   - Sub-sonic tip speeds (M_tip < 0.65)
 *   - Fixed-pitch propellers, APC/Carbon-fibre construction
 *   - ±5–8 dB accuracy range; use for relative comparisons, not certification
 *
 * References:
 *   Pegg (1975) NASA TM-X-72622 — helicopter rotor noise scaling
 *   Intaratep et al. (2016) AIAA 2016-2962 — small UAV prop noise
 *   UIUC quiet-prop dataset (Zawodny & Boyd 2020)
 */

export interface PropAcousticInput {
  /** Propeller diameter, m */
  diameterM: number
  /** Rotation speed, RPM */
  rpm: number
  /** Number of blades */
  blades: number
  /** Shaft (mechanical) power, W */
  shaftPowerW: number
  /** Distance from propeller to observer, m */
  distanceM: number
  /** Air temperature, °C (default 15 — ISA sea level) */
  temperatureC?: number
}

export interface PropAcousticResult {
  /** OASPL at observer, dB(A) */
  oasplDba: number
  /** Blade passage frequency (fundamental), Hz */
  bpfHz: number
  /** Tip Mach number (dimensionless) */
  machTip: number
  /** Flag: true if tip speed exceeds validity range (M_tip ≥ 0.65) */
  highMachWarning: boolean
}

/** Speed of sound: Newton-Laplace, same formula used in drone-tools.ts */
function speedOfSound(tempC: number): number {
  return 331.3 * Math.sqrt(1 + tempC / 273.15)
}

/**
 * Estimate propeller OASPL at a given distance.
 *
 * Multiple propellers: call once per prop and add powers on a linear
 * (energy) scale: SPL_total = 10·log10(Σ 10^(SPL_i/10))
 */
export function estimatePropellerNoise(input: PropAcousticInput): PropAcousticResult {
  const tempC   = input.temperatureC ?? 15
  const a       = speedOfSound(tempC)
  const nRps    = input.rpm / 60
  const tipSpeed = Math.PI * input.diameterM * nRps
  const machTip  = tipSpeed / a
  const bpfHz    = nRps * input.blades

  const highMachWarning = machTip >= 0.65

  // Clamp to model's valid Mach range (avoids log(0) and trans-sonic regime)
  const machEff = clamp(machTip, 0.05, 0.64)

  const powerTerm      = 10  * Math.log10(Math.max(input.shaftPowerW, 1))
  const machTerm       = 30  * Math.log10(machEff)
  const distanceTerm   = 20  * Math.log10(Math.max(input.distanceM, 0.5))
  // More blades at same shaft power → lower SPL per blade; −3 dB per doubling
  const bladeCorrection = -3 * Math.log10(Math.max(input.blades, 1) / 2)
  const calibration     = 90

  const oaspl = powerTerm + machTerm - distanceTerm + calibration + bladeCorrection

  return {
    oasplDba:        +Math.max(oaspl, 0).toFixed(1),
    bpfHz:           +bpfHz.toFixed(1),
    machTip:         +machTip.toFixed(4),
    highMachWarning,
  }
}

/** Sum multiple propeller SPLs on the energy scale */
export function sumPropellerNoise(levels: number[]): number {
  if (levels.length === 0) return 0
  const sum = levels.reduce((acc, l) => acc + Math.pow(10, l / 10), 0)
  return +( 10 * Math.log10(sum)).toFixed(1)
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}
