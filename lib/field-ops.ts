// ── Field Operations Suite ────────────────────────────────────────────────────
//
// Four P0 decision tools for UAV field operations:
//   1. Preflight Gate   – go/no-go with score + reasons
//   2. Link Survival    – SINR-based jamming survivability (full link budget)
//   3. RER Detectability – RF emission detectability by threat receivers
//   4. Bingo RTL        – latest safe turn-back point for battery margin
//
// Five support modules that feed into confidence-rated verdicts:
//   5. Confidence Score  – aggregate reliability of a decision
//   6. Weather Cross-Check – dual-source weather agreement
//   7. GNSS Availability – satellite quality scoring
//   8. Space Weather     – ionospheric/RF penalty from Kp + F10.7
//   9. Mission Risk Index – unified mission score (0–100, safe/caution/unsafe)
//
// All pure functions — no I/O, no side effects.
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared helpers ────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/** Free-space path loss (dB), Friis / ITU-R P.525-4 */
function fsplDb(frequencyMHz: number, distanceKm: number): number {
  if (frequencyMHz <= 0 || distanceKm <= 0) return 0
  return 32.44 + 20 * Math.log10(frequencyMHz) + 20 * Math.log10(distanceKm)
}

function dbmToMw(dbm: number): number {
  return Math.pow(10, dbm / 10)
}

function mwToDbm(mw: number): number {
  if (mw <= 0) return -Infinity
  return 10 * Math.log10(mw)
}

function ratioToDb(value: number): number {
  if (value <= 0) return -Infinity
  return 10 * Math.log10(value)
}

// ── 1. Preflight Gate ─────────────────────────────────────────────────────────

export type RiskStatus = 'SAFE' | 'CAUTION' | 'ABORT'

export type PreflightInput = {
  /** Measured gust speed, m/s */
  windGust: number
  /** UAV-rated wind limit, m/s */
  windLimit: number
  /** RTL reserve battery feasible */
  reserveFeasible: boolean
  /** Link margin at launch point, dB */
  linkMarginDb: number
  /** Current packet loss, % */
  packetLossPct: number
  /** Number of locked GPS satellites */
  gpsSatCount: number
  /** Home point locked in GCS */
  homeLock: boolean
}

export type PreflightResult = {
  status: RiskStatus
  /** 0–100 — overall readiness score */
  score: number
  /** Machine-readable reason codes for each penalty applied */
  reasons: string[]
}

/**
 * Evaluates pre-flight conditions and returns a go/no-go verdict.
 * ABORT is forced when any hard-limit is violated (reserve, gust, home lock,
 * or fewer than 6 GPS sats). CAUTION when score < 75.
 */
export function evaluatePreflight(input: PreflightInput): PreflightResult {
  const reasons: string[] = []
  let score = 100

  if (!input.reserveFeasible) { reasons.push('reserve_not_feasible'); score -= 40 }
  if (input.windGust > input.windLimit) { reasons.push('wind_gust_over_limit'); score -= 35 }
  if (input.linkMarginDb < 6) { reasons.push('low_link_margin'); score -= 20 }
  if (input.packetLossPct > 20) { reasons.push('high_packet_loss'); score -= 15 }
  if (input.gpsSatCount < 8) { reasons.push('low_gps_sat_count'); score -= 20 }
  if (!input.homeLock) { reasons.push('home_lock_missing'); score -= 30 }

  score = clamp(score, 0, 100)

  const hardAbort =
    !input.reserveFeasible ||
    input.windGust > input.windLimit ||
    !input.homeLock ||
    input.gpsSatCount < 6

  const status: RiskStatus = hardAbort ? 'ABORT' : score < 75 ? 'CAUTION' : 'SAFE'
  return { status, score, reasons }
}

// ── 2. Link Survival ──────────────────────────────────────────────────────────

export type LinkBandStatus = 'GREEN' | 'YELLOW' | 'RED'

