/**
 * Wind gradient model — logarithmic wind profile (log wind profile).
 *
 * Extrapolates surface weather forecast wind speed (typically given at 10 m AGL,
 * the WMO standard) to the actual UAV operating altitude. Wind speed increases
 * significantly with altitude as ground friction effects diminish.
 *
 *   V(z) = V_ref × ln(z / z₀) / ln(z_ref / z₀)
 *
 * Applicable for neutral atmospheric stability (typical daytime conditions).
 * Roughness length z₀ characterises the terrain surface texture.
 *
 * Effect example: 5 m/s at 10 m over open grass → ≈ 8.4 m/s at 500 m AGL.
 * Ignoring this produces optimistic battery consumption estimates against wind.
 *
 * References:
 *   ISO 4354:2009 — wind actions on structures (roughness categories)
 *   Simiu & Scanlan (1996) "Wind Effects on Structures", §2.2
 *   WMO-No.8 (2018) — Guide to Instruments and Methods of Observation
 */

/**
 * Surface roughness length z₀ (m) for common terrain types.
 * Values from ISO 4354 Table 1 and Simiu & Scanlan Appendix.
 */
export const TerrainRoughness = {
  /** Open water, sea surface, smooth ice */
  Water:          0.0002,
  /** Smooth snow, flat tundra */
  SmoothSnow:     0.002,
  /** Open farmland, low grass, airports */
  OpenGrass:      0.03,
  /** Tall crops, hedgerows */
  Crops:          0.1,
  /** Scattered trees and shrubs */
  ScatteredTrees: 0.25,
  /** Dense forest, jungle */
  Forest:         0.5,
  /** Low-density suburban area */
  Suburbs:        1.0,
  /** Dense urban, high-rise buildings */
  City:           2.0,
} as const

export type TerrainRoughnessValue = (typeof TerrainRoughness)[keyof typeof TerrainRoughness]

export interface WindGradientInput {
  /** Wind speed from weather forecast, m/s */
  referenceWindSpeedMs: number
  /** Height of the weather measurement, m AGL (default 10 — WMO standard) */
  referenceHeightM?: number
  /** UAV operating altitude, m AGL */
  targetAltitudeM: number
  /** Roughness length of the underlying terrain, m (use TerrainRoughness constants) */
  z0: TerrainRoughnessValue | number
}

export interface WindGradientResult {
  /** Wind speed at target altitude, m/s */
  windSpeedMs: number
  /** Wind speed increase relative to reference, m/s */
  deltaMs: number
  /** Amplification factor (V_target / V_ref) */
  amplificationFactor: number
}

/**
 * Compute wind speed at UAV operating altitude using the log wind profile.
 *
 * Returns reference speed unchanged when target altitude equals reference height.
 * Clamps target altitude to at least z₀ + 0.01 m (below the roughness sublayer
 * the log profile is not valid).
 */
export function windAtAltitude(input: WindGradientInput): WindGradientResult {
  const zRef = input.referenceHeightM ?? 10
  const z0   = input.z0
  const zTarget = Math.max(input.targetAltitudeM, z0 + 0.01)

  const lnTarget = Math.log(zTarget / z0)
  const lnRef    = Math.log(zRef    / z0)

  // Guard: if reference height is at or below z0, log profile breaks down
  if (lnRef <= 0) {
    return {
      windSpeedMs:          +input.referenceWindSpeedMs.toFixed(2),
      deltaMs:              0,
      amplificationFactor:  1,
    }
  }

  const amplification = lnTarget / lnRef
  const windMs        = input.referenceWindSpeedMs * amplification

  return {
    windSpeedMs:         +windMs.toFixed(2),
    deltaMs:             +(windMs - input.referenceWindSpeedMs).toFixed(2),
    amplificationFactor: +amplification.toFixed(3),
  }
}
