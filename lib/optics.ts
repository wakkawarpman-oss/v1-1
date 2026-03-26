// ── Optics & Reconnaissance Calculators ──────────────────────────────────────
// GSD, FOV, camera footprint, static margin, and Point of No Return.

function isPositive(value: number) {
  return Number.isFinite(value) && value > 0
}

// ── Ground Sample Distance (GSD) ─────────────────────────────────────────────
// GSD = (altitude_m × 100 × sensorWidth_mm) / (focalLength_mm × imageWidth_px)
// Result in cm/pixel. Lower = sharper imagery.
export function gsd(params: {
  altitudeM: number
  sensorWidthMm: number
  focalLengthMm: number
  imageWidthPx: number
}): number {
  const { altitudeM, sensorWidthMm, focalLengthMm, imageWidthPx } = params
  if (!isPositive(altitudeM) || !isPositive(sensorWidthMm) || !isPositive(focalLengthMm) || !isPositive(imageWidthPx)) return 0
  return (altitudeM * 100 * sensorWidthMm) / (focalLengthMm * imageWidthPx)
}

// ── Field of View ─────────────────────────────────────────────────────────────
// FOV = 2 × atan(sensorDimension / (2 × focalLength))  in degrees
export function fovDeg(sensorDimensionMm: number, focalLengthMm: number): number {
  if (!isPositive(sensorDimensionMm) || !isPositive(focalLengthMm)) return 0
  return (2 * Math.atan(sensorDimensionMm / (2 * focalLengthMm)) * 180) / Math.PI
}

// ── Camera Ground Footprint ───────────────────────────────────────────────────
// Width of scene covered on the ground: footprint = 2 × h × tan(FOV/2)
export type FootprintResult = {
  widthM: number
  heightM: number
  areaM2: number
}

export function cameraFootprint(params: {
  altitudeM: number
  hFovDeg: number
  vFovDeg: number
}): FootprintResult {
  const { altitudeM, hFovDeg, vFovDeg } = params
  if (!isPositive(altitudeM) || !isPositive(hFovDeg) || !isPositive(vFovDeg)) {
    return { widthM: 0, heightM: 0, areaM2: 0 }
  }
  const widthM  = 2 * altitudeM * Math.tan((hFovDeg * Math.PI) / 180 / 2)
  const heightM = 2 * altitudeM * Math.tan((vFovDeg * Math.PI) / 180 / 2)
  return { widthM, heightM, areaM2: widthM * heightM }
}

// ── Known camera sensor sizes ─────────────────────────────────────────────────
export type SensorPreset = { id: string; label: string; widthMm: number; heightMm: number }

export const SENSOR_PRESETS: SensorPreset[] = [
  { id: '1-2.3', label: '1/2.3" (DJI Mini / Mavic 3)',          widthMm: 6.17,  heightMm: 4.56  },
  { id: '1-1.7', label: '1/1.7" (DJI Air 3)',                    widthMm: 7.53,  heightMm: 5.64  },
  { id: '4-3',   label: '4/3" (DJI Mavic 3 / Autel EVO II)',     widthMm: 17.3,  heightMm: 13   },
  { id: 'aps-c', label: 'APS-C (Sony alpha / Canon M)',           widthMm: 23.5,  heightMm: 15.6  },
  { id: 'full',  label: 'Full-frame 35 mm',                       widthMm: 36,    heightMm: 24   },
  { id: 'custom',label: 'Власний розмір',                         widthMm: 6.17,  heightMm: 4.56  },
]

// ── Point of No Return (E6B / PNR) ───────────────────────────────────────────
// Safe Endurance model: total available flight time minus reserve for contingency.
// PNR formula (derived from time budget):
//   d_PNR = SE × (GS_out × GS_home) / (GS_out + GS_home)
// Where SE = safe endurance in hours, GS = ground speed km/h.
export type PNRResult = {
  maxDistanceKm: number       // distance along track to PNR
  timeToTurnMinutes: number   // time from takeoff until reaching PNR
  timeHomingMinutes: number   // time from PNR back to base
}