export type LinkSurvivalInput = {
  /** Carrier frequency, MHz */
  frequencyMHz: number
  /** GCS-to-UAV distance, km */
  distanceKm: number
  /** GCS transmit power, dBm */
  txPowerDbm: number
  /** GCS antenna gain, dBi */
  gtDbi: number
  /** UAV receive antenna gain (toward GCS), dBi */
  grDbi: number
  /** Total system loss (cable, connector), dB */
  systemLossDb: number
  /** Receiver noise figure, dB */
  noiseFigureDb: number
  /** Signal occupied bandwidth, Hz */
  signalBandwidthHz: number
  /** Jammer transmit power, dBm */
  jammerPowerDbm: number
  /** Jammer antenna gain (toward UAV), dBi */
  jammerGtDbi: number
  /** Jammer-to-UAV distance, km */
  jammerDistanceKm: number
  /** UAV receive antenna gain toward jammer, dBi */
  jammerGrDbi: number
  /** Spread-spectrum / coding gain, dB */
  processingGainDb: number
  /** Implementation loss (mismatch, ADC, etc.), dB */
  implLossDb: number
}

export type LinkSurvivalResult = {
  status: LinkBandStatus
  /** 0–100 score */
  score: number
  /** Received signal power at UAV, dBm */
  signalDbm: number
  /** Received jammer power at UAV, dBm */
  jammerDbm: number
  /** Effective SINR after processing gain, dB */
  sinrEffDb: number
}

/**
 * Full link-budget survivability analysis.
 * Computes received SINR against both thermal noise and an active jammer.
 * Uses FSPL (Friis) for both signal and jamming paths.
 */
export function evaluateLinkSurvival(input: LinkSurvivalInput): LinkSurvivalResult {
  const signalFspl = fsplDb(input.frequencyMHz, input.distanceKm)
  const jammerFspl = fsplDb(input.frequencyMHz, input.jammerDistanceKm)

  const signalDbm =
    input.txPowerDbm + input.gtDbi + input.grDbi - signalFspl - input.systemLossDb
  const jammerDbm =
    input.jammerPowerDbm + input.jammerGtDbi + input.jammerGrDbi - jammerFspl - input.systemLossDb

  // Thermal noise: N = kTB × NF  → in dBm: −174 + 10log10(BHz) + NF
  const noiseDbm =
    -174 + 10 * Math.log10(Math.max(1, input.signalBandwidthHz)) + input.noiseFigureDb

  const sMw = dbmToMw(signalDbm)
  const jMw = dbmToMw(jammerDbm)
  const nMw = dbmToMw(noiseDbm)

  const sinrLin = sMw / Math.max(1e-12, jMw + nMw)
  const sinrDb = ratioToDb(sinrLin)
  const sinrEffDb = sinrDb + input.processingGainDb - input.implLossDb

  const score = clamp((sinrEffDb + 15) * 4, 0, 100)

  let status: LinkBandStatus = 'GREEN'
  if (score < 40) status = 'RED'
  else if (score < 70) status = 'YELLOW'

  return {
    status,
    score,
    signalDbm,
    jammerDbm,
    sinrEffDb: Number.isFinite(sinrEffDb) ? sinrEffDb : mwToDbm(1e-12),
  }
}

// ── 3. RER Detectability ──────────────────────────────────────────────────────

export type AntennaPatternClass = 'omni' | 'sector' | 'directional'
export type EnvClass = 'open' | 'urban' | 'mixed'

export type RerInput = {
  /** UAV emitted power, dBm */
  emittedPowerDbm: number
  /** Duty cycle 0–1 */
  dutyCycle: number
  /** Emission bandwidth, Hz */
  bandwidthHz: number
  /** Flight altitude AGL, m */
  altitudeM: number
  antennaPattern: AntennaPatternClass
  environment: EnvClass
}

export type RerResult = {
  /** 0–100 — how easy the UAV is to detect (higher = more detectable) */
  detectabilityScore: number
  /** Probability of detection */
  pd: number
  /** Probability of false alarm */
  pfa: number
  /** Estimated time-to-detect, seconds */
  ttdSeconds: number
}

/**
 * Estimates RF detectability of UAV emissions by a passive threat receiver.
 * Lower score = harder to detect = better for the UAV.
 */
