const EARTH_RADIUS_M = 6_371_000
const EFFECTIVE_RADIUS_STD_M = 8_500_000

function isPositive(value: number) {
  return Number.isFinite(value) && value > 0
}

export function opticalHorizon(heightM: number) {
  if (!isPositive(heightM)) return 0
  return Math.sqrt(2 * EARTH_RADIUS_M * heightM + Math.pow(heightM, 2))
}

export function radioHorizonFull(heightM: number, effectiveRadiusM = EFFECTIVE_RADIUS_STD_M) {
  if (!isPositive(heightM) || !isPositive(effectiveRadiusM)) return 0
  return Math.sqrt(2 * effectiveRadiusM * heightM + Math.pow(heightM, 2))
}

export function radioHorizonSimple(heightM: number) {
  if (!isPositive(heightM)) return 0
  return 4.1 * Math.sqrt(heightM)
}

export function radioHorizonFeet(heightFt: number) {
  if (!isPositive(heightFt)) return 0
  return 1.23 * Math.sqrt(heightFt)
}

export function linkRangeFull(height1M: number, height2M: number, effectiveRadiusM = EFFECTIVE_RADIUS_STD_M) {
  if (!isPositive(height1M) || !isPositive(height2M) || !isPositive(effectiveRadiusM)) return 0
  return Math.sqrt(2 * effectiveRadiusM) * (Math.sqrt(height1M) + Math.sqrt(height2M))
}

export function linkRangeSimple(height1M: number, height2M: number) {
  if (!isPositive(height1M) || !isPositive(height2M)) return 0
  return 4.1 * (Math.sqrt(height1M) + Math.sqrt(height2M))
}

export function effectiveEarthRadius(k = 4 / 3) {
  if (!isPositive(k)) return 0
  return EARTH_RADIUS_M * k
}

export function refractionFactor(dnDh = -40e-9) {
  if (!Number.isFinite(dnDh)) return 0
  const denominator = 1 + EARTH_RADIUS_M * dnDh
  if (denominator === 0) return 0
  return 1 / denominator
}

export function refractiveGradient(deltaN: number, deltaH = 1000) {
  if (!Number.isFinite(deltaN) || !isPositive(deltaH)) return 0
  return -((deltaN / deltaH) * 1e-9)
}

export function nUnits(refractiveIndex: number) {
  if (!Number.isFinite(refractiveIndex)) return 0
  return (refractiveIndex - 1) * 1e6
}

export function refractiveIndex(nUnitsValue: number) {
  if (!Number.isFinite(nUnitsValue)) return 0
  return 1 + nUnitsValue / 1e6
}

export function rayCurvature(dnDh: number, thetaDeg = 0) {
  if (!Number.isFinite(dnDh) || !Number.isFinite(thetaDeg)) return 0
  const thetaRad = (thetaDeg * Math.PI) / 180
  return dnDh * Math.cos(thetaRad)
}

export function relativeCurvature(dnDh: number) {
  return refractionFactor(dnDh)
}

export function radioHorizonWithSurface(heightM: number, surfaceHeightM: number, effectiveRadiusM = EFFECTIVE_RADIUS_STD_M) {
  if (!Number.isFinite(heightM) || !Number.isFinite(surfaceHeightM) || !isPositive(effectiveRadiusM)) return 0
  const effectiveHeight = Math.max(0, heightM - surfaceHeightM)
  return Math.sqrt(2 * effectiveRadiusM * effectiveHeight + Math.pow(effectiveHeight, 2))
}

export function horizonElevationAngle(heightM: number, effectiveRadiusM = EFFECTIVE_RADIUS_STD_M) {
  if (!isPositive(heightM) || !isPositive(effectiveRadiusM)) return 0
  return Math.acos(effectiveRadiusM / (effectiveRadiusM + heightM))
}

export function diffractionRange(radioDistanceKm: number, freqGhz: number) {
  if (!isPositive(radioDistanceKm) || !isPositive(freqGhz)) return 0
  const lambdaM = 0.3 / freqGhz
  return radioDistanceKm + 0.5 * Math.pow(lambdaM, -1 / 3)
}

