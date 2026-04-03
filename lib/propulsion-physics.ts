import { airDensity, propCtStatic, staticThrustFromCt } from '@/lib/aero'
import type { EfficiencyGW, MotorInput, PropInput, ThrustGrams } from '@/lib/propulsion-contracts'

export type RiskLevel = 'none' | 'warning' | 'critical'

export type ThrustResult = {
  thrustG: ThrustGrams
  currentA: number
  electricalPowerW: number
  efficiencyGW: EfficiencyGW
  propLoadIndex: number
  tipMach: number
  overheatRisk: RiskLevel
  warnings: string[]
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function estimateCp(prop: PropInput): number {
  const pitchRatio = prop.pitchIn / prop.diameterIn
  const bladeFactor = 1 + 0.08 * (prop.bladeCount - 2)
  return clamp((0.036 + pitchRatio * 0.028) * bladeFactor, 0.02, 0.12)
}

export function computeElectricalPower(voltageV: number, currentA: number): number {
  if (!Number.isFinite(voltageV) || !Number.isFinite(currentA) || voltageV <= 0 || currentA <= 0) return 0
  return voltageV * currentA
}

export function estimateMotorCurrent(params: {
  voltageV: number
  motor: MotorInput
  prop: PropInput
}): number {
  const { voltageV, motor, prop } = params
  if (voltageV <= 0) return 0

  const rho = airDensity(0, 15)
  const nRps = (motor.kv * voltageV * 0.9) / 60
  const diameterM = prop.diameterIn * 0.0254
  const cp = estimateCp(prop)
  const shaftPowerW = cp * rho * nRps ** 3 * diameterM ** 5

  // Conservative electrical conversion: include controller and copper losses.
  const electricalW = shaftPowerW / 0.82
  return Math.max(0, electricalW / voltageV + motor.i0A)
}

export function suggestPropForMotor(params: {
  kv: number
  voltageV: number
  availableProps: ReadonlyArray<{ id: string; diameterIn: number; pitchIn: number }>
}): string | null {
  const { kv, voltageV, availableProps } = params
  if (!availableProps.length || kv <= 0 || voltageV <= 0) return null

  const maxDiameter = clamp(26 - (kv * voltageV) / 280, 5, 22)
  const targetPitchRatio = clamp(0.42 + ((kv < 900 ? 1 : 0) * 0.08), 0.35, 0.62)

  let best: { id: string; score: number } | null = null
  for (const prop of availableProps) {
    if (prop.diameterIn > maxDiameter) continue
    const ratio = prop.pitchIn / prop.diameterIn
    const score = Math.abs(prop.diameterIn - maxDiameter * 0.9) + Math.abs(ratio - targetPitchRatio) * 8
    if (!best || score < best.score) best = { id: prop.id, score }
  }

  return best?.id ?? null
}

function statorCurrentLimitA(statorDiameterMm: number): number {
  return clamp(0.06 * statorDiameterMm ** 2, 12, 180)
}

export function evaluateMotorPropMatch(params: {
  voltageV: number
  motor: MotorInput
  prop: PropInput
  expectedCurrentA: number
}): { overheatRisk: RiskLevel; warnings: string[]; propLoadIndex: number; tipMach: number } {
  const { voltageV, motor, prop, expectedCurrentA } = params
  const warnings: string[] = []

  const bladeFactor = 1 + 0.12 * (prop.bladeCount - 2)
  const propLoadIndex = (motor.kv * voltageV * prop.diameterIn * Math.sqrt(prop.pitchIn) * bladeFactor) / 10000

  const rpm = motor.kv * voltageV * 0.9
  const tipSpeedMs = (rpm / 60) * Math.PI * prop.diameterIn * 0.0254
  const tipMach = tipSpeedMs / 340

  if (propLoadIndex > 12.5) {
    warnings.push('Overload Risk: пропелер завеликий для обраної KV/напруги.')
  }
  if (tipMach > 0.86) {
    warnings.push('Overload Risk: швидкість кінчика лопаті наближається до трансзвуку.')
  }

  const statorLimitA = statorCurrentLimitA(motor.statorDiameterMm)
  const thermalRatio = statorLimitA > 0 ? expectedCurrentA / statorLimitA : 0
  let overheatRisk: RiskLevel = 'none'

  if (thermalRatio >= 1.25 || expectedCurrentA > motor.escMaxAmps * 1.05) {
    overheatRisk = 'critical'
    warnings.push('Overheat Risk: очікуваний струм перевищує безпечний ліміт статора або ESC.')
  } else if (thermalRatio >= 1.0 || expectedCurrentA > motor.escMaxAmps * 0.9) {
    overheatRisk = 'warning'
    warnings.push('Тепловий ризик: струм близький до межі статора/ESC.')
  }

  return { overheatRisk, warnings, propLoadIndex, tipMach }
}

export function computeThrustResult(params: {
  voltageV: number
  motor: MotorInput
  prop: PropInput
}): ThrustResult {
  const { voltageV, motor, prop } = params

  const ct = propCtStatic(prop.diameterIn, prop.pitchIn, prop.bladeCount)
  const thrustG = staticThrustFromCt(ct, airDensity(0, 15), motor.kv * voltageV * 0.9, prop.diameterIn)
  const currentA = estimateMotorCurrent({ voltageV, motor, prop })
  const electricalPowerW = computeElectricalPower(voltageV, currentA)
  const efficiencyGW = electricalPowerW > 0 ? (thrustG / electricalPowerW) as EfficiencyGW : (0 as EfficiencyGW)

  const match = evaluateMotorPropMatch({
    voltageV,
    motor,
    prop,
    expectedCurrentA: currentA,
  })

  return {
    thrustG: Math.max(0, thrustG) as ThrustGrams,
    currentA,
    electricalPowerW,
    efficiencyGW,
    propLoadIndex: match.propLoadIndex,
    tipMach: match.tipMach,
    overheatRisk: match.overheatRisk,
    warnings: match.warnings,
  }
}