export function evaluateRerDetectability(input: RerInput): RerResult {
  const bwTerm = Math.log10(Math.max(1, input.bandwidthHz))
  const duty = clamp(input.dutyCycle, 0.01, 1)

  const patternPenalty =
    input.antennaPattern === 'directional' ? -8 :
    input.antennaPattern === 'sector' ? -4 : 0

  const envPenalty =
    input.environment === 'urban' ? -6 :
    input.environment === 'mixed' ? -3 : 0

  const raw = input.emittedPowerDbm - 10 * bwTerm + 20 * duty + patternPenalty + envPenalty
  const detectabilityScore = clamp(raw + 60, 0, 100)

  const pd = clamp(detectabilityScore / 100, 0.01, 0.99)
  const pfa = clamp(0.2 - pd * 0.18, 0.01, 0.2)
  const altitudeFactor = clamp(1 + input.altitudeM / 2000, 1, 2)
  const ttdSeconds = clamp((120 - detectabilityScore) * 0.8 / altitudeFactor, 5, 120)

  return { detectabilityScore, pd, pfa, ttdSeconds }
}

// ── 4. Bingo RTL ──────────────────────────────────────────────────────────────

export type BingoInput = {
  /** Current straight-line distance to home, km */
  distanceToHomeKm: number
  /** Expected ground speed on return leg, km/h */
  groundSpeedBackKmh: number
  /** Current draw, A */
  currentA: number
  /** Remaining battery, mAh */
  batteryRemainingMah: number
  /** Reserve to keep, % of total battery */
  reservePct: number
  /** Wind penalty on return speed, % reduction */
  windPenaltyPct: number
}

export type BingoOutput = {
  /** True when the UAV should turn around NOW */
  bingoNow: boolean
  /** mAh required to reach home + reserve */
  requiredMah: number
  /** mAh currently available */
  availableMah: number
  /** Seconds remaining before bingo point is reached */
  latestTurnbackTimeSec: number
}

/**
 * Computes whether the UAV must turn back immediately (bingo state)
 * and how many seconds remain before that point.
 * Accounts for headwind penalty on the return leg.
 */
export function evaluateBingoRtl(input: BingoInput): BingoOutput {
  const safeSpeed = Math.max(5, input.groundSpeedBackKmh * (1 - input.windPenaltyPct / 100))
  const returnTimeH = input.distanceToHomeKm / safeSpeed

  const baseRequiredMah = input.currentA * returnTimeH * 1000
  const reserveMah = input.batteryRemainingMah * (input.reservePct / 100)
  const requiredMah = baseRequiredMah + reserveMah
  const availableMah = input.batteryRemainingMah

  const marginMah = availableMah - requiredMah
  const latestTurnbackTimeSec = clamp(
    (marginMah / Math.max(1, input.currentA * 1000)) * 3600,
    0,
    3600,
  )

  return { bingoNow: marginMah <= 0, requiredMah, availableMah, latestTurnbackTimeSec }
}

// ── 5. Confidence Score ───────────────────────────────────────────────────────

export type ConfidenceBand = 'HIGH' | 'MEDIUM' | 'LOW'

export type ConfidenceInput = {
  /** 0–100: fraction of required inputs that are present */
  inputCompletenessPct: number
  /** 0–100: agreement between independent data sources */
  sourceAgreementPct: number
  /** 0–100: health of the underlying models/data pipelines */
  modelHealthPct: number
  /** Age of most stale input, hours */
  dataFreshnessHours: number
  /** Maximum acceptable data age, hours */
  maxFreshnessHours: number
  /** Count of active critical flags */
  criticalFlags: number
}

export type ConfidenceWeights = {
  inputCompleteness: number
  sourceAgreement: number
  modelHealth: number
  dataFreshness: number
}

export type ConfidenceResult = {
  /** 0–1 */
  score01: number
  band: ConfidenceBand
  reasons: string[]
}

const DEFAULT_CONFIDENCE_WEIGHTS: ConfidenceWeights = {
  inputCompleteness: 0.3,
  sourceAgreement: 0.3,
  modelHealth: 0.25,
  dataFreshness: 0.15,
}

