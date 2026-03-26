// ── Mission Planning Calculators ──────────────────────────────────────────

export type EnduranceResult = {
  flightTimeMin: number
  maxRangeKm: number
  tacticalRadiusKm: number // one-way with reserve
}

/** Endurance & range from battery + avg current + speed */
export function missionEndurance(params: {
  batteryMah: number
  avgCurrentA: number
  speedKmh: number
  usablePct: number   // % of battery usable (e.g. 80)
  reservePct: number  // % kept as return reserve (e.g. 20)
}): EnduranceResult {
  const { batteryMah, avgCurrentA, speedKmh, usablePct, reservePct } = params
  if (batteryMah <= 0 || avgCurrentA <= 0 || speedKmh <= 0) {
    return { flightTimeMin: 0, maxRangeKm: 0, tacticalRadiusKm: 0 }
  }
  const usableMah = batteryMah * (usablePct / 100)
  const flightTimeH = usableMah / 1000 / avgCurrentA
  const flightTimeMin = flightTimeH * 60
  const maxRangeKm = speedKmh * flightTimeH

  // Transit budget = usable − reserve (both as % of total battery, not compounded)
  const reserveMah = batteryMah * (reservePct / 100)
  const transitMah = Math.max(0, usableMah - reserveMah)
  const transitH = transitMah / 1000 / avgCurrentA
  const totalTransitKm = speedKmh * transitH
  const tacticalRadiusKm = totalTransitKm / 2 // out + back

  return { flightTimeMin, maxRangeKm, tacticalRadiusKm }
}

export type RouteBudgetResult = {
  usedPct: number
  timeMin: number
  remainingMah: number
  reserveMah: number
  isFeasible: boolean
}

/** Battery budget for a specific one-way route distance */
export function routeBatteryBudget(params: {
  distanceKm: number
  speedKmh: number
  avgCurrentA: number
  batteryMah: number
  reservePct: number
}): RouteBudgetResult {
  const { distanceKm, speedKmh, avgCurrentA, batteryMah, reservePct } = params
  if (distanceKm <= 0 || speedKmh <= 0 || avgCurrentA <= 0 || batteryMah <= 0) {
    return { usedPct: 0, timeMin: 0, remainingMah: batteryMah, reserveMah: batteryMah * reservePct / 100, isFeasible: false }
  }
  const timeH = distanceKm / speedKmh
  const timeMin = timeH * 60
  const usedMah = avgCurrentA * timeH * 1000
  const usedPct = (usedMah / batteryMah) * 100
  const remainingMah = batteryMah - usedMah
  const reserveMah = batteryMah * (reservePct / 100)
  const isFeasible = remainingMah >= reserveMah
  return { usedPct, timeMin, remainingMah: Math.max(0, remainingMah), reserveMah, isFeasible }
}

export type TacticalRadiusResult = {
  oneWayKm: number
  totalRangeKm: number
}

/** Max one-way range with loiter time at target and return reserve */
export function tacticalRadius(params: {
  batteryMah: number
  cruiseCurrentA: number
  hoverCurrentA: number
  speedKmh: number
  reservePct: number
  loiterMin: number
}): TacticalRadiusResult {
  const { batteryMah, cruiseCurrentA, hoverCurrentA, speedKmh, reservePct, loiterMin } = params
  if (batteryMah <= 0 || cruiseCurrentA <= 0 || speedKmh <= 0) {
    return { oneWayKm: 0, totalRangeKm: 0 }
  }
  const availMah = batteryMah * (1 - reservePct / 100)
  const loiterMah = hoverCurrentA * (loiterMin / 60) * 1000
  const transitMah = availMah - loiterMah
  if (transitMah <= 0) return { oneWayKm: 0, totalRangeKm: 0 }

  const oneWayMah = transitMah / 2
  const oneWayH = oneWayMah / 1000 / cruiseCurrentA
  const oneWayKm = speedKmh * oneWayH
  return { oneWayKm, totalRangeKm: oneWayKm * 2 }
}

// ── Time on Target (ETA) ──────────────────────────────────────────────────────
// Minutes from departure until reaching a waypoint at constant ground speed.
export function timeOnTarget(params: {
  distanceKm: number
  groundSpeedKmh: number
}): number {
  if (params.distanceKm <= 0 || params.groundSpeedKmh <= 0) return 0
  return (params.distanceKm / params.groundSpeedKmh) * 60
}

// ── Battery Remaining Estimate ────────────────────────────────────────────────
// In-flight estimate of remaining charge from elapsed time and average draw.
export type BatteryRemainingResult = {
  remainingMah: number
  remainingPct: number
  timeRemainingMin: number
}

