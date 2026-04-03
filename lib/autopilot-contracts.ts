import { type InterceptInput } from '@/lib/interception'
import { type GlideInput } from '@/lib/glide-footprint'

type Brand<T, B extends string> = T & { readonly __brand: B }

export type DistanceM = Brand<number, 'DistanceM'>
export type SpeedMs = Brand<number, 'SpeedMs'>
export type AngleDeg = Brand<number, 'AngleDeg'>
export type DurationS = Brand<number, 'DurationS'>
export type AltitudeM = Brand<number, 'AltitudeM'>
export type LiftToDragRatio = Brand<number, 'LiftToDragRatio'>

export type InterceptDraft = {
  targetDistanceM: number
  targetSpeedMs: number
  targetHeadingDeg: number
  interceptorSpeedMs: number
  maxFlightTimeS: number
}

export type GlideDraft = {
  altitudeAglM: number
  bestGlideSpeedMs: number
  maxLdRatio: number
  windSpeedMs: number
}

function asFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) return fallback
  return value
}

function finiteClamped(value: unknown, fallback: number, min: number, max = Number.POSITIVE_INFINITY): number {
  const base = asFiniteNumber(value, fallback)
  return Math.min(max, Math.max(min, base))
}

export function mapInterceptDraftToInput(draft: InterceptDraft, defaults: InterceptDraft): InterceptInput {
  const targetDistanceM = finiteClamped(draft.targetDistanceM, defaults.targetDistanceM, 1) as DistanceM
  const targetSpeedMs = finiteClamped(draft.targetSpeedMs, defaults.targetSpeedMs, 0) as SpeedMs
  const targetHeadingDeg = finiteClamped(draft.targetHeadingDeg, defaults.targetHeadingDeg, 0, 180) as AngleDeg
  const interceptorSpeedMs = finiteClamped(draft.interceptorSpeedMs, defaults.interceptorSpeedMs, 1) as SpeedMs
  const maxFlightTimeS = finiteClamped(draft.maxFlightTimeS, defaults.maxFlightTimeS, 1) as DurationS

  return {
    targetDistanceM,
    targetSpeedMs,
    targetHeadingDeg,
    interceptorSpeedMs,
    maxFlightTimeS,
  }
}

export function mapGlideDraftToInput(draft: GlideDraft, defaults: GlideDraft): GlideInput {
  const altitudeAglM = finiteClamped(draft.altitudeAglM, defaults.altitudeAglM, 1) as AltitudeM
  const bestGlideSpeedMs = finiteClamped(draft.bestGlideSpeedMs, defaults.bestGlideSpeedMs, 1) as SpeedMs
  const maxLdRatio = finiteClamped(draft.maxLdRatio, defaults.maxLdRatio, 1) as LiftToDragRatio
  const windSpeedMs = finiteClamped(draft.windSpeedMs, defaults.windSpeedMs, 0) as SpeedMs

  return {
    altitudeAglM,
    bestGlideSpeedMs,
    maxLdRatio,
    windSpeedMs,
  }
}

export function mergeDraftNumber<T extends object, K extends keyof T>(
  prev: T,
  key: K,
  next: unknown,
): T {
  if (typeof next !== 'number' || Number.isNaN(next) || !Number.isFinite(next)) return prev
  return { ...prev, [key]: next }
}
