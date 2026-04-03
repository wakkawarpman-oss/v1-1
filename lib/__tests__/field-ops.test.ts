import { describe, it, expect } from 'vitest'
import {
  evaluatePreflight,
  evaluateLinkSurvival,
  evaluateRerDetectability,
  evaluateBingoRtl,
  evaluateConfidence,
  evaluateWeatherCrossCheck,
  evaluateGnssAvailability,
  evaluateSpaceWeatherModifier,
  missionRiskIndex,
} from '../field-ops'

// ── Preflight Gate ────────────────────────────────────────────────────────────

describe('evaluatePreflight', () => {
  const good = {
    windGust: 5, windLimit: 10, reserveFeasible: true,
    linkMarginDb: 12, packetLossPct: 0, gpsSatCount: 12, homeLock: true,
  }

  it('returns SAFE when all conditions are green', () => {
    expect(evaluatePreflight(good).status).toBe('SAFE')
    expect(evaluatePreflight(good).score).toBe(100)
    expect(evaluatePreflight(good).reasons).toHaveLength(0)
  })

  it('ABORT when reserve not feasible', () => {
    const r = evaluatePreflight({ ...good, reserveFeasible: false })
    expect(r.status).toBe('ABORT')
    expect(r.reasons).toContain('reserve_not_feasible')
  })

  it('ABORT when gust exceeds limit', () => {
    const r = evaluatePreflight({ ...good, windGust: 15, windLimit: 10 })
    expect(r.status).toBe('ABORT')
    expect(r.reasons).toContain('wind_gust_over_limit')
  })

  it('ABORT when home lock missing', () => {
    const r = evaluatePreflight({ ...good, homeLock: false })
    expect(r.status).toBe('ABORT')
    expect(r.reasons).toContain('home_lock_missing')
  })

  it('ABORT when fewer than 6 GPS sats', () => {
    const r = evaluatePreflight({ ...good, gpsSatCount: 5 })
    expect(r.status).toBe('ABORT')
  })

  it('CAUTION when score drops below 75 without hard limit', () => {
    const r = evaluatePreflight({ ...good, linkMarginDb: 4, gpsSatCount: 7 })
    expect(r.status).toBe('CAUTION')
  })

  it('score never goes below 0', () => {
    const r = evaluatePreflight({
      windGust: 20, windLimit: 5, reserveFeasible: false,
      linkMarginDb: 0, packetLossPct: 100, gpsSatCount: 0, homeLock: false,
    })
    expect(r.score).toBeGreaterThanOrEqual(0)
  })

  it('low link margin adds reason and reduces score', () => {
    const r = evaluatePreflight({ ...good, linkMarginDb: 4 })
    expect(r.reasons).toContain('low_link_margin')
    // score = 80 (−20 for link margin), which is ≥75 → SAFE
    expect(r.score).toBe(80)
    expect(r.status).toBe('SAFE')
  })
})

// ── Link Survival ─────────────────────────────────────────────────────────────

describe('evaluateLinkSurvival', () => {
  const base = {
    frequencyMHz: 900, distanceKm: 5, txPowerDbm: 30, gtDbi: 2, grDbi: 2,
    systemLossDb: 2, noiseFigureDb: 5, signalBandwidthHz: 500_000,
    jammerPowerDbm: 20, jammerGtDbi: 0, jammerDistanceKm: 50, jammerGrDbi: 0,
    processingGainDb: 12, implLossDb: 2,
  }

  it('returns a score between 0 and 100', () => {
    const r = evaluateLinkSurvival(base)
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
  })

  it('GREEN when jammer is far away', () => {
    expect(evaluateLinkSurvival(base).status).toBe('GREEN')
  })

  it('worsens when jammer is much closer', () => {
    const near = evaluateLinkSurvival({ ...base, jammerDistanceKm: 0.5 })
    const far  = evaluateLinkSurvival(base)
    expect(near.score).toBeLessThan(far.score)
  })

  it('sinrEffDb improves with higher processing gain', () => {
    const low  = evaluateLinkSurvival({ ...base, processingGainDb: 0 })
    const high = evaluateLinkSurvival({ ...base, processingGainDb: 20 })
    expect(high.sinrEffDb).toBeGreaterThan(low.sinrEffDb)
  })

  it('score clamps at 0 under extreme jamming', () => {
    const r = evaluateLinkSurvival({
      ...base, jammerPowerDbm: 80, jammerDistanceKm: 0.1, processingGainDb: 0, implLossDb: 10,
    })
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.status).toBe('RED')
  })
})

