/**
 * Propeller slipstream (propwash) interference drag.
 *
 * In a tractor configuration the propeller accelerates the air before it
 * reaches the fuselage and wing root. Those surfaces experience a higher
 * dynamic pressure than the free stream, which increases their skin-friction
 * drag — an effect absent from the baseline parasite drag model.
 *
 * Actuator-disk momentum theory gives the fully-developed slipstream velocity:
 *
 *   V_s = √( V_∞² + 2T / (ρ · A_disk) )
 *
 * The additional skin-friction drag on a wetted area S_wet is:
 *
 *   ΔD = (q_s − q_∞) · S_wet · C_f
 *
 * where q = ½ ρ V².
 *
 * Effect: at cruise (low thrust), ΔD is small; at climb (high thrust), ΔD
 * can be 5–15% of total parasite drag for typical tractor layouts.
 *
 * References:
 *   Glauert (1935) "Airplane Propellers", in Aerodynamic Theory Vol IV
 *   Raymer (2018) "Aircraft Design: A Conceptual Approach", §12.5
 */

export interface SlipstreamInput {
  /** Free-stream flight speed, m/s */
  freestreamVelocityMs: number
  /** Current propeller thrust (all motors combined), N */
  thrustN: number
  /** Propeller diameter (single prop), m */
  propDiameterM: number
  /** Air density, kg/m³ */
  density: number
  /** Wetted area of components immersed in slipstream (fuselage nose, wing root), m² */
  wettedAreaM2: number
  /** Skin-friction coefficient for the affected surfaces (typical range 0.003–0.008) */
  skinFrictionCoeff: number
  /** Number of motors / propellers (default 1) */
  motorCount?: number
}

export interface SlipstreamResult {
  /** Fully-developed slipstream velocity, m/s */
  slipstreamVelocityMs: number
  /** q_slipstream / q_freestream — dynamic pressure amplification ratio */
  dynamicPressureRatio: number
  /** Additional friction drag due to propwash, N */
  addedDragN: number
  /** Power penalty at current flight speed: ΔP = ΔD × V, W */
  addedPowerW: number
}

/**
 * Compute slipstream-induced interference drag.
 *
 * Returns zero added drag when thrust is zero (gliding / engine-off).
 */
export function slipstreamInterferenceDrag(input: SlipstreamInput): SlipstreamResult {
  if (input.thrustN <= 0) {
    return {
      slipstreamVelocityMs: input.freestreamVelocityMs,
      dynamicPressureRatio: 1,
      addedDragN:           0,
      addedPowerW:          0,
    }
  }

  const n      = input.motorCount ?? 1
  const radius = input.propDiameterM / 2
  const aDisk  = Math.PI * radius * radius * n      // total disk area
  const vInf   = input.freestreamVelocityMs
  const rho    = input.density

  // Fully-developed slipstream velocity (actuator disk theory)
  const vSlip = Math.sqrt(vInf * vInf + (2 * input.thrustN) / (rho * aDisk))

  const qInf  = 0.5 * rho * vInf  * vInf
  const qSlip = 0.5 * rho * vSlip * vSlip
  const qRatio = qInf > 0 ? qSlip / qInf : 0

  const addedDragN  = (qSlip - qInf) * input.wettedAreaM2 * input.skinFrictionCoeff
  const addedPowerW = addedDragN * vInf

  return {
    slipstreamVelocityMs: +vSlip.toFixed(3),
    dynamicPressureRatio: +qRatio.toFixed(4),
    addedDragN:           +addedDragN.toFixed(4),
    addedPowerW:          +addedPowerW.toFixed(3),
  }
}
