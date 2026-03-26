import { clamp } from '@/lib/aero'

export type WindCorrectionResult = {
  headingDeg: number
  driftDeg: number
  groundSpeedKmh: number
  crosswindKmh: number
  headwindKmh: number
}

export type GreatCircleResult = {
  distanceKm: number
  initialBearingDeg: number
}

export type RhumbLineResult = {
  distanceKm: number
  bearingDeg: number
}

const EARTH_RADIUS_KM = 6371

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI
}

function normalizeDegrees(value: number) {
  const normalized = value % 360
  return normalized >= 0 ? normalized : normalized + 360
}

export function dynamicPressurePa(speedMs: number, densityKgM3 = 1.225) {
  if (speedMs < 0 || densityKgM3 <= 0) return 0
  return 0.5 * densityKgM3 * speedMs ** 2
}

export function reynoldsNumber(params: {
  speedMs: number
  characteristicLengthM: number
  densityKgM3?: number
  dynamicViscosityPaS?: number
}) {
  const densityKgM3 = params.densityKgM3 ?? 1.225
  const dynamicViscosityPaS = params.dynamicViscosityPaS ?? 1.81e-5

  if (
    params.speedMs <= 0 ||
    params.characteristicLengthM <= 0 ||
    densityKgM3 <= 0 ||
    dynamicViscosityPaS <= 0
  ) {
    return 0
  }

  return (densityKgM3 * params.speedMs * params.characteristicLengthM) / dynamicViscosityPaS
}

export function windCorrection(params: {
  trueAirspeedKmh: number
  desiredTrackDeg: number
  windFromDeg: number
  windSpeedKmh: number
}): WindCorrectionResult {
  const relativeRad = toRadians(normalizeDegrees(params.windFromDeg - params.desiredTrackDeg))
  const crosswindKmh = params.windSpeedKmh * Math.sin(relativeRad)
  const headwindKmh = params.windSpeedKmh * Math.cos(relativeRad)
  const ratio = params.trueAirspeedKmh > 0 ? clamp(crosswindKmh / params.trueAirspeedKmh, -1, 1) : 0
  const driftDeg = toDegrees(Math.asin(ratio))
  const headingDeg = normalizeDegrees(params.desiredTrackDeg + driftDeg)
  const crabbedAirspeedKmh = params.trueAirspeedKmh * Math.cos(toRadians(driftDeg))
  const groundSpeedKmh = Math.max(0, crabbedAirspeedKmh - headwindKmh)

  return {
    headingDeg,
    driftDeg,
    groundSpeedKmh,
    crosswindKmh,
    headwindKmh,
  }
}

export function greatCircle(params: {
  fromLatDeg: number
  fromLonDeg: number
  toLatDeg: number
  toLonDeg: number
}): GreatCircleResult {
  const lat1 = toRadians(params.fromLatDeg)
  const lon1 = toRadians(params.fromLonDeg)
  const lat2 = toRadians(params.toLatDeg)
  const lon2 = toRadians(params.toLonDeg)
  const deltaLat = lat2 - lat1
  const deltaLon = lon2 - lon1

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const y = Math.sin(deltaLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon)

  return {
    distanceKm: EARTH_RADIUS_KM * c,
    initialBearingDeg: normalizeDegrees(toDegrees(Math.atan2(y, x))),
  }
}

export function rhumbLine(params: {
  fromLatDeg: number
  fromLonDeg: number
  toLatDeg: number
  toLonDeg: number
}): RhumbLineResult {
  const lat1 = toRadians(params.fromLatDeg)
  const lat2 = toRadians(params.toLatDeg)
  let deltaLon = toRadians(params.toLonDeg - params.fromLonDeg)
  const deltaPhi = Math.log(
    Math.tan(Math.PI / 4 + lat2 / 2) / Math.tan(Math.PI / 4 + lat1 / 2),
  )
  const deltaLat = lat2 - lat1

  if (Math.abs(deltaLon) > Math.PI) {
    deltaLon = deltaLon > 0 ? -(2 * Math.PI - deltaLon) : 2 * Math.PI + deltaLon
  }

  const q = Math.abs(deltaPhi) > 1e-12 ? deltaLat / deltaPhi : Math.cos(lat1)
  const distanceKm = Math.hypot(deltaLat, q * deltaLon) * EARTH_RADIUS_KM
  const bearingDeg = normalizeDegrees(toDegrees(Math.atan2(deltaLon, deltaPhi)))

  return { distanceKm, bearingDeg }
}

// ── E6B Wind Triangle alias ──────────────────────────────────────────────────────
// windCorrection() already provides full E6B wind triangle solution
// (WCA, GS, drift, crosswind, headwind) — re-exporting under mission-planning name.
export const e6bWindTriangle = windCorrection

// ── Point of No Return (E6B / PNR) ───────────────────────────────────────────
// d_PNR = SE × (GS_out × GS_home) / (GS_out + GS_home)
// Time to turn = d_PNR / GS_out
export type PNRNavResult = {
  distanceKm: number
  timeToTurnMin: number
  timeRtbMin: number
}