export function evaluateConfidence(
  input: ConfidenceInput,
  weights: ConfidenceWeights = DEFAULT_CONFIDENCE_WEIGHTS,
): ConfidenceResult {
  const reasons: string[] = []

  const completeness = clamp(input.inputCompletenessPct / 100, 0, 1)
  const agreement = clamp(input.sourceAgreementPct / 100, 0, 1)
  const health = clamp(input.modelHealthPct / 100, 0, 1)
  const freshnessRaw =
    input.maxFreshnessHours <= 0 ? 0 : 1 - input.dataFreshnessHours / input.maxFreshnessHours
  const freshness = clamp(freshnessRaw, 0, 1)

  if (completeness < 0.7) reasons.push('low_input_completeness')
  if (agreement < 0.7) reasons.push('low_source_agreement')
  if (health < 0.75) reasons.push('model_health_degraded')
  if (freshness < 0.6) reasons.push('stale_data')

  const weighted =
    completeness * weights.inputCompleteness +
    agreement * weights.sourceAgreement +
    health * weights.modelHealth +
    freshness * weights.dataFreshness

  const flagPenalty = clamp(input.criticalFlags * 0.08, 0, 0.4)
  const score01 = clamp(weighted - flagPenalty, 0, 1)

  let band: ConfidenceBand = 'HIGH'
  if (score01 < 0.5) band = 'LOW'
  else if (score01 < 0.75) band = 'MEDIUM'

  return { score01, band, reasons }
}

// ── 6. Weather Cross-Check ────────────────────────────────────────────────────

export type WeatherPoint = {
  windSpeedMps: number
  windDirDeg: number
  pressureHpa: number
  temperatureC: number
}

export type WeatherThresholds = {
  windSpeedDiffMps: number
  windDirDiffDeg: number
  pressureDiffHpa: number
  temperatureDiffC: number
}

export type WeatherCrossCheckResult = {
  /** 0–1 */
  agreementScore01: number
  /** % confidence penalty to apply to downstream decisions */
  penaltyPct: number
  warnings: string[]
}

const DEFAULT_WEATHER_THRESHOLDS: WeatherThresholds = {
  windSpeedDiffMps: 3,
  windDirDiffDeg: 35,
  pressureDiffHpa: 4,
  temperatureDiffC: 3,
}

function angleDiff(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360
  return raw > 180 ? 360 - raw : raw
}

/**
 * Compares two weather data sources and flags disagreements.
 * Returns a penaltyPct to subtract from downstream confidence scores.
 */
export function evaluateWeatherCrossCheck(
  providerA: WeatherPoint,
  providerB: WeatherPoint,
  thresholds: WeatherThresholds = DEFAULT_WEATHER_THRESHOLDS,
): WeatherCrossCheckResult {
  const warnings: string[] = []
  let penaltyPct = 0

  if (Math.abs(providerA.windSpeedMps - providerB.windSpeedMps) > thresholds.windSpeedDiffMps) {
    warnings.push('wind_speed_disagreement'); penaltyPct += 20
  }
  if (angleDiff(providerA.windDirDeg, providerB.windDirDeg) > thresholds.windDirDiffDeg) {
    warnings.push('wind_direction_disagreement'); penaltyPct += 20
  }
  if (Math.abs(providerA.pressureHpa - providerB.pressureHpa) > thresholds.pressureDiffHpa) {
    warnings.push('pressure_disagreement'); penaltyPct += 10
  }
  if (Math.abs(providerA.temperatureC - providerB.temperatureC) > thresholds.temperatureDiffC) {
    warnings.push('temperature_disagreement'); penaltyPct += 10
  }

  penaltyPct = clamp(penaltyPct, 0, 70)
  const agreementScore01 = clamp(1 - penaltyPct / 100, 0, 1)
  return { agreementScore01, penaltyPct, warnings }
}

// ── 7. GNSS Availability ──────────────────────────────────────────────────────

export type GnssInput = {
  gpsSatCount: number
  galileoSatCount: number
  /** Horizontal Dilution of Precision (default 1.2 when unknown) */
  hdop?: number
}

export type GnssResult = {
  /** 0–1 */
  availabilityScore01: number
  status: 'GOOD' | 'DEGRADED' | 'POOR'
  reasons: string[]
}

/**
 * Scores GNSS quality from satellite count (GPS + Galileo) and HDOP.
 * POOR < 0.45, DEGRADED < 0.7, GOOD ≥ 0.7.
 */
export function evaluateGnssAvailability(input: GnssInput): GnssResult {
  const reasons: string[] = []
  const totalSat = Math.max(0, input.gpsSatCount) + Math.max(0, input.galileoSatCount)
  const satScore = clamp((totalSat - 6) / 14, 0, 1)

  const hdop = input.hdop ?? 1.2
  const hdopScore = clamp((4 - hdop) / 3, 0, 1)

  if (totalSat < 10) reasons.push('low_total_satellites')
  if (hdop > 2.5) reasons.push('high_hdop')

  const availabilityScore01 = clamp(satScore * 0.75 + hdopScore * 0.25, 0, 1)

  let status: GnssResult['status'] = 'GOOD'
  if (availabilityScore01 < 0.45) status = 'POOR'
  else if (availabilityScore01 < 0.7) status = 'DEGRADED'

  return { availabilityScore01, status, reasons }
}

