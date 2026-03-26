/**
 * Emergency glide footprint estimator.
 *
 * When propulsion fails a fixed-wing drone becomes a glider.  This module
 * computes the reachable ground area (footprint) given altitude, best-glide
 * speed, L/D ratio and wind.
 *
 * Model assumptions:
 *   - Constant sink rate: V_s = V_bg / (L/D)
 *   - Time aloft:         T = h_AGL / V_s
 *   - Ground range:       R = (V_bg ± V_wind) × T
 *   - Upwind range becomes negative when wind > V_bg (blown backwards)
 *
 * The footprint is an ellipse approximation: downwind radius × upwind radius
 * along the wind axis; crosswind radius = no-wind radius on the perpendicular.
 */

export interface GlideInput {
  /** Altitude above ground level, m (must be > 0) */
  altitudeAglM: number
  /** Best-glide airspeed (V_bg), m/s */
  bestGlideSpeedMs: number
  /** Maximum lift-to-drag ratio (L/D max) */
  maxLdRatio: number
  /** Wind speed (any direction, same magnitude used for ± axis), m/s */
  windSpeedMs: number
}

export interface GlideFootprint {
  /** Time to ground contact at best-glide sink rate, s */
  maxTimeAloftS: number
  /** Glide radius in zero wind, m  (= altitudeAglM × L/D) */
  radiusNoWindM: number
  /** Maximum reach downwind (V_bg + V_wind), m */
  maxDistanceDownwindM: number
  /**
   * Maximum reach upwind (V_bg − V_wind), m.
   * Negative value means the drone is blown backward even at full glide.
   */
  maxDistanceUpwindM: number
  /** True if the drone can make headway against the wind (V_bg > V_wind) */
  canHoldPosition: boolean
}

/**
 * Compute the emergency glide footprint under wind influence.
 *
 * @throws {RangeError} if altitudeAglM ≤ 0 or bestGlideSpeedMs ≤ 0 or maxLdRatio ≤ 0
 */
export function calculateGlideFootprint(input: GlideInput): GlideFootprint {
  const { altitudeAglM, bestGlideSpeedMs, maxLdRatio, windSpeedMs } = input

  if (altitudeAglM    <= 0) throw new RangeError('altitudeAglM must be > 0')
  if (bestGlideSpeedMs <= 0) throw new RangeError('bestGlideSpeedMs must be > 0')
  if (maxLdRatio       <= 0) throw new RangeError('maxLdRatio must be > 0')

  const sinkRateMs       = bestGlideSpeedMs / maxLdRatio
  const timeAloftS       = altitudeAglM / sinkRateMs
  const radiusNoWindM    = altitudeAglM * maxLdRatio

  const wind             = Math.max(0, windSpeedMs)
  const downwindSpeedMs  = bestGlideSpeedMs + wind
  const upwindSpeedMs    = bestGlideSpeedMs - wind   // negative when wind > V_bg

  return {
    maxTimeAloftS:          +timeAloftS.toFixed(1),
    radiusNoWindM:          +radiusNoWindM.toFixed(0),
    maxDistanceDownwindM:   +(downwindSpeedMs * timeAloftS).toFixed(0),
    maxDistanceUpwindM:     +(upwindSpeedMs   * timeAloftS).toFixed(0),
    canHoldPosition:        upwindSpeedMs > 0,
  }
}