export function pointOfNoReturn(params: {
  safeEnduranceH: number    // total usable flight time in hours (total minus reserve)
  gsOutKmh: number          // ground speed outbound (with wind factored in)
  gsHomeKmh: number         // ground speed homebound (return leg, into wind)
}): PNRNavResult {
  const { safeEnduranceH, gsOutKmh, gsHomeKmh } = params
  if (safeEnduranceH <= 0 || gsOutKmh <= 0 || gsHomeKmh <= 0) {
    return { distanceKm: 0, timeToTurnMin: 0, timeRtbMin: 0 }
  }
  const distanceKm = safeEnduranceH * ((gsOutKmh * gsHomeKmh) / (gsOutKmh + gsHomeKmh))
  return {
    distanceKm,
    timeToTurnMin: (distanceKm / gsOutKmh) * 60,
    timeRtbMin:    (distanceKm / gsHomeKmh) * 60,
  }
}

// ── Stall Speed ───────────────────────────────────────────────────────────────
// V_s = sqrt(2 × W × n / (ρ × S × Cl_max))
// n = load factor = 1 / cos(bankAngle)
export type StallSpeedResult = {
  stallSpeedMs: number
  stallSpeedKmh: number
  loadFactor: number
}

export function stallSpeed(params: {
  weightKg: number
  wingAreaM2: number
  clMax: number
  bankAngleDeg?: number
  densityKgM3?: number
}): StallSpeedResult {
  const { weightKg, wingAreaM2, clMax, bankAngleDeg = 0, densityKgM3 = 1.225 } = params
  if (weightKg <= 0 || wingAreaM2 <= 0 || clMax <= 0) {
    return { stallSpeedMs: 0, stallSpeedKmh: 0, loadFactor: 1 }
  }
  const bankRad = (bankAngleDeg * Math.PI) / 180
  const loadFactor = bankAngleDeg === 0 ? 1 : 1 / Math.cos(bankRad)
  const weightN = weightKg * 9.80665
  const vStallMs = Math.sqrt((2 * weightN * loadFactor) / (densityKgM3 * wingAreaM2 * clMax))
  return { stallSpeedMs: vStallMs, stallSpeedKmh: vStallMs * 3.6, loadFactor }
}

// ── Turning Radius ────────────────────────────────────────────────────────────
// R = V² / (g × tan(bankAngle))
export function turningRadius(params: {
  speedKmh: number
  bankAngleDeg: number
}): number {
  const { speedKmh, bankAngleDeg } = params
  if (speedKmh <= 0 || bankAngleDeg <= 0 || bankAngleDeg >= 90) return 0
  const speedMs = speedKmh / 3.6
  return speedMs ** 2 / (9.80665 * Math.tan((bankAngleDeg * Math.PI) / 180))
}

// ── Glide Distance ────────────────────────────────────────────────────────────
// Glide range = altitude × L/D ratio
export function glideDistance(params: {
  altitudeM: number
  liftToDragRatio: number
}): number {
  const { altitudeM, liftToDragRatio } = params
  if (altitudeM <= 0 || liftToDragRatio <= 0) return 0
  return altitudeM * liftToDragRatio
}

// ── Propeller Tip Speed (Mach) ────────────────────────────────────────────────
// tip_speed = (RPM / 60) × π × D
// RPM_no_load = KV × V_battery, RPM_loaded ≈ RPM_no_load × efficiency
const SPEED_OF_SOUND_MS = 343.4

export type PropTipSpeedResult = {
  tipSpeedMs: number
  machNumber: number
  isOverLimit: boolean  // true if Mach > 0.85 (transonic losses)
}

export function propTipSpeedMach(params: {
  diameterInches: number
  motorKv: number
  batteryVoltage: number
  loadEfficiencyPct?: number  // loaded RPM as % of no-load RPM (default 80)
}): PropTipSpeedResult {
  const { diameterInches, motorKv, batteryVoltage, loadEfficiencyPct = 80 } = params
  if (diameterInches <= 0 || motorKv <= 0 || batteryVoltage <= 0) {
    return { tipSpeedMs: 0, machNumber: 0, isOverLimit: false }
  }
  const rpm = motorKv * batteryVoltage * (loadEfficiencyPct / 100)
  const tipSpeedMs = (rpm / 60) * Math.PI * (diameterInches * 0.0254)
  const machNumber = tipSpeedMs / SPEED_OF_SOUND_MS
  return { tipSpeedMs, machNumber, isOverLimit: machNumber > 0.85 }
}
// ── Antenna Tracker — Elevation & Azimuth ────────────────────────────────────
// Given GCS position and drone position (lat/lng/alt), returns the azimuth
// and elevation angle the tracker antenna should point to.
export function antennaTracker(params: {
  gcsLat: number; gcsLng: number; gcsAltM: number
  droneLat: number; droneLng: number; droneAltM: number
}): { azimuthDeg: number; elevationDeg: number; slantRangeM: number; groundRangeM: number } {
  const { gcsLat, gcsLng, gcsAltM, droneLat, droneLng, droneAltM } = params
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const lat1 = toRad(gcsLat), lat2 = toRad(droneLat)
  const dLat = toRad(droneLat - gcsLat)
  const dLng = toRad(droneLng - gcsLng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  const groundRangeM = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const dAlt = droneAltM - gcsAltM
  const slantRangeM = Math.hypot(groundRangeM, dAlt)
  const elevationDeg = (Math.atan2(dAlt, groundRangeM) * 180) / Math.PI
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  const azimuthDeg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  return { azimuthDeg, elevationDeg, slantRangeM, groundRangeM }
}