export function pointOfNoReturn(params: {
  safeEnduranceHours: number
  gsOutboundKmh: number
  gsHomeboundKmh: number
}): PNRResult {
  const { safeEnduranceHours, gsOutboundKmh, gsHomeboundKmh } = params
  if (
    !isPositive(safeEnduranceHours) ||
    !isPositive(gsOutboundKmh) ||
    !isPositive(gsHomeboundKmh)
  ) {
    return { maxDistanceKm: 0, timeToTurnMinutes: 0, timeHomingMinutes: 0 }
  }
  const maxDistanceKm = safeEnduranceHours * ((gsOutboundKmh * gsHomeboundKmh) / (gsOutboundKmh + gsHomeboundKmh))
  const timeToTurnMinutes = (maxDistanceKm / gsOutboundKmh) * 60
  const timeHomingMinutes = (maxDistanceKm / gsHomeboundKmh) * 60
  return { maxDistanceKm, timeToTurnMinutes, timeHomingMinutes }
}

// ── Fresnel Zone Radius ───────────────────────────────────────────────────────
// Radius of first Fresnel zone at mid-path:
//   R1 = 17.32 × sqrt(d_km / (4 × f_GHz))  [metres]
// 60% clearance rule: the path must be clear of obstructions by at least 0.6 × R1
// to prevent significant signal diffraction loss.
export function fresnelZone(params: {
  distanceKm: number
  frequencyGHz: number
}): { radiusM: number; minClearanceM: number } {
  const { distanceKm, frequencyGHz } = params
  if (!isPositive(distanceKm) || !isPositive(frequencyGHz)) return { radiusM: 0, minClearanceM: 0 }
  const radiusM = 17.32 * Math.sqrt(distanceKm / (4 * frequencyGHz))
  return { radiusM, minClearanceM: radiusM * 0.6 }
}

// ── Antenna Length ────────────────────────────────────────────────────────────
// velocity factor 0.95 for copper wire dipoles.
export type AntennaLengths = {
  fullWaveMm: number
  halfWaveMm: number     // dipole total length
  quarterWaveMm: number  // quarter-wave vertical / monopole
}

export function antennaLengths(frequencyMHz: number, velocityFactor = 0.95): AntennaLengths {
  if (!isPositive(frequencyMHz)) return { fullWaveMm: 0, halfWaveMm: 0, quarterWaveMm: 0 }
  const lambdaM = (299.792 / frequencyMHz) * velocityFactor
  return {
    fullWaveMm:    lambdaM * 1000,
    halfWaveMm:    (lambdaM / 2) * 1000,
    quarterWaveMm: (lambdaM / 4) * 1000,
  }
}

// ── IMD Conflict Matrix ───────────────────────────────────────────────────────
// Third-order products: 2×F1 – F2 and 2×F2 – F1.
// Returns list of conflicting frequency triplets.
export type IMDConflict = {
  f1MHz: number
  f2MHz: number
  product3rdMHz: number
  conflictsWith: number  // the active channel being jammed
}

export function imdConflictMatrix(activeFreqsMHz: number[]): IMDConflict[] {
  const conflicts: IMDConflict[] = []
  const freqs = [...activeFreqsMHz]
  for (let i = 0; i < freqs.length; i++) {
    for (let j = 0; j < freqs.length; j++) {
      if (i === j) continue
      const f1 = freqs[i]
      const f2 = freqs[j]
      const imd = 2 * f1 - f2
      const hit = freqs.find((f) => f !== f1 && f !== f2 && Math.abs(f - imd) < 1)
      if (hit !== undefined) {
        conflicts.push({ f1MHz: f1, f2MHz: f2, product3rdMHz: Number(imd.toFixed(1)), conflictsWith: hit })
      }
    }
  }
  return conflicts
}

