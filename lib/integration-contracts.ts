type Brand<T, B extends string> = T & { readonly __brand: B }

export type Grams = Brand<number, 'Grams'>
export type Ratio = Brand<number, 'Ratio'>

export type IntegrationState = {
  frameWeightG: number
  batteryCellWeightG: number
  batteryCells: number
  batteryCapacityMah: number
  batteryVoltageV: number
  motorWeightG: number
  motorCount: number
  payloadG: number
  maxThrustG: number
  hoverCurrentA: number
  flightTime80Min: number
  updatedAt: number
}

export type IntegrationSummary = {
  totalWeightG: Grams
  twr: Ratio
  lowPowerToWeight: boolean
  warning: string | null
}

export const INTEGRATION_DEFAULTS: IntegrationState = {
  frameWeightG: 900,
  batteryCellWeightG: 65,
  batteryCells: 4,
  batteryCapacityMah: 5000,
  batteryVoltageV: 14.8,
  motorWeightG: 90,
  motorCount: 4,
  payloadG: 0,
  maxThrustG: 6000,
  hoverCurrentA: 20,
  flightTime80Min: 0,
  updatedAt: 0,
}

function finite(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) return fallback
  return value
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function sanitizeIntegrationState(draft: IntegrationState): IntegrationState {
  return {
    frameWeightG: clamp(finite(draft.frameWeightG, INTEGRATION_DEFAULTS.frameWeightG), 0, 30000),
    batteryCellWeightG: clamp(finite(draft.batteryCellWeightG, INTEGRATION_DEFAULTS.batteryCellWeightG), 1, 1000),
    batteryCells: Math.round(clamp(finite(draft.batteryCells, INTEGRATION_DEFAULTS.batteryCells), 1, 14)),
    batteryCapacityMah: clamp(finite(draft.batteryCapacityMah, INTEGRATION_DEFAULTS.batteryCapacityMah), 1, 100000),
    batteryVoltageV: clamp(finite(draft.batteryVoltageV, INTEGRATION_DEFAULTS.batteryVoltageV), 1, 70),
    motorWeightG: clamp(finite(draft.motorWeightG, INTEGRATION_DEFAULTS.motorWeightG), 1, 2000),
    motorCount: Math.round(clamp(finite(draft.motorCount, INTEGRATION_DEFAULTS.motorCount), 1, 12)),
    payloadG: clamp(finite(draft.payloadG, INTEGRATION_DEFAULTS.payloadG), 0, 50000),
    maxThrustG: clamp(finite(draft.maxThrustG, INTEGRATION_DEFAULTS.maxThrustG), 1, 200000),
    hoverCurrentA: clamp(finite(draft.hoverCurrentA, INTEGRATION_DEFAULTS.hoverCurrentA), 0, 500),
    flightTime80Min: clamp(finite(draft.flightTime80Min, INTEGRATION_DEFAULTS.flightTime80Min), 0, 240),
    updatedAt: finite(draft.updatedAt, Date.now()),
  }
}

export function computeTotalWeightG(state: IntegrationState): Grams {
  const safe = sanitizeIntegrationState(state)
  const total =
    safe.frameWeightG +
    safe.batteryCellWeightG * safe.batteryCells +
    safe.motorWeightG * safe.motorCount +
    safe.payloadG
  return total as Grams
}

export function computeTwr(state: IntegrationState): Ratio {
  const safe = sanitizeIntegrationState(state)
  const totalWeight = computeTotalWeightG(safe)
  if (totalWeight <= 0) return 0 as Ratio
  return (safe.maxThrustG / totalWeight) as Ratio
}

export function summarizeIntegration(state: IntegrationState): IntegrationSummary {
  const safe = sanitizeIntegrationState(state)
  const totalWeightG = computeTotalWeightG(safe)
  const twr = computeTwr(safe)
  const lowPowerToWeight = totalWeightG > safe.maxThrustG * 0.8

  return {
    totalWeightG,
    twr,
    lowPowerToWeight,
    warning: lowPowerToWeight ? 'Critical Warning: Low Power-to-Weight' : null,
  }
}

export function estimateFlightTimeAt80DoD(params: {
  batteryCapacityMah: number
  hoverCurrentA: number
}): number {
  const batteryCapacityMah = clamp(finite(params.batteryCapacityMah, 0), 0, 100000)
  const hoverCurrentA = clamp(finite(params.hoverCurrentA, 0), 0, 500)
  if (batteryCapacityMah <= 0 || hoverCurrentA <= 0) return 0
  return ((batteryCapacityMah / 1000) * 0.8 / hoverCurrentA) * 60
}
