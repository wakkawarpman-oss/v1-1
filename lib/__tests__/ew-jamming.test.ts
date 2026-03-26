import { describe, it, expect } from 'vitest'
import { calculateJammingMargin, jammingRangeM } from '../ew-jamming'

const symmetric = {
  txPowerDbm: 30, txGainDbi: 2, txDistanceM: 5000,
  jammerPowerDbm: 30, jammerGainDbi: 2, jammerDistanceM: 5000,
}

describe('calculateJammingMargin', () => {
  it('J/S = 0 when both signals are identical', () => {
    const r = calculateJammingMargin(symmetric)
    expect(r.jsRatioDb).toBeCloseTo(0, 1)
  })

  it('isJammed = true when J/S = 0 (SNR requirement = 6 dB)', () => {
    const r = calculateJammingMargin(symmetric)
    expect(r.isJammed).toBe(true)
  })

  it('marginDb is negative when jammed', () => {
    const r = calculateJammingMargin(symmetric)
    expect(r.marginDb).toBeLessThan(0)
  })

  it('link survives when UAV is 10× closer to ground station', () => {
    const r = calculateJammingMargin({
      txPowerDbm: 30, txGainDbi: 5, txDistanceM: 1000,
      jammerPowerDbm: 40, jammerGainDbi: 5, jammerDistanceM: 10000,
    })
    expect(r.jsRatioDb).toBeLessThan(-6)
    expect(r.isJammed).toBe(false)
    expect(r.marginDb).toBeGreaterThan(0)
  })

  it('more powerful jammer (10 dB more) suppresses at same geometry', () => {
    const base = calculateJammingMargin(symmetric)
    const boosted = calculateJammingMargin({ ...symmetric, jammerPowerDbm: 40 })
    expect(boosted.jsRatioDb).toBeCloseTo(base.jsRatioDb + 10, 1)
    expect(boosted.isJammed).toBe(true)
  })

  it('J/S improves by 20 dB when jammer moves 10× farther away', () => {
    const near = calculateJammingMargin(symmetric)
    const far  = calculateJammingMargin({ ...symmetric, jammerDistanceM: 50000 })
    expect(far.jsRatioDb).toBeCloseTo(near.jsRatioDb - 20, 0)
  })

  it('directional RX antenna toward station improves link margin', () => {
    const omni = calculateJammingMargin(symmetric)
    const dir  = calculateJammingMargin({ ...symmetric, rxGainTowardsTxDbi: 10, rxGainTowardsJamDbi: -3 })
    expect(dir.marginDb).toBeGreaterThan(omni.marginDb)
  })

  it('signalRssiDbm + txGain offset is consistent with EIRP formula', () => {
    // EIRP_S = txPower + txGain → at 5000 m: RSSI = 32 − 20*log10(5000)
    const r = calculateJammingMargin(symmetric)
    const expected = 32 - 20 * Math.log10(5000)
    expect(r.signalRssiDbm).toBeCloseTo(expected, 1)
  })

  it('custom requiredSnrDb of 3 dB is less demanding than default 6 dB', () => {
    const strict = calculateJammingMargin(symmetric, 6)
    const loose  = calculateJammingMargin(symmetric, 3)
    expect(loose.marginDb).toBeGreaterThan(strict.marginDb)
  })
})

describe('jammingRangeM', () => {
  it('returns finite distance for typical scenario', () => {
    const d = jammingRangeM({
      txPowerDbm: 30, txGainDbi: 5, txDistanceM: 5000,
      jammerPowerDbm: 40, jammerGainDbi: 5, jammerDistanceM: 0,
    })
    expect(d).toBeGreaterThan(0)
    expect(d).toBeLessThan(1_000_000)
  })

  it('higher jammer power increases jamming range', () => {
    const base = { txPowerDbm: 30, txGainDbi: 5, txDistanceM: 5000, jammerGainDbi: 5, jammerDistanceM: 0 }
    const d1 = jammingRangeM({ ...base, jammerPowerDbm: 30 })
    const d2 = jammingRangeM({ ...base, jammerPowerDbm: 40 })
    expect(d2).toBeGreaterThan(d1)
  })

  it('doubling tx distance roughly halves required jammer stand-off', () => {
    const base = { txGainDbi: 3, jammerPowerDbm: 40, jammerGainDbi: 3, jammerDistanceM: 0, txPowerDbm: 30 }
    const d5k  = jammingRangeM({ ...base, txDistanceM: 5000 })
    const d10k = jammingRangeM({ ...base, txDistanceM: 10000 })
    // Moving UAV 2× farther from TX cuts signal by 6 dB → jammer can be 2× farther
    expect(d10k / d5k).toBeCloseTo(2, 0)
  })
})