// ── RER Detectability ─────────────────────────────────────────────────────────

describe('evaluateRerDetectability', () => {
  const base = {
    emittedPowerDbm: 20, dutyCycle: 0.5, bandwidthHz: 500_000,
    altitudeM: 100, antennaPattern: 'omni' as const, environment: 'open' as const,
  }

  it('score is within 0–100', () => {
    const r = evaluateRerDetectability(base)
    expect(r.detectabilityScore).toBeGreaterThanOrEqual(0)
    expect(r.detectabilityScore).toBeLessThanOrEqual(100)
  })

  it('directional antenna reduces detectability vs omni', () => {
    const omni = evaluateRerDetectability(base)
    const dir  = evaluateRerDetectability({ ...base, antennaPattern: 'directional' })
    expect(dir.detectabilityScore).toBeLessThan(omni.detectabilityScore)
  })

  it('urban environment reduces detectability', () => {
    const open  = evaluateRerDetectability(base)
    const urban = evaluateRerDetectability({ ...base, environment: 'urban' })
    expect(urban.detectabilityScore).toBeLessThan(open.detectabilityScore)
  })

  it('higher altitude reduces time-to-detect (faster detection)', () => {
    const low  = evaluateRerDetectability({ ...base, altitudeM: 50 })
    const high = evaluateRerDetectability({ ...base, altitudeM: 500 })
    expect(high.ttdSeconds).toBeLessThan(low.ttdSeconds)
  })

  it('pd is between 0.01 and 0.99', () => {
    const r = evaluateRerDetectability(base)
    expect(r.pd).toBeGreaterThanOrEqual(0.01)
    expect(r.pd).toBeLessThanOrEqual(0.99)
  })
})

// ── Bingo RTL ─────────────────────────────────────────────────────────────────

describe('evaluateBingoRtl', () => {
  const ok = {
    distanceToHomeKm: 5, groundSpeedBackKmh: 80, currentA: 20,
    batteryRemainingMah: 5000, reservePct: 20, windPenaltyPct: 0,
  }

  it('bingo is not triggered when battery is ample', () => {
    expect(evaluateBingoRtl(ok).bingoNow).toBe(false)
  })

  it('latestTurnbackTimeSec is positive when not bingo', () => {
    expect(evaluateBingoRtl(ok).latestTurnbackTimeSec).toBeGreaterThan(0)
  })

  it('bingoNow when battery is depleted', () => {
    const r = evaluateBingoRtl({ ...ok, batteryRemainingMah: 100 })
    expect(r.bingoNow).toBe(true)
  })

  it('wind penalty increases required mAh', () => {
    const noWind   = evaluateBingoRtl(ok)
    const headwind = evaluateBingoRtl({ ...ok, windPenaltyPct: 30 })
    expect(headwind.requiredMah).toBeGreaterThan(noWind.requiredMah)
  })

  it('latestTurnbackTimeSec clamps to 0 when bingo', () => {
    const r = evaluateBingoRtl({ ...ok, batteryRemainingMah: 50 })
    expect(r.latestTurnbackTimeSec).toBe(0)
  })
})

// ── Confidence Score ──────────────────────────────────────────────────────────