// ── Full Link Budget ──────────────────────────────────────────────────────────
// FSPL_dB = 20log10(d_km) + 20log10(f_MHz) + 32.44
// Received power = TxPower + TxGain + RxGain – FSPL
// Link margin = ReceivedPower – RxSensitivity  (must be > 0, aim for >12 dB)
export type LinkBudgetResult = {
  fsplDb: number
  receivedPowerDbm: number
  linkMarginDb: number
  viable: boolean
}

export function linkBudget(params: {
  txPowerDbm: number
  txGainDbi: number
  rxGainDbi: number
  rxSensitivityDbm: number
  distanceKm: number
  frequencyMHz: number
  systemMarginDb?: number   // extra fade margin to reserve (default 12 dB)
}): LinkBudgetResult {
  const { txPowerDbm, txGainDbi, rxGainDbi, rxSensitivityDbm, distanceKm, frequencyMHz, systemMarginDb = 12 } = params
  if (!isPositive(distanceKm) || !isPositive(frequencyMHz)) {
    return { fsplDb: 0, receivedPowerDbm: 0, linkMarginDb: -999, viable: false }
  }
  const fsplDb = 20 * Math.log10(distanceKm) + 20 * Math.log10(frequencyMHz) + 32.44
  const receivedPowerDbm = txPowerDbm + txGainDbi + rxGainDbi - fsplDb
  const linkMarginDb = receivedPowerDbm - rxSensitivityDbm - systemMarginDb
  return { fsplDb, receivedPowerDbm, linkMarginDb, viable: linkMarginDb > 0 }
}

// ── Max link distance (inverse FSPL) ─────────────────────────────────────────
export function maxLinkDistanceKm(params: {
  txPowerDbm: number
  txGainDbi: number
  rxGainDbi: number
  rxSensitivityDbm: number
  frequencyMHz: number
  systemMarginDb?: number
}): number {
  const { txPowerDbm, txGainDbi, rxGainDbi, rxSensitivityDbm, frequencyMHz, systemMarginDb = 12 } = params
  if (!isPositive(frequencyMHz)) return 0
  const maxFspl = txPowerDbm + txGainDbi + rxGainDbi - rxSensitivityDbm - systemMarginDb
  const distancePow10 = (maxFspl - 20 * Math.log10(frequencyMHz) - 32.44) / 20
  return Math.min(1e6, Math.pow(10, distancePow10)) // cap at 1 000 000 km
}

// ── Detailed Link Budget — EIRP / Eb·N0 ──────────────────────────────────────
export type DetailedLinkResult = {
  eirpDbm: number
  fsplDb: number
  rxPowerDbm: number
  snrDb: number
  marginDb: number
  linkOk: boolean
}

export function detailedLinkBudget(params: {
  txPowerDbm: number
  txGainDbi: number
  txLossDb: number        // cable/connector loss at Tx side
  rxGainDbi: number
  rxLossDb: number
  rxSensitivityDbm: number
  systemNoiseFigureDb: number
  distanceKm: number
  frequencyMHz: number
  additionalLossDb?: number  // rain, vegetation, etc.
}): DetailedLinkResult {
  const {
    txPowerDbm, txGainDbi, txLossDb,
    rxGainDbi, rxLossDb, rxSensitivityDbm,
    systemNoiseFigureDb, distanceKm, frequencyMHz,
    additionalLossDb = 0,
  } = params
  const eirpDbm = txPowerDbm + txGainDbi - txLossDb
  const fsplDb = 20 * Math.log10(distanceKm) + 20 * Math.log10(frequencyMHz) + 32.44
  const rxPowerDbm = eirpDbm - fsplDb + rxGainDbi - rxLossDb - additionalLossDb
  const snrDb = rxPowerDbm - rxSensitivityDbm - systemNoiseFigureDb
  const marginDb = rxPowerDbm - rxSensitivityDbm
  return { eirpDbm, fsplDb, rxPowerDbm, snrDb, marginDb, linkOk: marginDb > 0 }
}