// ── 8. Space Weather Modifier ─────────────────────────────────────────────────

export type SpaceWeatherInput = {
  /** Kp geomagnetic index, 0–9 */
  kpIndex: number
  /** Solar flux index F10.7 (SFU) — typical 70–300 */
  f107Flux: number
  /** Nominal fade margin of the link, dB */
  baseFadeMarginDb: number
}

export type SpaceWeatherResult = {
  riskLevel: 'LOW' | 'ELEVATED' | 'HIGH'
  /** dB subtracted from fade margin due to ionospheric effects */
  marginPenaltyDb: number
  /** Adjusted fade margin after applying penalty */
  adjustedFadeMarginDb: number
  /** % to subtract from downstream confidence */
  confidencePenaltyPct: number
}

/**
 * Applies ionospheric and solar-activity penalties to a link's fade margin.
 * Kp drives short-term geomagnetic disturbance; F10.7 reflects solar trend.
 */
export function evaluateSpaceWeatherModifier(input: SpaceWeatherInput): SpaceWeatherResult {
  const kp = clamp(input.kpIndex, 0, 9)
  const f107 = clamp(input.f107Flux, 60, 320)

  const kpPenalty = Math.max(0, kp - 3) * 0.9
  const fluxPenalty = Math.max(0, (f107 - 140) / 60) * 0.7

  const marginPenaltyDb = clamp(kpPenalty + fluxPenalty, 0, 6)
  const adjustedFadeMarginDb = input.baseFadeMarginDb - marginPenaltyDb
  const confidencePenaltyPct = clamp(marginPenaltyDb * 6, 0, 35)

  let riskLevel: SpaceWeatherResult['riskLevel'] = 'LOW'
  if (marginPenaltyDb >= 4) riskLevel = 'HIGH'
  else if (marginPenaltyDb >= 2) riskLevel = 'ELEVATED'

  return { riskLevel, marginPenaltyDb, adjustedFadeMarginDb, confidencePenaltyPct }
}

// ── 9. Mission Risk Index (MRI) ───────────────────────────────────────────────

export type MissionRiskInput = {
  batteryWarning: 'ok' | 'warning' | 'critical'
  linkMarginDb: number
  thermalHeadroomPct: number
  reserveMet: boolean
  windPenaltyPct?: number
}

export type MissionRiskResult = {
  /** 0–100 — lower is more risky */
  score: number
  class: 'safe' | 'caution' | 'unsafe'
  reasons: string[]
}

/**
 * Single integrated mission readiness score.
 * Starts at 100 and subtracts penalty per risk factor.
 * Forces 'unsafe' when reserve or battery is critical.
 */
export function missionRiskIndex(input: MissionRiskInput): MissionRiskResult {
  const reasons: string[] = []
  let score = 100

  if (input.batteryWarning === 'critical') { reasons.push('battery_critical'); score -= 45 }
  else if (input.batteryWarning === 'warning') { reasons.push('battery_warning'); score -= 20 }

  if (!input.reserveMet) { reasons.push('reserve_not_met'); score -= 30 }

  if (input.linkMarginDb < 3) { reasons.push('critical_link_margin'); score -= 25 }
  else if (input.linkMarginDb < 6) { reasons.push('low_link_margin'); score -= 12 }

  if (input.thermalHeadroomPct < 10) { reasons.push('critical_thermal_headroom'); score -= 20 }
  else if (input.thermalHeadroomPct < 25) { reasons.push('low_thermal_headroom'); score -= 8 }

  const wind = input.windPenaltyPct ?? 0
  if (wind > 40) { reasons.push('high_wind_penalty'); score -= 15 }
  else if (wind > 20) { reasons.push('moderate_wind_penalty'); score -= 7 }

  score = clamp(score, 0, 100)

  const forceUnsafe = !input.reserveMet || input.batteryWarning === 'critical'

  let cls: MissionRiskResult['class'] = 'safe'
  if (forceUnsafe || score < 50) cls = 'unsafe'
  else if (score < 75) cls = 'caution'

  return { score, class: cls, reasons }
}
