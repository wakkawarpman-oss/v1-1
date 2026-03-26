/**
 * Forced-convection cooling for UAV electronics (ESC, motor, FPV TX).
 *
 * Components inside a sealed fuselage dissipate heat equal to their power
 * losses. Ram-air cooling through a NACA duct (or equivalent aperture) removes
 * this heat by heating the incoming airflow:
 *
 *   Q_loss = P_in · (1 − η)                      [W]
 *   ṁ_req  = Q_loss / (c_p · ΔT)                 [kg/s]
 *   A_req  = ṁ_req  / (ρ · V · η_duct)           [m²]
 *
 * Use case: given cruising speed, ambient temperature, and component efficiency,
 * find the minimum duct opening area to keep the component below its thermal limit.
 *
 * Scale check: 25 W loss at 20 m/s cruise with ΔT = 50 °C → A ≈ 0.34 cm²
 * (a 6 × 6 mm slot), which is physically realistic at high airspeed.
 * At 10 m/s the same dissipation requires ≈ 0.68 cm².
 *
 * References:
 *   Incropera & DeWitt (2011) "Fundamentals of Heat and Mass Transfer", §7.1
 *   NASA TN D-1420 (NACA flush-inlet performance data)
 */

export interface ThermalCoolingInput {
  /** Electrical input power to the component, W */
  inputPowerW: number
  /** Thermal efficiency (fraction converted to mechanical work, rest is heat).
   *  ESC: 0.93–0.97 · Motor: 0.82–0.92 · Video TX: 0.40–0.65 */
  efficiency: number
  /** UAV cruise speed (ram-air velocity at duct inlet), m/s */
  velocityMs: number
  /** Air density at operating altitude, kg/m³ */
  density: number
  /** Ambient (outside) air temperature, °C */
  ambientTempC: number
  /** Maximum allowable component surface temperature, °C */
  maxTempC: number
  /** Duct inlet recovery factor (η_duct). NACA flush inlet: 0.5–0.7. Default 0.6. */
  ductEfficiency?: number
}

export interface ThermalCoolingResult {
  /** Heat that must be dissipated, W */
  heatW: number
  /** Required air mass-flow rate, kg/s */
  massFlowKgS: number
  /** Required duct open area, cm² */
  ductAreaCm2: number
  /** Required duct open area, m² */
  ductAreaM2: number
  /** Temperature rise of cooling air across the component, °C */
  deltaTempC: number
}

/** Specific heat of air at constant pressure, J/(kg·K) */
const CP_AIR = 1005

/**
 * Compute minimum duct area for ram-air cooling of a single heat source.
 *
 * @throws when maxTempC ≤ ambientTempC (no thermal gradient to drive heat flow)
 * @throws when velocityMs ≤ 0 (no ram-air flow possible)
 */
export function requiredDuctArea(input: ThermalCoolingInput): ThermalCoolingResult {
  if (input.maxTempC <= input.ambientTempC) {
    throw new RangeError(
      `maxTempC (${input.maxTempC} °C) must be greater than ambientTempC (${input.ambientTempC} °C)`,
    )
  }
  if (input.velocityMs <= 0) {
    throw new RangeError('velocityMs must be > 0 for ram-air cooling')
  }

  const etaDuct  = input.ductEfficiency ?? 0.6
  const deltaT   = input.maxTempC - input.ambientTempC
  const heatW    = input.inputPowerW * (1 - input.efficiency)

  const massFlow = heatW / (CP_AIR * deltaT)
  const areaM2   = massFlow / (input.density * input.velocityMs * etaDuct)
  const areaCm2  = areaM2 * 10_000

  return {
    heatW:        +heatW.toFixed(2),
    massFlowKgS:  +massFlow.toFixed(6),
    ductAreaM2:   +areaM2.toFixed(7),
    ductAreaCm2:  +areaCm2.toFixed(3),
    deltaTempC:   deltaT,
  }
}

/**
 * Total heat load from multiple components sharing the same airflow path.
 */
export function totalHeatLoad(components: Array<{ inputPowerW: number; efficiency: number }>): number {
  return components.reduce((sum, c) => sum + c.inputPowerW * (1 - c.efficiency), 0)
}