export function freeSpaceLoss(distanceKm: number, freqMhz: number) {
  if (!isPositive(distanceKm) || !isPositive(freqMhz)) return 0
  return 20 * Math.log10(distanceKm) + 20 * Math.log10(freqMhz) + 32.44
}

export function airGroundRange(aircraftAltitudeM: number, groundAltitudeM = 2) {
  if (!isPositive(aircraftAltitudeM) || !isPositive(groundAltitudeM)) return 0
  return 4.1 * (Math.sqrt(aircraftAltitudeM) + Math.sqrt(groundAltitudeM))
}

export function airToAirRange(altitude1M: number, altitude2M: number) {
  if (!isPositive(altitude1M) || !isPositive(altitude2M)) return 0
  return 4.1 * (Math.sqrt(altitude1M) + Math.sqrt(altitude2M))
}

export function minAltitudeForRange(distanceKm: number, groundAltitudeM = 2) {
  if (!isPositive(distanceKm) || !isPositive(groundAltitudeM)) return 0
  const term = distanceKm / 4.1 - Math.sqrt(groundAltitudeM)
  return Math.pow(Math.max(0, term), 2)
}

export function radarMaxRange(radarAltitudeM: number, targetAltitudeM: number) {
  if (!isPositive(radarAltitudeM) || !isPositive(targetAltitudeM)) return 0
  return 4.1 * (Math.sqrt(radarAltitudeM) + Math.sqrt(targetAltitudeM))
}

export function radarDetectionRange(params: {
  peakPowerW: number
  antennaGainDbi: number
  wavelengthM: number
  rcsDm2: number
  systemLossDb: number
  minSnrDb: number
  tempK: number
  bandwidthHz: number
}) {
  const { peakPowerW, antennaGainDbi, wavelengthM, rcsDm2, systemLossDb, minSnrDb, tempK, bandwidthHz } = params
  if (
    !isPositive(peakPowerW) || !isPositive(wavelengthM) || !isPositive(rcsDm2) ||
    !isPositive(tempK) || !isPositive(bandwidthHz)
  ) return 0

  const gainLinear = Math.pow(10, antennaGainDbi / 10)
  const lossLinear = Math.pow(10, systemLossDb / 10)
  const snrLinear  = Math.pow(10, minSnrDb / 10)
  const sigmaM2    = rcsDm2 / 100
  const boltzmann  = 1.38e-23

  const numerator   = peakPowerW * gainLinear * gainLinear * wavelengthM ** 2 * sigmaM2
  const denominator = Math.pow(4 * Math.PI, 3) * boltzmann * tempK * bandwidthHz * snrLinear * lossLinear

  if (denominator <= 0) return 0
  return Math.pow(numerator / denominator, 0.25) / 1000
}

// ── Fresnel Zone Radius ───────────────────────────────────────────────────────
// First Fresnel zone radius at midpoint: R1 = sqrt(λ × d1 × d2 / (d1 + d2))
// For midpoint: d1 = d2 = d/2, so R1 = sqrt(λ × d / 4)
// Standard approximation: R1 ≈ 17.32 × sqrt(d_km / (4 × f_GHz))  [m]
// Recommended 60% clearance of R1 for acceptable link margin.
export type FresnelResult = {
  r1Radiusm: number   // 1st Fresnel zone radius at midpoint [m]
  clearanceM: number  // min recommended 60% clearance [m]
}

export function fresnelZoneRadius(distanceKm: number, freqGhz: number, fraction = 1): FresnelResult {
  if (!isPositive(distanceKm) || !isPositive(freqGhz)) return { r1Radiusm: 0, clearanceM: 0 }
  const r1Radiusm = 17.32 * Math.sqrt(distanceKm / (4 * freqGhz)) * fraction
  return { r1Radiusm, clearanceM: r1Radiusm * 0.6 }
}