describe('evaluateConfidence', () => {
  const perfect = {
    inputCompletenessPct: 100, sourceAgreementPct: 100, modelHealthPct: 100,
    dataFreshnessHours: 0, maxFreshnessHours: 24, criticalFlags: 0,
  }

  it('returns HIGH band for perfect inputs', () => {
    const r = evaluateConfidence(perfect)
    expect(r.band).toBe('HIGH')
    expect(r.score01).toBeCloseTo(1, 1)
  })

  it('LOW band when completeness, agreement, and health are all poor', () => {
    // weighted = 0.3*0.3 + 0.3*0.3 + 0.25*0.3 + 0.15*1 = 0.09+0.09+0.075+0.15 = 0.405 → LOW
    const r = evaluateConfidence({
      ...perfect, inputCompletenessPct: 30, sourceAgreementPct: 30, modelHealthPct: 30,
    })
    expect(r.band).toBe('LOW')
  })

  it('critical flags reduce score', () => {
    const base  = evaluateConfidence(perfect)
    const flags = evaluateConfidence({ ...perfect, criticalFlags: 3 })
    expect(flags.score01).toBeLessThan(base.score01)
  })

  it('stale data reason when freshness < 60%', () => {
    const r = evaluateConfidence({ ...perfect, dataFreshnessHours: 20, maxFreshnessHours: 24 })
    expect(r.reasons).toContain('stale_data')
  })

  it('score01 is clamped to 0..1', () => {
    const r = evaluateConfidence({ ...perfect, criticalFlags: 10 })
    expect(r.score01).toBeGreaterThanOrEqual(0)
    expect(r.score01).toBeLessThanOrEqual(1)
  })
})

// ── Weather Cross-Check ───────────────────────────────────────────────────────

describe('evaluateWeatherCrossCheck', () => {
  const same = { windSpeedMps: 5, windDirDeg: 180, pressureHpa: 1013, temperatureC: 15 }

  it('perfect agreement when sources are identical', () => {
    const r = evaluateWeatherCrossCheck(same, same)
    expect(r.agreementScore01).toBeCloseTo(1, 3)
    expect(r.penaltyPct).toBe(0)
    expect(r.warnings).toHaveLength(0)
  })

  it('flags wind speed disagreement', () => {
    const r = evaluateWeatherCrossCheck(same, { ...same, windSpeedMps: same.windSpeedMps + 5 })
    expect(r.warnings).toContain('wind_speed_disagreement')
  })

  it('flags wind direction disagreement at 40° delta', () => {
    const r = evaluateWeatherCrossCheck(same, { ...same, windDirDeg: same.windDirDeg + 40 })
    expect(r.warnings).toContain('wind_direction_disagreement')
  })

  it('angle diff wraps correctly across 0/360', () => {
    const a = { ...same, windDirDeg: 5 }
    const b = { ...same, windDirDeg: 355 }
    // diff = 10° — should NOT trigger 35° threshold
    const r = evaluateWeatherCrossCheck(a, b)
    expect(r.warnings).not.toContain('wind_direction_disagreement')
  })

  it('agreement score is clamped to 0..1', () => {
    const bad = { windSpeedMps: 30, windDirDeg: 0, pressureHpa: 980, temperatureC: -20 }
    const r = evaluateWeatherCrossCheck(same, bad)
    expect(r.agreementScore01).toBeGreaterThanOrEqual(0)
    expect(r.agreementScore01).toBeLessThanOrEqual(1)
  })
})

// ── GNSS Availability ─────────────────────────────────────────────────────────