describe('calculateJammingMargin — bandwidth + processing gain', () => {
  it('bandwidthPenaltyDb = 0 when no bandwidth params provided', () => {
    const r = calculateJammingMargin({
      txPowerDbm: 30, txGainDbi: 2, txDistanceM: 5000,
      jammerPowerDbm: 40, jammerGainDbi: 5, jammerDistanceM: 3000,
    })
    expect(r.bandwidthPenaltyDb).toBe(0)
  })

  it('barrage jammer (100 MHz) vs ELRS (0.5 MHz) → ~23 dB penalty', () => {
    const r = calculateJammingMargin({
      txPowerDbm: 30, txGainDbi: 2, txDistanceM: 5000,
      txBandwidthMhz: 0.5,
      jammerPowerDbm: 47, jammerGainDbi: 5, jammerDistanceM: 3000,
      jammerBandwidthMhz: 100,
    })
    // 10*log10(100/0.5) = 10*log10(200) ≈ 23.01 dB
    expect(r.bandwidthPenaltyDb).toBeCloseTo(23.01, 1)
  })

  it('spot jammer (same BW as signal) → 0 dB penalty', () => {
    const r = calculateJammingMargin({
      txPowerDbm: 30, txGainDbi: 2, txDistanceM: 5000,
      txBandwidthMhz: 0.5,
      jammerPowerDbm: 47, jammerGainDbi: 5, jammerDistanceM: 3000,
      jammerBandwidthMhz: 0.5,
    })
    expect(r.bandwidthPenaltyDb).toBe(0)
  })

  it('50 W barrage jammer at 3 km fails to suppress ELRS at 5 km with 12 dB PG', () => {
    // Without BW/PG this jammer would win; with both it cannot
    const r = calculateJammingMargin({
      txPowerDbm: 30, txGainDbi: 2, txDistanceM: 5000,
      txBandwidthMhz: 0.5,
      processingGainDb: 12,
      jammerPowerDbm: 47, jammerGainDbi: 5, jammerDistanceM: 3000,
      jammerBandwidthMhz: 100,
    })
    expect(r.isJammed).toBe(false)
    expect(r.marginDb).toBeGreaterThan(0)
  })

  it('processing gain reduces effective J/S by PG dB', () => {
    const base = {
      txPowerDbm: 30, txGainDbi: 2, txDistanceM: 5000,
      jammerPowerDbm: 40, jammerGainDbi: 5, jammerDistanceM: 3000,
    }
    const noPg = calculateJammingMargin(base)
    const withPg = calculateJammingMargin({ ...base, processingGainDb: 10 })
    expect(noPg.jsRatioDb - withPg.jsRatioDb).toBeCloseTo(10, 1)
  })

  it('jammingRangeM accounts for bandwidth penalty (barrage less effective)', () => {
    const narrow = jammingRangeM({
      txPowerDbm: 30, txGainDbi: 3, txDistanceM: 5000,
      txBandwidthMhz: 0.5,
      jammerPowerDbm: 47, jammerGainDbi: 5, jammerDistanceM: 0,
      jammerBandwidthMhz: 0.5,
    })
    const barrage = jammingRangeM({
      txPowerDbm: 30, txGainDbi: 3, txDistanceM: 5000,
      txBandwidthMhz: 0.5,
      jammerPowerDbm: 47, jammerGainDbi: 5, jammerDistanceM: 0,
      jammerBandwidthMhz: 100,
    })
    expect(narrow).toBeGreaterThan(barrage)
  })
})
