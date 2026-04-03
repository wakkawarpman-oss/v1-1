type Brand<T, B extends string> = T & { readonly __brand: B }

export type MotorKV = Brand<number, 'MotorKV'>
export type ResistanceOhms = Brand<number, 'ResistanceOhms'>
export type CurrentAmps = Brand<number, 'CurrentAmps'>
export type Inches = Brand<number, 'Inches'>
export type ThrustGrams = Brand<number, 'ThrustGrams'>
export type EfficiencyGW = Brand<number, 'EfficiencyGW'>

export type MotorDraft = {
  kv: number
  riOhms: number
  i0A: number
  escMaxAmps: number
  statorDiameterMm: number
}

export type PropDraft = {
  diameterIn: number
  pitchIn: number
  bladeCount: number
}

export type MotorInput = {
  kv: MotorKV
  riOhms: ResistanceOhms
  i0A: CurrentAmps
  escMaxAmps: CurrentAmps
  statorDiameterMm: number
}

export type PropInput = {
  diameterIn: Inches
  pitchIn: Inches
  bladeCount: number
}

export const PROPULSION_LIMITS = {
  kvMin: 100,
  kvMax: 4500,
  riMin: 0.001,
  riMax: 2,
  i0Min: 0,
  i0Max: 20,
  escAmin: 1,
  escAmax: 400,
  statorMmMin: 8,
  statorMmMax: 120,
  diameterInMin: 1,
  diameterInMax: 50,
  pitchInMin: 1,
  pitchInMax: 20,
  bladeMin: 2,
  bladeMax: 6,
} as const

function asFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) return fallback
  return value
}

function finiteClamped(value: unknown, fallback: number, min: number, max = Number.POSITIVE_INFINITY): number {
  const base = asFiniteNumber(value, fallback)
  return Math.min(max, Math.max(min, base))
}

export function mapMotorDraftToInput(draft: MotorDraft, defaults: MotorDraft): MotorInput {
  return {
    kv: finiteClamped(draft.kv, defaults.kv, PROPULSION_LIMITS.kvMin, PROPULSION_LIMITS.kvMax) as MotorKV,
    riOhms: finiteClamped(draft.riOhms, defaults.riOhms, PROPULSION_LIMITS.riMin, PROPULSION_LIMITS.riMax) as ResistanceOhms,
    i0A: finiteClamped(draft.i0A, defaults.i0A, PROPULSION_LIMITS.i0Min, PROPULSION_LIMITS.i0Max) as CurrentAmps,
    escMaxAmps: finiteClamped(
      draft.escMaxAmps,
      defaults.escMaxAmps,
      PROPULSION_LIMITS.escAmin,
      PROPULSION_LIMITS.escAmax,
    ) as CurrentAmps,
    statorDiameterMm: finiteClamped(
      draft.statorDiameterMm,
      defaults.statorDiameterMm,
      PROPULSION_LIMITS.statorMmMin,
      PROPULSION_LIMITS.statorMmMax,
    ),
  }
}

export function mapPropDraftToInput(draft: PropDraft, defaults: PropDraft): PropInput {
  return {
    diameterIn: finiteClamped(
      draft.diameterIn,
      defaults.diameterIn,
      PROPULSION_LIMITS.diameterInMin,
      PROPULSION_LIMITS.diameterInMax,
    ) as Inches,
    pitchIn: finiteClamped(
      draft.pitchIn,
      defaults.pitchIn,
      PROPULSION_LIMITS.pitchInMin,
      PROPULSION_LIMITS.pitchInMax,
    ) as Inches,
    bladeCount: Math.round(
      finiteClamped(draft.bladeCount, defaults.bladeCount, PROPULSION_LIMITS.bladeMin, PROPULSION_LIMITS.bladeMax),
    ),
  }
}

export function mergeDraftNumber<T extends object, K extends keyof T>(prev: T, key: K, next: unknown): T {
  if (typeof next !== 'number' || Number.isNaN(next) || !Number.isFinite(next)) return prev
  return { ...prev, [key]: next }
}