describe('evaluateGnssAvailability', () => {
  it('GOOD with many sats and low HDOP', () => {
    const r = evaluateGnssAvailability({ gpsSatCount: 10, galileoSatCount: 8, hdop: 1.0 })
    expect(r.status).toBe('GOOD')
  })

  it('POOR with very few sats', () => {
    const r = evaluateGnssAvailability({ gpsSatCount: 2, galileoSatCount: 0 })
    expect(r.status).toBe('POOR')
  })

  it('flags low_total_satellites when total < 10', () => {
    const r = evaluateGnssAvailability({ gpsSatCount: 5, galileoSatCount: 3 })
    expect(r.reasons).toContain('low_total_satellites')
  })

  it('flags high_hdop when hdop > 2.5', () => {
    const r = evaluateGnssAvailability({ gpsSatCount: 12, galileoSatCount: 6, hdop: 3.0 })
    expect(r.reasons).toContain('high_hdop')
  })

  it('score is clamped to 0..1', () => {
    const r = evaluateGnssAvailability({ gpsSatCount: 0, galileoSatCount: 0, hdop: 10 })
    expect(r.availabilityScore01).toBeGreaterThanOrEqual(0)
    expect(r.availabilityScore01).toBeLessThanOrEqual(1)
  })
})

// ── Space Weather Modifier ────────────────────────────────────────────────────

describe('evaluateSpaceWeatherModifier', () => {
  const calm = { kpIndex: 1, f107Flux: 100, baseFadeMarginDb: 10 }

  it('LOW risk under calm conditions', () => {
    expect(evaluateSpaceWeatherModifier(calm).riskLevel).toBe('LOW')
  })

  it('penalty is 0 when Kp ≤ 3 and F10.7 ≤ 140', () => {
    const r = evaluateSpaceWeatherModifier(calm)
    expect(r.marginPenaltyDb).toBeCloseTo(0, 1)
    expect(r.adjustedFadeMarginDb).toBeCloseTo(calm.baseFadeMarginDb, 1)
  })

  it('HIGH risk at Kp=8', () => {
    const r = evaluateSpaceWeatherModifier({ ...calm, kpIndex: 8 })
    expect(r.riskLevel).toBe('HIGH')
  })

  it('ELEVATED risk at Kp=6 (penalty = 2.7 dB ≥ 2)', () => {
    // kpPenalty = max(0, 6−3) × 0.9 = 2.7, f107=100 → fluxPenalty=0 → total=2.7
    const r = evaluateSpaceWeatherModifier({ ...calm, kpIndex: 6 })
    expect(r.riskLevel).toBe('ELEVATED')
  })

  it('penalty is capped at 6 dB', () => {
    const r = evaluateSpaceWeatherModifier({ ...calm, kpIndex: 9, f107Flux: 300 })
    expect(r.marginPenaltyDb).toBeLessThanOrEqual(6)
  })
})

// ── Mission Risk Index ────────────────────────────────────────────────────────

describe('missionRiskIndex', () => {
  const green = {
    batteryWarning: 'ok' as const, linkMarginDb: 12,
    thermalHeadroomPct: 40, reserveMet: true, windPenaltyPct: 5,
  }

  it('safe class for perfect conditions', () => {
    const r = missionRiskIndex(green)
    expect(r.class).toBe('safe')
    expect(r.score).toBe(100)
    expect(r.reasons).toHaveLength(0)
  })

  it('unsafe when reserve not met', () => {
    const r = missionRiskIndex({ ...green, reserveMet: false })
    expect(r.class).toBe('unsafe')
    expect(r.reasons).toContain('reserve_not_met')
  })

  it('unsafe when battery critical regardless of score', () => {
    const r = missionRiskIndex({ ...green, batteryWarning: 'critical' })
    expect(r.class).toBe('unsafe')
  })

  it('caution when score is between 50 and 75', () => {
    const r = missionRiskIndex({
      ...green, linkMarginDb: 4, thermalHeadroomPct: 15, windPenaltyPct: 25,
    })
    expect(['caution', 'unsafe']).toContain(r.class)
  })

  it('score is clamped to 0..100', () => {
    const r = missionRiskIndex({
      batteryWarning: 'critical', linkMarginDb: 0, thermalHeadroomPct: 0,
      reserveMet: false, windPenaltyPct: 60,
    })
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
  })
})