export function batteryRemainingEst(params: {
  totalMah: number
  avgCurrentA: number
  elapsedMinutes: number
}): BatteryRemainingResult {
  const { totalMah, avgCurrentA, elapsedMinutes } = params
  if (totalMah <= 0) return { remainingMah: 0, remainingPct: 0, timeRemainingMin: 0 }
  const usedMah = avgCurrentA * (elapsedMinutes / 60) * 1000
  const remainingMah = Math.max(0, totalMah - usedMah)
  const remainingPct = (remainingMah / totalMah) * 100
  const timeRemainingMin = avgCurrentA > 0 ? (remainingMah / 1000 / avgCurrentA) * 60 : 0
  return { remainingMah, remainingPct, timeRemainingMin }
}

// ── Loiter Budget at Target ───────────────────────────────────────────────────
// Maximum hovering/loitering time over a target after accounting for transit
// energy (there + back) and the mandatory return reserve.
export type LoiterBudgetResult = {
  transitUsedMah: number
  loiterAvailableMah: number
  loiterTimeMin: number
  isFeasible: boolean
}

export function loiterBudgetAtTarget(params: {
  batteryMah: number
  transitCurrentA: number
  outboundKm: number
  speedKmh: number
  hoverCurrentA: number
  inboundKm: number
  reservePct: number
}): LoiterBudgetResult {
  const { batteryMah, transitCurrentA, outboundKm, speedKmh, hoverCurrentA, inboundKm, reservePct } = params
  if (batteryMah <= 0 || transitCurrentA <= 0 || speedKmh <= 0) {
    return { transitUsedMah: 0, loiterAvailableMah: 0, loiterTimeMin: 0, isFeasible: false }
  }
  const reserveMah = batteryMah * (reservePct / 100)
  const transitUsedMah = ((outboundKm + inboundKm) / speedKmh) * transitCurrentA * 1000
  const loiterAvailableMah = Math.max(0, batteryMah - transitUsedMah - reserveMah)
  const loiterTimeMin = hoverCurrentA > 0 ? (loiterAvailableMah / 1000 / hoverCurrentA) * 60 : 0
  return { transitUsedMah, loiterAvailableMah, loiterTimeMin, isFeasible: loiterAvailableMah > 0 }
}

// ── Wind-Adjusted PNR ─────────────────────────────────────────────────────────
// Uses the simplified headwind projection to compute outbound / homebound GS,
// then applies the standard PNR formula.
export type WindPNRResult = {
  gsOutboundKmh: number
  gsHomeboundKmh: number
  maxDistanceKm: number
  timeToTurnMinutes: number
}

export function windAdjustedPNR(params: {
  safeEnduranceHours: number
  tasKmh: number
  windSpeedKmh: number
  windFromDeg: number
  outboundTrackDeg: number
}): WindPNRResult {
  const { safeEnduranceHours, tasKmh, windSpeedKmh, windFromDeg, outboundTrackDeg } = params
  if (safeEnduranceHours <= 0 || tasKmh <= 0) {
    return { gsOutboundKmh: 0, gsHomeboundKmh: 0, maxDistanceKm: 0, timeToTurnMinutes: 0 }
  }
  const toRad = (d: number) => (d * Math.PI) / 180
  const relOut = toRad(((windFromDeg - outboundTrackDeg) % 360 + 360) % 360)
  const gsOutboundKmh = Math.max(1, tasKmh - windSpeedKmh * Math.cos(relOut))
  const inboundTrackDeg = (outboundTrackDeg + 180) % 360
  const relHome = toRad(((windFromDeg - inboundTrackDeg) % 360 + 360) % 360)
  const gsHomeboundKmh = Math.max(1, tasKmh - windSpeedKmh * Math.cos(relHome))
  const maxDistanceKm = safeEnduranceHours * ((gsOutboundKmh * gsHomeboundKmh) / (gsOutboundKmh + gsHomeboundKmh))
  return { gsOutboundKmh, gsHomeboundKmh, maxDistanceKm, timeToTurnMinutes: (maxDistanceKm / gsOutboundKmh) * 60 }
}

// ── Multi-Leg Route Feasibility ───────────────────────────────────────────────
export type LegResult = {
  legIndex: number
  distanceKm: number
  timeMin: number
  usedMah: number
  cumulativeUsedMah: number
  feasible: boolean
}

export function multiLegFeasibility(params: {
  legs: Array<{ distanceKm: number; speedKmh: number; avgCurrentA: number }>
  batteryMah: number
  reservePct: number
}): LegResult[] {
  const { legs, batteryMah, reservePct } = params
  const reserveMah = batteryMah * (reservePct / 100)
  let cumulativeMah = 0
  return legs.map((leg, i) => {
    const timeH = leg.speedKmh > 0 ? leg.distanceKm / leg.speedKmh : 0
    const usedMah = leg.avgCurrentA * timeH * 1000
    cumulativeMah += usedMah
    return {
      legIndex: i + 1,
      distanceKm: leg.distanceKm,
      timeMin: timeH * 60,
      usedMah,
      cumulativeUsedMah: cumulativeMah,
      feasible: cumulativeMah <= batteryMah - reserveMah,
    }
  })
}
