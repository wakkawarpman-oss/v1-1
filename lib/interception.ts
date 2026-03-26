/**
 * Moving-target interception kinematics (Collision Course / Lead-Angle method).
 *
 * For an intercept on a collision course the Line-of-Sight (LOS) angle must
 * remain constant.  We solve the velocity triangle:
 *
 *   V_i · sin(φ) = V_t · sin(θ)
 *   V_c = V_i · cos(φ) − V_t · cos(θ)
 *
 * where:
 *   φ   = lead angle (angle the interceptor must point ahead of the LOS)
 *   θ   = target heading relative to LOS (0 = target moving away, 180 = head-on)
 *   V_c = closing speed along the LOS
 */

export interface InterceptInput {
  /** Current range to target, m */
  targetDistanceM: number
  /** Target ground speed, m/s */
  targetSpeedMs: number
  /**
   * Target heading relative to the LOS, degrees.
   * 0 = target moving directly away,
   * 90 = target crossing at right-angles,
   * 180 = target approaching head-on.
   */
  targetHeadingDeg: number
  /** Interceptor cruise speed, m/s */
  interceptorSpeedMs: number
  /** Available flight endurance at cruise speed, s */
  maxFlightTimeS: number
}

export interface InterceptResult {
  /** True if intercept is geometrically possible */
  isPossible: boolean
  /** Time to intercept, s */
  timeToInterceptS: number
  /** Lead angle the interceptor must fly, degrees */
  leadAngleDeg: number
  /** Distance the interceptor will cover to the meeting point, m */
  interceptDistanceM: number
  /** True if endurance covers the full intercept time */
  batterySufficient: boolean
}

/**
 * Compute 2-D interception kinematics for a moving target.
 */
export function calculateInterception(input: InterceptInput): InterceptResult {
  const IMPOSSIBLE: InterceptResult = {
    isPossible: false,
    timeToInterceptS: 0,
    leadAngleDeg: 0,
    interceptDistanceM: 0,
    batterySufficient: false,
  }

  if (
    input.targetDistanceM <= 0 ||
    input.interceptorSpeedMs <= 0 ||
    input.maxFlightTimeS <= 0
  ) return IMPOSSIBLE

  const thetaRad   = input.targetHeadingDeg * (Math.PI / 180)
  const speedRatio = input.targetSpeedMs / input.interceptorSpeedMs
  const sinPhi     = speedRatio * Math.sin(thetaRad)

  if (Math.abs(sinPhi) > 1) return IMPOSSIBLE   // target too fast / angle impossible

  const phiRad         = Math.asin(sinPhi)
  const leadAngleDeg   = phiRad * (180 / Math.PI)
  const closingSpeed   = input.interceptorSpeedMs * Math.cos(phiRad)
                       - input.targetSpeedMs       * Math.cos(thetaRad)

  if (closingSpeed <= 0) return IMPOSSIBLE        // interceptor can never close range

  const timeToInterceptS   = input.targetDistanceM / closingSpeed
  const interceptDistanceM = timeToInterceptS * input.interceptorSpeedMs

  return {
    isPossible:          true,
    timeToInterceptS:    +timeToInterceptS.toFixed(1),
    leadAngleDeg:        +leadAngleDeg.toFixed(1),
    interceptDistanceM:  +interceptDistanceM.toFixed(0),
    batterySufficient:   timeToInterceptS <= input.maxFlightTimeS,
  }
}
