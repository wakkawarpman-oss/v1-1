const POWER_CHAIN_LOSS = {
  wiringEfficiency: 0.97,
  escEfficiency: 0.96,
  conservativeBuffer: 0.94,
} as const

const CURRENT_LIMITS = {
  criticalA: 35,
  overloadPenaltySlope: 0.08,
  overloadPenaltyCap: 0.25,
} as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0
}

export type FlightTimeEstimate = {
  flightTimeMin: number
  effectiveUsableMah: number
  conservativeFactor: number
}

export function estimateConservativeFlightTime(params: {
  totalMah: number
  avgCurrentA: number
  usablePct: number
  reservePct: number
}): FlightTimeEstimate {
  const { totalMah, avgCurrentA, usablePct, reservePct } = params
  if (!isPositive(totalMah) || !isPositive(avgCurrentA)) {
    return { flightTimeMin: 0, effectiveUsableMah: 0, conservativeFactor: 0 }
  }

  const usableFraction = clamp(usablePct / 100, 0, 1)
  const reserveFraction = clamp(reservePct / 100, 0, 1)
  const dischargeFraction = Math.max(0, usableFraction - reserveFraction)
  const conservativeFactor =
    POWER_CHAIN_LOSS.wiringEfficiency *
    POWER_CHAIN_LOSS.escEfficiency *
    POWER_CHAIN_LOSS.conservativeBuffer

  const effectiveUsableMah = totalMah * dischargeFraction * conservativeFactor
  const flightTimeMin = (effectiveUsableMah / 1000 / avgCurrentA) * 60

  return {
    flightTimeMin,
    effectiveUsableMah,
    conservativeFactor,
  }
}

export type RemainingEstimate = {
  remainingMah: number
  remainingPct: number
  timeRemainingMin: number
  usedMah: number
}

export function estimateBatteryRemaining(params: {
  totalMah: number
  avgCurrentA: number
  elapsedMinutes: number
  criticalCurrentA?: number
}): RemainingEstimate {
  const { totalMah, avgCurrentA, elapsedMinutes, criticalCurrentA = CURRENT_LIMITS.criticalA } = params
  if (!isPositive(totalMah)) {
    return { remainingMah: 0, remainingPct: 0, timeRemainingMin: 0, usedMah: 0 }
  }

  const elapsedH = Math.max(0, elapsedMinutes) / 60
  const baseUsedMah = Math.max(0, avgCurrentA) * elapsedH * 1000

  const overload = avgCurrentA > criticalCurrentA
    ? (avgCurrentA - criticalCurrentA) / Math.max(1, criticalCurrentA)
    : 0
  const penalty = 1 + clamp(overload * CURRENT_LIMITS.overloadPenaltySlope, 0, CURRENT_LIMITS.overloadPenaltyCap)

  const usedMah = baseUsedMah * penalty
  const remainingMah = Math.max(0, totalMah - usedMah)
  const remainingPct = (remainingMah / totalMah) * 100
  const timeRemainingMin = avgCurrentA > 0 ? (remainingMah / 1000 / avgCurrentA) * 60 : 0

  return {
    remainingMah,
    remainingPct,
    timeRemainingMin,
    usedMah,
  }
}
